const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');

const adviceByCategory: Record<string, string[]> = {
  Stress: [
    "Take one breath and shrink the problem down to the next step.",
    "You do not have to solve everything tonight. Handle what is in front of you."
  ],
  Money: [
    "Protect the basics first, then build from there.",
    "Small consistent moves matter more than one big rescue."
  ],
  Relationships: [
    "Say the honest thing without trying to win the room.",
    "Respect stays stronger when you lead with clarity instead of pride."
  ],
  Work: [
    "Focus on the next useful task and let the rest wait.",
    "Momentum comes back when you stop carrying every problem at once."
  ],
  Life: [
    "Keep showing up, even if today is messy.",
    "A steady pace beats a perfect plan that never starts."
  ],
};

const goalNudges = {
  start: [
    "Start small and start now. Discipline is built on the first rep, not the perfect plan.",
    "Do not wait for motivation. Take one clean step and let that create momentum."
  ],
  mid: [
    "You are already in motion. Keep the pace and do not let a slow moment become a stop.",
    "Progress counts. Stay locked in and finish the next part with intention."
  ],
  finish: [
    "You are close. Close the week strong and leave no loose ends behind.",
    "Finish with the same focus that got you this far. That is how habits become identity."
  ],
  complete: [
    "That is a strong win. Hold onto that energy and carry it into next week.",
    "You kept your word to yourself. That is real strength."
  ],
  fallback: [
    "Discipline is the bridge between goals and accomplishment. Stay on it.",
    "One step at a time, brother."
  ],
};

export const getAIAdvice = async (postContent: string, category: string): Promise<string> => {
  const cleanContent = normalizeText(postContent);
  const bucket = adviceByCategory[category] || adviceByCategory.Life;
  const selected = bucket[cleanContent.length % bucket.length];
  return `${selected} (${cleanContent.slice(0, 60)}${cleanContent.length > 60 ? '...' : ''})`;
};

export const getGoalNudge = async (goalText: string, progress: number): Promise<string> => {
  const cleanGoal = normalizeText(goalText);
  const bucket =
    progress === 0
      ? goalNudges.start
      : progress < 50
      ? goalNudges.mid
      : progress < 100
      ? goalNudges.finish
      : goalNudges.complete;

  const selected = bucket[cleanGoal.length % bucket.length] || goalNudges.fallback[0];
  return `${selected} (${progress}% on "${cleanGoal}")`;
};
