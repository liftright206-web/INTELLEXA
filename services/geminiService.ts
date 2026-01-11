import { GoogleGenAI, Type } from "@google/genai";
import { Message, ChatMode, GroundingLink, LearningEnvironment } from "../types";

const BASE_SYSTEM_INSTRUCTION = `You are Intellexa, a brilliant, witty, and highly interactive AI Architect and Education Specialist. 

CORE MISSION: You are NOT a search engine. You are a CONVERSATIONAL TUTOR. Your goal is to architect knowledge through active dialogue, not just information dumps.

Persona Guidelines:
- BE SOCRATIC: Instead of just giving the answer, guide the user to it. 
- STYLE: Witty, charismatic, and encouraging. Use simple English but sophisticated structural logic.

Structural Rules:
1. Explain the concept briefly.
2. Use ALL CAPS for headers.
3. PROVIDE DIAGRAMS: You MUST provide Mermaid.js diagrams for structural concepts using \`\`\`mermaid [CODE] \`\`\`.
4. CHECK FOR UNDERSTANDING: Every single response MUST end with an engaging follow-up question.

CRITICAL FORMATTING:
- NO double asterisks for bolding. NO italics.
- Use plain text, numbers, and spacing.`;

function buildSystemInstruction(env?: LearningEnvironment): string {
  if (!env) return BASE_SYSTEM_INSTRUCTION;

  let envContext = `\n\nCURRENT ACTIVE ENVIRONMENT: ${env.name.toUpperCase()}\n`;
  envContext += `SUBJECT FOCUS: ${env.subject}\n`;
  
  if (env.complexity === 'novice') envContext += `COMPLEXITY: Extreme simplicity. Use analogies for 5-year-olds.\n`;
  if (env.complexity === 'master') envContext += `COMPLEXITY: High-level academic depth. Assume advanced prior knowledge.\n`;

  if (env.archetype === 'storyteller') envContext += `ARCHETYPE: Use narrative flow and historical anecdotes.\n`;
  if (env.archetype === 'technical') envContext += `ARCHETYPE: Precise, data-driven, and focused on rigorous proofs or technical mechanics.\n`;
  if (env.archetype === 'socratic') envContext += `ARCHETYPE: Ask 2-3 deep questions for every 1 answer given.\n`;

  if (env.customInstructions) envContext += `ADDITIONAL PROTOCOLS: ${env.customInstructions}\n`;

  return BASE_SYSTEM_INSTRUCTION + envContext;
}

export async function* getStreamingTutorResponse(
  prompt: string,
  history: Message[],
  mode: ChatMode = 'lite',
  environment?: LearningEnvironment
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("AUTH_REQUIRED: API key missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let modelName = 'gemini-3-flash-preview'; 
  if (mode === 'lite') modelName = 'gemini-3-flash-preview';
  if (mode === 'complex') modelName = 'gemini-3-pro-preview'; 

  const contents: any[] = [];
  
  history.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const config: any = {
    systemInstruction: buildSystemInstruction(environment),
    temperature: 0.8,
  };

  if (mode === 'search') {
    config.tools = [{ googleSearch: {} }];
  }

  if (mode === 'complex') {
    config.thinkingConfig = { thinkingBudget: 24576 };
  }

  try {
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
  } catch (error: any) {
    if (error.message?.includes("429") || error.message?.includes("QUOTA") || error.message?.toLowerCase().includes("exhausted")) {
      throw new Error("QUOTA_LIMIT_EXCEEDED: Key quota exhausted. Please try again later or check your API configuration.");
    }
    throw error;
  }
}

export async function getDialogueSuggestions(history: Message[]): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const context = history.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const promptText = `Suggest 3 very short, conversational suggested replies for the user. Context: ${context}`;

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
    return ["Tell me more!", "Draw a diagram!", "Give me a test!"];
  }
}