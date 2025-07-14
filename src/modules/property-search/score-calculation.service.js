export const scoreProperty = (property) => {
    let score = 0;
    if (property.is_promoted) score += 40;
    if (property.is_verified) score += 30;
    score += (property.likes || 0) * 2;
    score += (property.saves || 0) * 1.5;
    score += (property.rating || 0) * 10;
  
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const isRecent = new Date() - new Date(property.created_at) < threeDaysInMs;
    if (isRecent) score += 10;
  
    return score;
};

export default {
    scoreProperty
}