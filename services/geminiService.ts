import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedApp, FileNode } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// We define a schema to ensure structured output from Gemini
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    previewHtml: {
      type: Type.STRING,
      description: "A single, self-contained HTML string that renders the requested application. It MUST use Tailwind CSS via CDN. It MUST include React and ReactDOM via CDN if interactivity is needed, or just plain HTML/JS. It should look like a production-ready app.",
    },
    files: {
      type: Type.ARRAY,
      description: "A list of simulated source code files representing the project structure.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "File path/name, e.g., 'src/App.tsx'" },
          language: { type: Type.STRING, description: "Language, e.g., 'typescript' or 'css'" },
          content: { type: Type.STRING, description: "The full source code content." }
        },
        required: ["name", "language", "content"]
      }
    },
    explanation: {
      type: Type.STRING,
      description: "A brief, friendly explanation of what was built."
    }
  },
  required: ["previewHtml", "files", "explanation"]
};

const SYSTEM_PROMPT = `
You are Lovable AI, an elite senior full-stack engineer and UI/UX designer.
Your goal is to build fully functional, beautiful, and responsive web applications based on user prompts.

RULES:
1. DESIGN: Use modern design principles. Default to a dark mode aesthetic unless requested otherwise. Use Tailwind CSS for all styling.
2. PREVIEW: The 'previewHtml' must be a completely self-contained HTML file.
   - Include Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
   - Include Font Awesome or similar if icons are needed.
   - If React logic is required, use Babel standalone and React/ReactDOM CDNs within the HTML to make it interactive.
3. FILES: Generate a realistic file structure (e.g., App.tsx, components/Header.tsx, utils/helpers.ts) in the 'files' array. These are for display purposes to show the user the architecture.
4. TONE: Be professional, concise, and enthusiastic.
5. ITERATION: If the user asks for changes, you will receive the previous context. Modify the code accordingly.
`;

export const generateApp = async (
  prompt: string,
  history: { role: string; text: string }[]
): Promise<GeneratedApp> => {
  try {
    const ai = getAiClient();
    
    // Convert history to a format Gemini might understand or just append to prompt context
    // Ideally, we use the chat history in the prompt context for single-shot generation
    // or use a ChatSession. For this builder pattern, a stateless generateContent with context is often safer for strict JSON.
    
    const contextPrompt = `
      Current Conversation History:
      ${history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}
      
      User's New Request: ${prompt}
      
      Based on the history and new request, generate the updated application code and preview.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 } // Fast response for UI
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const parsed: GeneratedApp = JSON.parse(jsonText);
    return parsed;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};