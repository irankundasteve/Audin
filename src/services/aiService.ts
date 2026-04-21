
import { GoogleGenerativeAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!API_KEY) throw new Error("Missing Gemini API Key");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convert Blob to Base64 for processing
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(audioBlob);
    });

    const base64Audio = await base64Promise;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: audioBlob.type,
          data: base64Audio
        }
      },
      { text: "Please transcribe this audio recording accurately. Only return the transcript." }
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

export async function getAudioSummary(audioBlob: Blob): Promise<{ summary: string; keywords: string[] }> {
  if (!API_KEY) throw new Error("Missing Gemini API Key");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(audioBlob);
    });

    const base64Audio = await base64Promise;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: audioBlob.type,
          data: base64Audio
        }
      },
      { text: "Summarize this audio and provide 5 keywords. Return in JSON format: { \"summary\": \"...\", \"keywords\": [\"...\", \"...\"] }" }
    ]);

    const responseText = result.response.text();
    // Clean up potential Markdown formatting from response
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Summary error:", error);
    return { summary: "Failed to generate AI summary.", keywords: [] };
  }
}
