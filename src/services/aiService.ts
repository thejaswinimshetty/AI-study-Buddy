import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

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

export async function sendMessage(history: ChatMessage[], currentMessage: string, files: FileData[] = []) {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables.");
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT
    });

    // Gemini API requires the first message in history to be from the 'user'.
    const apiHistory = history[0]?.role === 'model' ? history.slice(1) : history;

    const chat = model.startChat({
        history: apiHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        })),
    });

    const promptParts: (string | Part)[] = [currentMessage];
    files.forEach(file => {
        // Only pass the inlineData part to the API to avoid "Unknown name 'name'" error
        promptParts.push({ inlineData: file.inlineData });
    });

    const result = await chat.sendMessage(promptParts);
    const response = await result.response;
    return response.text();
}

export async function generateQuiz(topic: string, fileData?: FileData, difficulty: string = 'medium', count: number = 5) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate a ${count}-question multiple choice quiz about "${topic}" with a difficulty level of "${difficulty}". 
  Provide the output in JSON format: { "questions": [{ "question": "...", "options": ["...", "..."], "answer": "..." }] }
  ${fileData ? "Base the quiz on the provided file content." : ""}`;

    const parts: (string | Part)[] = [prompt];
    if (fileData) {
        parts.push({ inlineData: fileData.inlineData });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return JSON.parse(response.text().replace(/```json|```/g, "").trim());
}

export async function generateFlashcards(topic: string, fileData?: FileData, count: number = 5) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate ${count} flashcards about "${topic}". 
  Provide the output in JSON format: { "flashcards": [{ "front": "...", "back": "..." }] }
  ${fileData ? "Base the flashcards on the provided file content." : ""}`;

    const parts: (string | Part)[] = [prompt];
    if (fileData) {
        parts.push({ inlineData: fileData.inlineData });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return JSON.parse(response.text().replace(/```json|```/g, "").trim());
}
