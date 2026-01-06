import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message, ImageGenerationConfig, ChatMode, GroundingLink } from "../types";

const SYSTEM_INSTRUCTION = `You are Intellexa, an expert AI architect and education specialist.
Your task is to function as a universal virtual tutor, study partner, and project assistant.

Core Objectives:
1. Explain academic concepts in clear, accessible language tailored to the user's demonstrated level.
2. Provide step-by-step solutions for numerical and logical problems.
3. Assist in homework, assignments, projects, and exam preparation across all levels of education.
4. Generate summaries, notes, conclusions, and examples.
5. **VISUAL ARCHITECTURE**: 
   - Use Mermaid.js for flowcharts, logic maps, and conceptual diagrams (always use code blocks labeled 'mermaid').
   - You can trigger image generation or editing for high-fidelity educational visuals.

Teaching Style:
- Professional, academic, patient, and motivating.
- Use real-life examples, analogies, and text-based diagrams.
- Break complex topics into clear points, tables, or numbered steps.

Output Format:
- Use clear headings and structured sections.
- Use bullet points or numbered steps for readability.
- Use mermaid blocks for structural diagrams when helpful.
- End with a "Quick Revision Tip".`;

export async function* getStreamingTutorResponse(
  prompt: string,
  history: Message[],
  mode: ChatMode = 'lite',
  image?: string
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Model Selection based on Mode and Input
  let modelName = 'gemini-2.5-flash-lite-latest'; // Default Fast Mode
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
    // Thinking mode enabled for complex text queries
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
    
    // Extract grounding links if available
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
  
  // Standardizing on Gemini 2.5 Flash Image for all tasks
  const modelName = 'gemini-2.5-flash-image';

  const parts: any[] = [];

  if (config.base64Source) {
    // IMAGE EDITING MODE
    parts.push({
      inlineData: {
        data: config.base64Source.split(',')[1] || config.base64Source,
        mimeType: 'image/png'
      }
    });
    parts.push({
      text: `Perform high-fidelity editing on this image based on the following request: ${config.prompt}. 
      Common requests include adding filters, removing background objects, or adding elements. 
      Maintain educational clarity and professional aesthetic.`
    });
  } else {
    // GENERATION MODE
    const prompt = `Architect a professional educational illustration or 3D render: ${config.prompt}.
    The visual should be medically or scientifically accurate, highly detailed, and suitable for academic presentation. 
    **IMPORTANT**: Do not include any text labels unless specifically requested.`;
    parts.push({ text: prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        parts: parts
      }],
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

    if (!imageUrl) {
      throw new Error("The synthesis engine returned an empty output.");
    }

    return imageUrl;
  } catch (error: any) {
    const errorMsg = error.message || "";
    if (errorMsg.toLowerCase().includes("safety")) {
      throw new Error("Architectural Breach: Safety filter triggered.");
    }
    throw new Error(error.message || "Synthesis Engine Failure.");
  }
}

export async function getVisualSuggestions(history: Message[], currentPrompt?: string): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const context = history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const prompt = `Based on this educational chat history ${currentPrompt ? 'and the user\'s current draft' : ''}, suggest 3 highly specific educational visual prompts for an AI architect. 
  History:
  ${context}
  ${currentPrompt ? `Current User Draft: "${currentPrompt}"` : ""}
  Provide exactly 3 short, descriptive prompts.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        systemInstruction: "You are a creative director for educational content."
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
}