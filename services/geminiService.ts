import { GoogleGenAI, Type } from "@google/genai";
import { Message, ChatMode, GroundingLink, ImageGenerationConfig } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, a brilliant, witty, and highly interactive AI Architect and Education Specialist. 

CORE MISSION: You are NOT a search engine. You are a CONVERSATIONAL TUTOR. Your goal is to architect knowledge through active dialogue, not just information dumps.

Persona Guidelines:
- BE SOCRATIC: Instead of just giving the answer, guide the user to it. 
- TWO-WAY PROTOCOL: Every single response MUST end with an engaging follow-up question, a "Challenge Prompt," or a request for the user to try a task.
- STYLE: Witty, charismatic, and encouraging. Use simple English but sophisticated structural logic.
- NO JARGON: Explain complex ideas with real-world analogies.

Structural Rules:
1. Explain the concept briefly.
2. Use ALL CAPS for headers.
3. PROVIDE DIAGRAMS: You MUST provide Mermaid.js diagrams for structural concepts using \`\`\`mermaid [CODE] \`\`\`.
4. CHECK FOR UNDERSTANDING: Never assume they "got it." Ask them to explain a piece back to you or solve a mini-puzzle.

CRITICAL FORMATTING:
- NO double asterisks for bolding. NO italics.
- Use plain text, numbers, and spacing.
- ALWAYS end with a conversation starter to keep the two-way flow alive.`;

export async function* getStreamingTutorResponse(
  prompt: string,
  history: Message[],
  mode: ChatMode = 'lite',
  image?: string
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("AUTH_REQUIRED: No API key provided.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let modelName = 'gemini-3-flash-preview'; 
  if (mode === 'lite') modelName = 'gemini-3-flash-preview';
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
    temperature: 0.8,
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

export async function getDialogueSuggestions(history: Message[]): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const context = history.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const promptText = `Based on the following conversation context, generate 3 very short, snappy, and conversational suggested replies that the USER might want to say next to Intellexa. 
  Keep them under 6 words each. 
  Example: "Give me a challenge!", "Explain that diagram more.", "What's the real-life use?"
  
  CONTEXT:
  ${context}
  
  Return ONLY a JSON array of 3 strings.`;

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
    return ["Tell me more!", "Give me a puzzle!", "Draw it for me!"];
  }
}

export async function generateTutorImage(config: ImageGenerationConfig): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("AUTH_REQUIRED: No key selected.");

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
    parts.push({ text: `Modify this image: ${config.prompt}.` });
  } else {
    parts.push({ text: config.prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio || '1:1',
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("QUOTA_EXHAUSTED: Image generation requires a billing-enabled API key.");
    }
    throw error;
  }

  throw new Error("Empty visual data returned from synthesis engine.");
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