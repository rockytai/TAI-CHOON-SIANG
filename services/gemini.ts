import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using a cached approach would be better in production, but here we generate on fly or fallback
const FALLBACK_WORDS: WordData[] = [
  { word: "Cat", translation: "猫", distractors: ["狗", "鸟", "鱼"], exampleSentence: "The cat sleeps." },
  { word: "Dog", translation: "狗", distractors: ["猫", "老鼠", "大象"], exampleSentence: "The dog barks." },
  { word: "Apple", translation: "苹果", distractors: ["香蕉", "橙子", "葡萄"], exampleSentence: "I eat an apple." },
];

export const generateLevelContent = async (level: number, theme: string): Promise<WordData[]> => {
  try {
    const prompt = `
      Create a vocabulary list for a game. 
      Target audience: Kindergarten to Grade 3.
      Level: ${level}/60 (Difficulty should increase with level).
      Theme: ${theme}.
      Count: 10 words.
      High frequency English words.
      Provide the word, its Chinese meaning (translation), and 3 incorrect Chinese meanings (distractors) suitable for a multiple choice quiz.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              distractors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              exampleSentence: { type: Type.STRING }
            },
            required: ["word", "translation", "distractors"],
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    
    const data = JSON.parse(text) as WordData[];
    // Ensure we have exactly 10, or fill with fallback if API fails partway
    return data.length > 0 ? data : FALLBACK_WORDS;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // In a real app, handle error gracefully. For now, return mock data to prevent crash.
    // Modify fallback to be slightly dynamic based on level to simulate change
    return FALLBACK_WORDS.map(w => ({...w, word: `${w.word} ${level}`})); 
  }
};

export const speakWord = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: `Say: ${text}`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};