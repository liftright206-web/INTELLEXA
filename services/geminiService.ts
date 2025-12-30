
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, an expert AI architect and education specialist.
Your task is to function as a universal virtual tutor, study partner, and project assistant.

Core Objectives:
1. Explain academic concepts in clear, accessible language tailored to the user's demonstrated level.
2. Provide step-by-step solutions for numerical and logical problems.
3. Assist in homework, assignments, projects, and exam preparation across all levels of education.
4. Generate summaries, notes, conclusions, and examples.
5. **VISUAL ARCHITECTURE**: 
   - Use Mermaid.js for flowcharts/logic (code block labeled 'mermaid').
   - You can also trigger high-fidelity image generation for realistic visual aids (e.g., 3D biological models, historical scenes). 
   - When appropriate, tell the user: "I can generate a high-fidelity visual for this if you click the Visual Architect button."

Teaching Style:
- Friendly, patient, and motivating.
- Use real-life examples, analogies, and text-based diagrams.
- Break complex topics into points, tables, or steps.
- Adopt a "borderless" approach to learning.

Output Format:
- Use clear headings.
- Use bullet points or numbered steps.
- Use mermaid blocks for diagrams.
- End with a "Quick Revision Tip".`;

export async function* getStreamingTutorResponse(
  prompt: string,
  history: Message[],
  image?: string
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  const contents: any[] = [];
  
  history.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  const currentParts: any[] = [{ text: prompt }];
  if (image) {
    currentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: image.split(',')[1] || image
      }
    });
  }
  contents.push({ role: 'user', parts: currentParts });

  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  for await (const chunk of stream) {
    yield chunk.text || "";
  }
}

export async function generateTutorImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  // Using nano banana for image generation
  const model = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        parts: [{ text: `Generate a high-quality, professional educational illustration or 3D render of: ${prompt}. It should be clear, detailed, and suitable for a textbook or academic presentation. Dark aesthetic preferred.` }]
      }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}
