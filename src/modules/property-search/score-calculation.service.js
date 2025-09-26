/**
 * Scoring function for ranking properties in the feed.
 * 
 * Each property is assigned a score based on multiple engagement
 * and quality signals. The higher the score, the higher it will 
 * appear in the ranked feed.
 * 
 * Breakdown of scoring logic:
 * - Promoted properties: +40 points (highest priority for ads/promotion)
 * - Verified properties: +30 points (trusted/quality signal)
 * - Likes: +2 points per like (strong engagement signal)
 * - Saves: +1.5 points per save (moderate engagement signal)
 * - Ratings: +10 points per rating star (if available, quality signal)
 * - Views: +0.5 points per view (lightweight popularity signal)
 * - Recency: +10 points if created within the last 3 days
 * 
 * This combination balances **paid promotion**, **trust signals**,
 * **user engagement**, and **recency**, so new/verified/promoted 
 * properties get boosted, while high-engagement ones sustain visibility.
 */

export const scoreProperty = (property) => {
    let score = 0;
  
    // Prioritize promoted properties
    if (property.is_promoted) score += 40;
  
    // Trust signal for verified listings
    if (property.is_verified) score += 30;
  
    // Engagement-based scoring
    score += (property.likes || 0) * 2;     // stronger weight
    score += (property.saves || 0) * 1.5;   // slightly lower weight
    score += (property.rating || 0) * 10;   // ratings carry more influence
  
    // Popularity via views (lightweight weight to avoid dominance)
    score += (property.views || 0) * 0.5;
  
    // Recency boost (fresh content gets temporary priority)
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const isRecent = new Date() - new Date(property.created_at) < threeDaysInMs;
    if (isRecent) score += 10;
  
    return score;
  };
  
  export default {
    scoreProperty,
  };
  