
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message, ImageGenerationConfig, ChatMode, GroundingLink } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, a brilliant, witty, and friendly AI Architect and Education Specialist. 
Your mission is to architect knowledge using simple, clear, and easy-to-understand English.

Persona Guidelines:
- PERSONALITY: Charismatic and helpful. You are like a brilliant older sibling or a friendly tutor who makes everything easy.
- LANGUAGE: Use simple words. Avoid big academic jargon. If you use a complex word, explain it simply right away.
- SENTENCE STRUCTURE: Keep sentences short and direct. Avoid long, confusing paragraphs.
- HUMOR: Use fun, simple jokes and architect puns. (e.g., "Let's build this answer together!")
- ENGAGEMENT: Use phrases like "Neural pathways engaged," "Let's chat about this thought," or "Logic gates opening!"

Core Objectives:
1. Explain academic concepts using plain, everyday English that a middle schooler would easily understand.
2. Provide step-by-step solutions that are broken down into the simplest possible parts.
3. Generate interactive Mermaid.js diagrams for visual learners.
4. Use real-life, simple analogies to explain hard ideas.

CRITICAL FORMATTING RULE:
- DO NOT use Markdown bolding (double asterisks) or italics (single asterisks).
- Use ALL CAPS for headers or labels if necessary.
- Use plain text, numbering, and spacing for structure.

Output Format:
- Use clear plain-text headings in ALL CAPS.
- Use mermaid blocks for structural diagrams.
- End with a "Witty Revision Nugget" (a very short, simple tip delivered with a smile).`;

export async function* getStreamingTutorResponse(
  prompt: string,
  history: Message[],
  mode: ChatMode = 'lite',
  image?: string
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Model selection logic based on requirements
  let modelName = 'gemini-flash-lite-latest'; // Lite Mode
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
    temperature: 0.7, // Lower temperature slightly for more direct, simple answers
  };

  if (mode === 'search') {
    config.tools = [{ googleSearch: {} }];
  }

  if (mode === 'complex' && !image) {
    // Enable thinking for the most complex text queries
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents,
    config,
  });

  for await (const chunk of stream) {
    const text = chunk.text || "";
    const links: GroundingLink[] = [];
    
    // Extract grounding chunks for search mode
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
  if (!apiKey) throw new Error("Configuration Error: API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash-image';

  const parts: any[] = [];

  if (config.base64Source) {
    // IMAGE EDITING MODE - Literal adherence to prompt
    parts.push({
      inlineData: {
        data: config.base64Source.split(',')[1] || config.base64Source,
        mimeType: 'image/png'
      }
    });
    parts.push({
      text: `Modify this image exactly as requested: ${config.prompt}. Focus on accuracy and maintaining the high-quality resolution of the output.`
    });
  } else {
    // GENERATION MODE - Adheres to prompt directly, ensuring high fidelity
    const promptText = `Create a professional, high-fidelity visual based on this prompt: ${config.prompt}. Ensure the generation is detailed, accurately represents all requested elements, and maintains high aesthetic standards. Avoid adding educational labels or academic context unless specifically mentioned.`;
    parts.push({ text: promptText });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio
        }
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("The synthesis engine returned an empty output.");
    return imageUrl;
  } catch (error: any) {
    const errorMsg = error.message || "";
    if (errorMsg.toLowerCase().includes("safety")) throw new Error("Architectural Breach: Safety filter triggered.");
    throw new Error(error.message || "Synthesis Engine Failure.");
  }
}

export async function getVisualSuggestions(history: Message[], currentPrompt?: string): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const context = history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const promptText = `Based on the conversation history and the current user input, suggest 3 creative visual prompts that would enhance the experience.
  Context: ${context}
  ${currentPrompt ? `Current User Draft: "${currentPrompt}"` : ""}
  The prompts should be diverse and can range from scientific to artistic or realistic. Provide exactly 3 short, descriptive prompts. Do not use markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        systemInstruction: "You are an expert visual prompt engineer. Your goal is to suggest highly effective, accurate, and creative image generation prompts. Never use markdown symbols."
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
}
