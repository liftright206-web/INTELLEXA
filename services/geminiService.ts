import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, ImageGenerationConfig } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, an expert AI architect and education specialist.
Your task is to function as a universal virtual tutor, study partner, and project assistant.

Core Objectives:
1. Explain academic concepts in clear, accessible language tailored to the user's demonstrated level.
2. Provide step-by-step solutions for numerical and logical problems.
3. Assist in homework, assignments, projects, and exam preparation across all levels of education.
4. Generate summaries, notes, conclusions, and examples.
5. **VISUAL ARCHITECTURE**: 
   - Use Mermaid.js for flowcharts/logic (code block labeled 'mermaid').
   - You can also trigger image generation for realistic visual aids (e.g., 3D biological models, historical scenes). 
   - When appropriate, tell the user: "I can generate a visual for this. Simply use the 'VISUAL RENDER' quick action or ask me to architect it!"

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

export async function generateTutorImage(config: ImageGenerationConfig): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-image';

  const styleParts = [
    config.style ? `in ${config.style} style` : "in a professional academic style",
    config.cameraAngle ? `camera angle: ${config.cameraAngle}` : "",
    config.lighting ? `lighting: ${config.lighting}` : "",
    config.texture ? `materials and textures: ${config.texture}` : ""
  ].filter(p => p !== "").join(", ");

  const parts: any[] = [];

  if (config.base64Source) {
    // REFINEMENT MODE
    parts.push({
      inlineData: {
        data: config.base64Source.split(',')[1] || config.base64Source,
        mimeType: 'image/png'
      }
    });
    parts.push({
      text: `Refine the attached educational visual based on these specific architectural instructions: ${config.prompt}. 
      Technical specifications to maintain or update: ${styleParts}. 
      **IMPORTANT**: Do not include any text labels, captions, annotations, or callouts in the image unless specifically requested. Focus purely on the visual structure and accuracy.
      Ensure the new render is scientifically accurate, detailed, and visually consistent with the previous logic while incorporating the requested changes.`
    });
  } else {
    // GENERATION MODE
    const prompt = `Generate a high-quality, professional educational illustration or 3D render of: ${config.prompt}.
    Technical specifications: ${styleParts}. 
    The visual should be medically or scientifically accurate, highly detailed, and suitable for an advanced academic presentation. 
    **IMPORTANT**: Do not include any text labels, captions, annotations, or callouts in the image unless specifically requested. Focus purely on the visual structure and accuracy.
    Ensure clarity for educational purposes and a premium aesthetic.`;
    parts.push({ text: prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        parts: parts
      }],
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Image generation failed:", error);
    return null;
  }
}

export async function getVisualSuggestions(history: Message[]): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  
  // Format history for context
  const context = history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const prompt = `Based on this educational chat history, suggest 3 highly specific and visually impactful educational diagrams, 3D renders, or historical scenes that would help the student understand the current topic better. 
  
  History:
  ${context}
  
  Provide exactly 3 short, professional, and clear image generation prompts.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A short, descriptive prompt for an educational visual."
          }
        },
        systemInstruction: "You are a creative director for educational content. Your goal is to suggest visual aids that clarify complex topics."
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return [
      "3D cross-section of the core concept",
      "Historical visualization of this event",
      "Abstract logic map of these relationships"
    ];
  }
}