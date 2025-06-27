/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Define secrets
const pineconeApiKey = defineSecret("PINECONE_API_KEY");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Type definitions
interface ConversationStarterRequest {
  user1Genres: string[];
  user2Genres: string[];
}

interface ConversationStarterResponse {
  starters: string[];
  sharedGenres: string[];
  retrievedCount: number;
}

interface PineconeMatch {
  id: string;
  score: number;
  metadata: {
    genres: string[];
    queryText: string;
    specificity: string;
    text: string;
    type: string;
  };
}

/**
 * Generate conversation starters based on shared gaming genre preferences using RAG
 * 
 * This function:
 * 1. Finds common genres between two users
 * 2. Queries Pinecone index for similar conversation starters
 * 3. Uses OpenAI GPT-3.5-turbo to generate new starters based on retrieved examples
 * 
 * @param data - Object containing user1Genres and user2Genres arrays
 * @returns Promise<ConversationStarterResponse> - Generated conversation starters
 */
export const generateConversationStarters = onCall<ConversationStarterRequest, Promise<ConversationStarterResponse>>(
  { 
    maxInstances: 5,
    secrets: [pineconeApiKey, openaiApiKey]
  },
  async (request) => {
    const { user1Genres, user2Genres } = request.data;

    try {
      logger.info("Generating conversation starters", {
        user1Genres,
        user2Genres,
        timestamp: new Date().toISOString(),
      });

      // Validate input
      if (!user1Genres || !user2Genres) {
        throw new HttpsError(
          "invalid-argument",
          "Both user1Genres and user2Genres are required"
        );
      }

      if (!Array.isArray(user1Genres) || !Array.isArray(user2Genres)) {
        throw new HttpsError(
          "invalid-argument",
          "Genre preferences must be arrays"
        );
      }

      // Find shared genres
      const sharedGenres = findSharedGenres(user1Genres, user2Genres);
      
      logger.info("Found shared genres", { sharedGenres });

      if (sharedGenres.length === 0) {
        // If no shared genres, use all genres from both users for broader search
        const allGenres = [...new Set([...user1Genres, ...user2Genres])];
        return await generateStartersFromGenres(allGenres, []);
      }

      // Generate starters based on shared genres
      return await generateStartersFromGenres(sharedGenres, sharedGenres);

    } catch (error) {
      logger.error("Error generating conversation starters", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        user1Genres,
        user2Genres,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Failed to generate conversation starters"
      );
    }
  }
);

/**
 * Find genres that are common between two users
 * 
 * @param genres1 - First user's genre preferences
 * @param genres2 - Second user's genre preferences
 * @returns Array of shared genres
 */
function findSharedGenres(genres1: string[], genres2: string[]): string[] {
  const set2 = new Set(genres2.map(g => g.toLowerCase()));
  
  return genres1.filter(genre => set2.has(genre.toLowerCase()));
}

/**
 * Generate conversation starters from genres using Pinecone + OpenAI RAG
 * 
 * @param searchGenres - Genres to search for in Pinecone
 * @param sharedGenres - Original shared genres for response
 * @returns ConversationStarterResponse
 */
async function generateStartersFromGenres(
  searchGenres: string[],
  sharedGenres: string[]
): Promise<ConversationStarterResponse> {
  try {
    // Initialize Pinecone at runtime
    const pinecone = new Pinecone({
      apiKey: pineconeApiKey.value(),
    });
    
    // Get Pinecone index
    const index = pinecone.index("gaming-conversation-starters");

    // Create query text for embedding
    const queryText = searchGenres.length > 0 
      ? `shared genres: ${searchGenres.join(", ")}`
      : "gaming conversation starters";

    logger.info("Querying Pinecone", { queryText, searchGenres });

    // Initialize OpenAI at runtime
    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
    });
    
    // Get embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryText,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Query Pinecone for similar conversation starters
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 10, // Get top 10 matches
      includeMetadata: true,
      filter: searchGenres.length > 0 ? {
        genres: { $in: searchGenres }
      } : undefined,
    });

    const matches = queryResponse.matches as PineconeMatch[];
    logger.info("Retrieved matches from Pinecone", { 
      matchCount: matches.length,
      topScore: matches[0]?.score 
    });

    // Extract conversation starters from matches
    const retrievedStarters = matches
      .filter(match => match.metadata?.text)
      .map(match => match.metadata.text)
      .slice(0, 5); // Take top 5

    // Generate new conversation starters using OpenAI
    const generatedStarters = await generateWithOpenAI(retrievedStarters, searchGenres);

    return {
      starters: generatedStarters,
      sharedGenres,
      retrievedCount: matches.length,
    };

  } catch (error) {
    logger.error("Error in generateStartersFromGenres", {
      error: error instanceof Error ? error.message : error,
      searchGenres,
    });
    throw error;
  }
}

/**
 * Generate new conversation starters using OpenAI GPT-3.5-turbo
 * 
 * @param examples - Retrieved conversation starters to use as examples
 * @param genres - Genres to focus on
 * @returns Array of generated conversation starters
 */
async function generateWithOpenAI(examples: string[], genres: string[]): Promise<string[]> {
  try {
    // Initialize OpenAI at runtime
    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
    });
    
    const genreText = genres.length > 0 ? genres.join(", ") : "various gaming genres";
    
    // Create prompt with examples
    const exampleText = examples.length > 0 
      ? `Here are some example conversation starters:\n${examples.map((ex, i) => `${i + 1}. ${ex}`).join("\n")}\n\n`
      : "";

    const prompt = `${exampleText}Generate 5 engaging conversation starters for gamers who share interests in ${genreText}. 

The conversation starters should:
- Be natural and engaging questions or discussion prompts
- Reference specific aspects of the gaming genres
- Encourage sharing of experiences and opinions
- Be suitable for starting meaningful conversations between gaming friends
- Avoid being too generic or basic

Return only the 5 conversation starters, one per line, without numbering.`;

    logger.info("Generating with OpenAI", { 
      exampleCount: examples.length,
      genres: genreText 
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating engaging conversation starters for gamers. Focus on creating questions that help people connect over their shared gaming interests."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.8, // Add some creativity
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the response into individual starters
    const starters = response
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 5); // Ensure we only return 5

    logger.info("Generated conversation starters", { 
      starterCount: starters.length,
      starters 
    });

    return starters;

  } catch (error) {
    logger.error("Error generating with OpenAI", {
      error: error instanceof Error ? error.message : error,
      examples: examples.length,
    });
    throw error;
  }
}
