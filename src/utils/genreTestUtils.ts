/**
 * @file genreTestUtils.ts
 * @description Test utilities for verifying genre-based friend suggestions functionality.
 * Provides helper functions to test genre similarity calculations and debugging.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - @/utils/constants: Gaming genre definitions
 *
 * @usage
 * Used for testing and debugging genre-based friend suggestions.
 */

import { GAMING_GENRES } from "./constants";

/**
 * Test genre similarity calculation
 * @param genres1 - First user's gaming genres
 * @param genres2 - Second user's gaming genres
 * @returns Object with similarity metrics
 */
export function testGenreSimilarity(genres1: string[], genres2: string[]) {
  if (!genres1 || !genres2 || genres1.length === 0 || genres2.length === 0) {
    return {
      sharedGenres: [],
      similarityScore: 0,
      totalGenres1: genres1?.length || 0,
      totalGenres2: genres2?.length || 0,
      message: "One or both users have no gaming interests"
    };
  }

  // Convert to lowercase for case-insensitive comparison
  const set1 = new Set(genres1.map(g => g.toLowerCase()));
  const set2 = new Set(genres2.map(g => g.toLowerCase()));

  // Calculate shared genres
  const sharedGenres = [...set1].filter(x => set2.has(x));

  // Calculate union (all unique genres)
  const union = new Set([...set1, ...set2]);

  // Jaccard similarity: |intersection| / |union|
  const similarityScore = sharedGenres.length / union.size;

  return {
    sharedGenres,
    similarityScore,
    totalGenres1: genres1.length,
    totalGenres2: genres2.length,
    unionSize: union.size,
    message: sharedGenres.length > 0 
      ? `Users share ${sharedGenres.length} gaming interests`
      : "Users have no shared gaming interests"
  };
}

/**
 * Test cases for genre similarity
 */
export const genreTestCases = [
  {
    name: "High Similarity - Many Shared Genres",
    user1: ["fps", "action", "battle_royale", "moba"],
    user2: ["fps", "action", "battle_royale", "racing"],
    expectedSimilarity: 0.6 // 3 shared out of 5 total unique
  },
  {
    name: "Medium Similarity - Some Shared Genres",
    user1: ["rpg", "adventure", "strategy"],
    user2: ["rpg", "simulation", "puzzle"],
    expectedSimilarity: 0.2 // 1 shared out of 5 total unique
  },
  {
    name: "Low Similarity - No Shared Genres",
    user1: ["fps", "action"],
    user2: ["puzzle", "simulation"],
    expectedSimilarity: 0.0 // 0 shared out of 4 total unique
  },
  {
    name: "Perfect Similarity - Identical Genres",
    user1: ["rpg", "adventure"],
    user2: ["rpg", "adventure"],
    expectedSimilarity: 1.0 // 2 shared out of 2 total unique
  }
];

/**
 * Run all test cases and log results
 */
export function runGenreTestCases() {
  console.log("🎮 Running Genre Similarity Test Cases");
  console.log("=====================================");

  genreTestCases.forEach((testCase, index) => {
    const result = testGenreSimilarity(testCase.user1, testCase.user2);
    const passed = Math.abs(result.similarityScore - testCase.expectedSimilarity) < 0.01;
    
    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    console.log(`User 1 genres: ${testCase.user1.join(", ")}`);
    console.log(`User 2 genres: ${testCase.user2.join(", ")}`);
    console.log(`Shared genres: ${result.sharedGenres.join(", ") || "None"}`);
    console.log(`Similarity score: ${result.similarityScore.toFixed(3)}`);
    console.log(`Expected: ${testCase.expectedSimilarity.toFixed(3)}`);
    console.log(`Result: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  });

  console.log("\n🎮 Genre Similarity Tests Complete");
}

/**
 * Get genre display names for debugging
 * @param genreIds - Array of genre IDs
 * @returns Array of formatted genre names
 */
export function getGenreDisplayNames(genreIds: string[]): string[] {
  return genreIds.map(id => {
    const genre = GAMING_GENRES[id.toUpperCase() as keyof typeof GAMING_GENRES];
    return genre ? genre.name : id;
  });
}

/**
 * Log detailed genre information for debugging
 * @param userId - User identifier for logging
 * @param genres - User's gaming genres
 */
export function debugUserGenres(userId: string, genres: string[]) {
  console.log(`🎮 User ${userId} Gaming Profile:`);
  console.log(`Total genres: ${genres.length}`);
  console.log(`Genre IDs: ${genres.join(", ")}`);
  console.log(`Genre names: ${getGenreDisplayNames(genres).join(", ")}`);
} 
