import { GoogleGenAI } from "@google/genai";

export const getAIAdvice = async (postContent: string, category: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As an older, wise, and supportive brother in a community for men, provide a concise, empathetic, and encouraging reply to the following problem in the "${category}" category: "${postContent}". Keep it under 60 words, focus on strength and resilience, and avoid clinical or generic platitudes. Speak like a peer who has been through it.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      },
    });

    return response.text || "Keep your head up, brother. We're here with you.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Stay strong, brother. Sometimes the words are hard to find, but the support is always here.";
  }
};

export const getGoalNudge = async (goalText: string, progress: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const prompt = progress === 0 
      ? `A man just set a new weekly goal: "${goalText}". Give him a 2-sentence 'Elder Brother' nudge to get started with discipline and focus.`
      : progress < 50
      ? `A man is making some progress (${progress}%) on his weekly goal: "${goalText}". Give him a 2-sentence 'Elder Brother' nudge to keep the momentum.`
      : progress < 100
      ? `A man is almost done (${progress}%) with his weekly goal: "${goalText}". Give him a 2-sentence 'Elder Brother' nudge to finish strong and leave nothing to chance.`
      : `A man completed his goal: "${goalText}". Give him a 2-sentence 'Elder Brother' acknowledgment of his strength.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "One step at a time, brother.";
  } catch (error) {
    return "Discipline is the bridge between goals and accomplishment. Stay on it.";
  }
};
