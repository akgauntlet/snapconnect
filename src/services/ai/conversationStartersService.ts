/**
 * @file conversationStartersService.ts
 * @description Service for generating AI-powered conversation starters based on gaming preferences
 * Uses Firebase Cloud Functions with Pinecone RAG and OpenAI GPT-3.5-turbo
 * Includes fallback functionality when Firebase Functions aren't available
 * 
 * @author SnapConnect Team
 * @created 2024-01-25
 */

import { areFirebaseFunctionsAvailable, createCallableFunction } from '../../config/firebase';

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

/**
 * Fallback conversation starters by gaming genre
 * Used when Firebase Functions aren't available
 */
const FALLBACK_STARTERS: Record<string, string[]> = {
  action: [
    "What's the most epic boss fight you've ever experienced?",
    "Do you prefer fast-paced combat or strategic action games?",
    "Which action game has the best combat system in your opinion?",
    "What's your go-to weapon type in action games?",
    "Have you played any good co-op action games recently?",
  ],
  fps: [
    "What's your favorite FPS map of all time?",
    "Do you prefer single-player campaigns or multiplayer matches?",
    "Which FPS has the most satisfying weapon mechanics?",
    "What's your preferred gaming setup for competitive FPS?",
    "Have you tried any tactical FPS games lately?",
  ],
  moba: [
    "Who's your main character and why did you choose them?",
    "What's the most intense comeback you've experienced in a MOBA?",
    "Do you prefer playing support or carry roles?",
    "Which MOBA has the best community in your experience?",
    "What's your strategy for learning new characters?",
  ],
  strategy: [
    "Do you prefer turn-based or real-time strategy games?",
    "What's the most complex strategy game you've mastered?",
    "Which civilization/faction do you usually play as?",
    "Have you tried any city-building or management games?",
    "What's your approach to resource management in strategy games?",
  ],
  rpg: [
    "What's your favorite character class to play in RPGs?",
    "Do you prefer story-driven or open-world RPGs?",
    "Which RPG has the best character customization?",
    "What's the longest RPG you've ever completed?",
    "Have you played any good indie RPGs recently?",
  ],
  racing: [
    "Do you prefer arcade-style or simulation racing games?",
    "What's your favorite racing track or circuit?",
    "Which racing game has the best car customization?",
    "Do you use a racing wheel or controller?",
    "Have you tried any rally or off-road racing games?",
  ],
  sports: [
    "Which sports game series do you follow most closely?",
    "Do you prefer managing teams or playing matches?",
    "What's your favorite sports game mode?",
    "Have you tried any arcade-style sports games?",
    "Which sports game has the most realistic gameplay?",
  ],
  simulation: [
    "What's the most detailed simulation game you've played?",
    "Do you prefer life simulation or vehicle simulation games?",
    "Which simulation game taught you the most real skills?",
    "Have you built anything impressive in simulation games?",
    "What's your longest play session in a simulation game?",
  ],
  puzzle: [
    "What's the most challenging puzzle game you've completed?",
    "Do you prefer logic puzzles or pattern-matching games?",
    "Which puzzle game has the best difficulty curve?",
    "Have you tried any multiplayer puzzle games?",
    "What's your strategy for solving difficult puzzles?",
  ],
  horror: [
    "What's the scariest gaming moment you've experienced?",
    "Do you prefer psychological horror or jump scares?",
    "Which horror game has the best atmosphere?",
    "Have you played any horror games with friends?",
    "What time of day do you usually play horror games?",
  ],
  general: [
    "What game are you currently obsessed with?",
    "Which gaming platform do you prefer and why?",
    "What's your favorite gaming memory with friends?",
    "Have you discovered any hidden gem games recently?",
    "What game made you fall in love with gaming?",
  ],
};

/**
 * Generate fallback conversation starters based on shared genres
 */
function generateFallbackStarters(
  user1Genres: string[],
  user2Genres: string[]
): ConversationStarterResponse {
  // Find shared genres
  const sharedGenres = getSharedGamingGenres(user1Genres, user2Genres);
  
  // If no shared genres, use all genres
  const genresToUse = sharedGenres.length > 0 ? sharedGenres : [...user1Genres, ...user2Genres];
  
  // Collect starters from available genres
  const allStarters: string[] = [];
  const usedGenres = new Set<string>();
  
  for (const genre of genresToUse) {
    const genreKey = genre.toLowerCase();
    if (FALLBACK_STARTERS[genreKey] && !usedGenres.has(genreKey)) {
      allStarters.push(...FALLBACK_STARTERS[genreKey]);
      usedGenres.add(genreKey);
    }
  }
  
  // If no specific genres found, use general starters
  if (allStarters.length === 0) {
    allStarters.push(...FALLBACK_STARTERS.general);
  }
  
  // Shuffle and take 5 random starters
  const shuffled = allStarters.sort(() => Math.random() - 0.5);
  const selectedStarters = shuffled.slice(0, 5);
  
  return {
    starters: selectedStarters,
    sharedGenres,
    retrievedCount: 0, // No retrieval from database in fallback mode
  };
}

/**
 * Generate conversation starters for two users based on their gaming genre preferences
 * 
 * This function uses RAG with Pinecone vector database and OpenAI GPT-3.5-turbo to:
 * 1. Find shared gaming genres between users
 * 2. Retrieve similar conversation starters from Pinecone
 * 3. Generate 5 personalized conversation starters using AI
 * 
 * Falls back to predefined starters when Firebase Functions aren't available
 * 
 * @param user1Genres - First user's gaming genre preferences (array of genre IDs)
 * @param user2Genres - Second user's gaming genre preferences (array of genre IDs)
 * @returns Promise<ConversationStarterResponse> - Generated conversation starters with metadata
 * 
 * @example
 * ```typescript
 * const starters = await generateConversationStarters(
 *   ["action", "fps", "battle_royale"],
 *   ["fps", "moba", "strategy"]
 * );
 * console.log(starters.starters); // Array of 5 conversation starter strings
 * console.log(starters.sharedGenres); // ["fps"]
 * ```
 */
export async function generateConversationStarters(
  user1Genres: string[],
  user2Genres: string[]
): Promise<ConversationStarterResponse> {
  try {
    // Validate input
    if (!user1Genres || !user2Genres) {
      throw new Error('Both user genre preferences are required');
    }

    if (!Array.isArray(user1Genres) || !Array.isArray(user2Genres)) {
      throw new Error('Genre preferences must be arrays');
    }

    if (user1Genres.length === 0 && user2Genres.length === 0) {
      throw new Error('At least one user must have gaming preferences');
    }

    console.log('Generating conversation starters for genres:', {
      user1Genres,
      user2Genres,
    });

    // Check if Firebase Functions are available
    if (!areFirebaseFunctionsAvailable()) {
      console.log('⚠️ Firebase Functions not available, using fallback starters');
      return generateFallbackStarters(user1Genres, user2Genres);
    }

    // Try to use AI-powered generation
    try {
      console.log('🤖 Attempting AI-powered conversation starter generation...');
      
      const generateStarters = createCallableFunction('generateConversationStarters');
      const result = await generateStarters({
        user1Genres,
        user2Genres,
      });

      const response = result.data as ConversationStarterResponse;
      console.log('✅ AI-powered conversation starters generated successfully');
      
      return response;

    } catch (functionError) {
      console.warn('⚠️ AI generation failed, falling back to predefined starters:', functionError);
      return generateFallbackStarters(user1Genres, user2Genres);
    }

  } catch (error) {
    console.error('Error generating conversation starters:', {
      error: error instanceof Error ? error.message : error,
      user1Genres,
      user2Genres,
    });

    // Final fallback - return basic starters
    console.log('🔄 Using final fallback conversation starters');
    return generateFallbackStarters(user1Genres, user2Genres);
  }
}

/**
 * Generate conversation starters for a user based on their own gaming preferences
 * Useful for suggesting general gaming conversation topics
 * 
 * @param userGenres - User's gaming genre preferences
 * @returns Promise<ConversationStarterResponse> - Generated conversation starters
 */
export async function generatePersonalConversationStarters(
  userGenres: string[]
): Promise<ConversationStarterResponse> {
  // Use the same genres for both users to get genre-specific starters
  return generateConversationStarters(userGenres, userGenres);
}

/**
 * Check if two users have enough shared gaming interests for meaningful conversation starters
 * 
 * @param user1Genres - First user's gaming genre preferences
 * @param user2Genres - Second user's gaming genre preferences
 * @returns boolean - True if users have shared interests
 */
export function hasSharedGamingInterests(
  user1Genres: string[],
  user2Genres: string[]
): boolean {
  if (!user1Genres || !user2Genres) {
    return false;
  }

  const set2 = new Set(user2Genres.map(g => g.toLowerCase()));
  const sharedGenres = user1Genres.filter(genre => set2.has(genre.toLowerCase()));
  
  return sharedGenres.length > 0;
}

/**
 * Get the shared gaming genres between two users
 * 
 * @param user1Genres - First user's gaming genre preferences
 * @param user2Genres - Second user's gaming genre preferences
 * @returns string[] - Array of shared genre IDs
 */
export function getSharedGamingGenres(
  user1Genres: string[],
  user2Genres: string[]
): string[] {
  if (!user1Genres || !user2Genres) {
    return [];
  }

  const set2 = new Set(user2Genres.map(g => g.toLowerCase()));
  return user1Genres.filter(genre => set2.has(genre.toLowerCase()));
}

/**
 * Test Firebase Functions connectivity
 * @returns Promise<boolean> - True if Functions are accessible
 */
export async function testFirebaseFunctions(): Promise<boolean> {
  try {
    console.log('🧪 Testing Firebase Functions connectivity...');
    
    // Use the new helper function to check availability
    const isAvailable = areFirebaseFunctionsAvailable();
    
    if (isAvailable) {
      console.log('✅ Firebase Functions are accessible');
    } else {
      console.log('⚠️ Firebase Functions are not available - will use fallback starters');
    }
    
    return isAvailable;
    
  } catch (error) {
    console.error('❌ Firebase Functions connectivity test failed:', error);
    return false;
  }
}

// Export types for use in other files
export type { ConversationStarterRequest, ConversationStarterResponse };
