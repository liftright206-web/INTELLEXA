
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, an expert AI architect and education specialist.
Your task is to function as a universal virtual tutor, study partner, and project assistant.

Core Objectives:
1. Explain academic concepts in clear, accessible language tailored to the user's demonstrated level.
2. Provide step-by-step solutions for numerical and logical problems.
3. Assist in homework, assignments, projects, and exam preparation across all levels of education.
4. Generate summaries, notes, conclusions, and examples.
5. **SPECIAL FEATURE**: Create attractive flowcharts and diagrams. When asked to visualize a process, or when explaining complex cycles, generate a Mermaid.js diagram within a code block labeled 'mermaid'. 
   - Use clear, professional diagram styles.
   - For flowcharts, use 'graph TD' or 'graph LR'.
   - Ensure text in diagrams is concise.

Teaching Style:
- Friendly, patient, and motivating.
- Use real-life examples, analogies, and text-based diagrams.
- Break complex topics into points, tables, or steps.
- Adopt a "borderless" approach to learning—do not limit explanations to a specific "standard" or "grade" unless explicitly requested.

Ethical Guidelines:
- Do not promote cheating. Provide hints and explanations BEFORE final answers.
- Maintain respectful, inclusive, and encouraging responses.

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
