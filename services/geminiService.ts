
import { GoogleGenAI, Type } from "@google/genai";
import { Message, ChatMode, GroundingLink, ImageGenerationConfig } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, a brilliant, witty, and friendly AI Architect and Education Specialist. 
Your mission is to architect knowledge using simple, clear, and easy-to-understand English.

Persona Guidelines:
- PERSONALITY: Charismatic and helpful. You are like a brilliant older sibling or a friendly tutor.
- LANGUAGE: Use simple words. Avoid big academic jargon.
- SENTENCE STRUCTURE: Keep sentences short and direct.
- HUMOR: Use fun, simple jokes and architect puns. (e.g., "Let's build this answer together!")
- ENGAGEMENT: Use phrases like "Neural pathways engaged" or "Logic gates opening!"

Core Objectives:
1. Explain academic concepts using plain, everyday English.
2. Provide step-by-step solutions broken down into simple parts.
3. GENERATE STRUCTURAL DIAGRAMS: You MUST provide Mermaid.js diagrams for any concept that has a process, hierarchy, or structure. Use the format: \`\`\`mermaid [CODE] \`\`\`.
4. Use real-life analogies to explain hard ideas.

CRITICAL FORMATTING RULE:
- DO NOT use Markdown bolding (double asterisks) or italics.
- Use ALL CAPS for headers or labels.
- Use plain text, numbering, and spacing for structure.

Output Format:
- Use clear plain-text headings in ALL CAPS.
- Use mermaid blocks for structural diagrams (Flowcharts, Mindmaps, or Sequence diagrams).
- End with a "Witty Revision Nugget".`;

export async function* getStreamingTutorResponse(
  prompt: string,
  history: Message[],
  mode: ChatMode = 'lite',
  image?: string
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Intellexa Error: API_KEY is missing. Please add it to your Replit Secrets (Environment Variables).");
    throw new Error("Neural Link Offline: Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let modelName = 'gemini-flash-lite-latest'; 
  if (mode === 'search') modelName = 'gemini-3-flash-preview';
  if (mode === 'complex' || image) modelName = 'gemini-3-pro-preview'; 

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

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
  };

  if (mode === 'search') {
    config.tools = [{ googleSearch: {} }];
  }

  if (mode === 'complex' && !image) {
    config.thinkingConfig = { thinkingBudget: 24576 };
  }

  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents,
    config,
  });

  for await (const chunk of stream) {
    const text = chunk.text || "";
    const links: GroundingLink[] = [];
    
    if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      chunk.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          links.push({
            uri: chunk.web.uri,
            title: chunk.web.title
          });
        }
      });
    }

    yield { text, links };
  }
}

export async function generateTutorImage(config: ImageGenerationConfig): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing in environment.");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash-image';

  const parts: any[] = [];
  if (config.base64Source) {
    parts.push({
      inlineData: {
        data: config.base64Source.split(',')[1] || config.base64Source,
        mimeType: 'image/png'
      }
    });
    parts.push({ text: `Modify this image exactly according to these instructions: ${config.prompt}. Maintain high quality and literal adherence to the request.` });
  } else {
    parts.push({ text: `${config.prompt}. Ensure high aesthetic quality, vivid detail, and strict literal adherence to every aspect of the prompt without adding educational or academic context unless specifically asked for.` });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio || '1:1'
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from model.");
}

export async function getVisualSuggestions(history: Message[], currentPrompt?: string): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const context = history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const promptText = `Suggest 3 creative visual prompts that are strictly relevant to the current conversation context.
  Context: ${context}
  ${currentPrompt ? `Current Input: "${currentPrompt}"` : ""}
  The prompts should be diverse and creative. Return only a JSON array of 3 strings.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
}
