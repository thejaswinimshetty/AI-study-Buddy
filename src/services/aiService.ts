import { GoogleGenerativeAI, Part } from "@google/generative-ai";

function getApiKey() {
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || (globalThis as any).process?.env?.VITE_GEMINI_API_KEY || "";
}

function getGenAI() {
    const key = getApiKey();
    return new GoogleGenerativeAI(key);
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    files?: FileData[];
}

export interface FileData {
    inlineData: {
        data: string;
        mimeType: string;
    };
    name?: string;
}

const SYSTEM_PROMPT = `You are a highly advanced AI Study Buddy, meticulously "trained" on pedagogy and student engagement. 
Your core mission is to empower students through clarity, encouragement, and accuracy.

BEHAVIORAL "WEIGHTS":
1. INTERACTION: Always greet students warmly. Respond to "hi", "hii", "hello", etc., with a helpful attitude.
2. EXPERTIZE: You excel at breaking down syllabus topics into bite-sized, understandable concepts. 
3. GUARDRAILS: Strictly prioritize academic content. If a user drifts into non-study topics, politely steer them back: "I'd love to help with that, but I'm specialized in your studies! What subject are we tackling today?"
4. MULTI-MODAL: Analyze PDFs and ALL formats of images (PNG, JPG, WEBP, etc.) with deep precision. Extract key formulas, dates, diagrams, and definitions.
5. EXPLANATION: Use the "Feynman Technique"—explain complex ideas as if to a child, using simple metaphors and zero jargon.
6. OUTPUT: Quizzes and Flashcards must be perfectly structured for the interactive UI.

Your "epochs" are represented by your ongoing commitment to being the most supportive and accurate study companion possible. You have been "trained" to handle a wide variety of educational inputs including handwritten notes, textbook pages, and digital syllabi.`;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const status = error?.status || error?.response?.status;

            // Retry on 429 (Rate Limit) or 503 (Service Unavailable)
            if (status === 429 || status === 503 || error?.message?.includes('quota') || error?.message?.includes('fetch')) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`API call failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error; // If it's not a retryable error, throw immediately
        }
    }
    throw lastError;
}

const MODELS = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite-preview-09-2025", "gemini-1.5-pro"];

export async function sendMessage(history: ChatMessage[], currentMessage: string, files: FileData[] = []) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables.");
    }

    let lastError: any;

    const genAI = getGenAI();
    for (const modelName of MODELS) {
        try {
            console.log(`Attempting message with model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_PROMPT
            });

            const apiHistory = history[0]?.role === 'model' ? history.slice(1) : history;

            const chat = model.startChat({
                history: apiHistory.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                })),
            });

            const promptParts: (string | Part)[] = [currentMessage];
            files.forEach(file => {
                promptParts.push({ inlineData: file.inlineData });
            });

            const result = await withRetry(() => chat.sendMessage(promptParts));
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            lastError = error;
            console.error(`Error with model ${modelName}:`, error);

            // If it's a 404, we definitely want to try the next model
            if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('not found')) {
                continue;
            }

            // If it's a 429 and we've already retried within withRetry, maybe try another model?
            // Usually 429 is key-wide, but sometimes it's model-specific.
            if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
                continue;
            }

            // For other errors, we might still want to try next model just in case
            continue;
        }
    }

    // If we reach here, all models failed
    console.error("All models failed in sendMessage:", lastError);
    if (lastError?.message?.includes('quota')) {
        throw new Error("API Quota Exceeded across all available models. Please check your Google AI Studio billing or wait a few minutes.");
    }
    if (lastError?.status === 404 || lastError?.message?.includes('not found')) {
        throw new Error("Gemini models not found for this API key. Please verify your key in Google AI Studio.");
    }
    throw new Error("Failed to get AI response after trying multiple models. " + (lastError?.message || "Please check your connection."));
}

export async function generateQuiz(topic: string, fileData?: FileData, difficulty: string = 'medium', count: number = 5) {
    const prompt = `Generate a ${count}-question multiple choice quiz about "${topic}" with a difficulty level of "${difficulty}". 
  Provide the output in JSON format: { "questions": [{ "question": "...", "options": ["...", "..."], "answer": "..." }] }
  ${fileData ? "Base the quiz on the provided file content." : ""}`;

    let lastError: any;

    for (const modelName of MODELS) {
        try {
            console.log(`Attempting quiz generation with model: ${modelName}`);
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: modelName });
            const parts: (string | Part)[] = [prompt];
            if (fileData) {
                parts.push({ inlineData: fileData.inlineData });
            }

            const result = await withRetry(() => model.generateContent(parts)) as any;
            const response = await result.response;
            return JSON.parse(response.text().replace(/```json|```/g, "").trim());
        } catch (error: any) {
            lastError = error;
            console.error(`Error with model ${modelName} in generateQuiz:`, error);
            if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('not found') || error?.status === 429 || error?.message?.includes('quota')) {
                continue;
            }
            continue;
        }
    }

    console.error("All models failed in generateQuiz:", lastError);
    throw new Error("Failed to generate quiz after trying multiple models. " + (lastError?.message || ""));
}

export async function generateFlashcards(topic: string, fileData?: FileData, count: number = 5) {
    const prompt = `Generate ${count} flashcards about "${topic}". 
  Provide the output in JSON format: { "flashcards": [{ "front": "...", "back": "..." }] }
  ${fileData ? "Base the flashcards on the provided file content." : ""}`;

    let lastError: any;

    for (const modelName of MODELS) {
        try {
            console.log(`Attempting flashcard generation with model: ${modelName}`);
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: modelName });
            const parts: (string | Part)[] = [prompt];
            if (fileData) {
                parts.push({ inlineData: fileData.inlineData });
            }

            const result = await withRetry(() => model.generateContent(parts)) as any;
            const response = await result.response;
            return JSON.parse(response.text().replace(/```json|```/g, "").trim());
        } catch (error: any) {
            lastError = error;
            console.error(`Error with model ${modelName} in generateFlashcards:`, error);
            if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('not found') || error?.status === 429 || error?.message?.includes('quota')) {
                continue;
            }
            continue;
        }
    }

    console.error("All models failed in generateFlashcards:", lastError);
    throw new Error("Failed to generate flashcards after trying multiple models. " + (lastError?.message || ""));
}

