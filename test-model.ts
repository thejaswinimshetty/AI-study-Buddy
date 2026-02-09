
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import { sendMessage } from './src/services/aiService';

// Mock import.meta.env for Node environment
(global as any).import = { meta: { env: { VITE_GEMINI_API_KEY: "AIzaSyA1n3sR5zH5xxzZolsmgkcCl2XFLw-F-TY" } } };

async function test() {
    console.log("Testing Gemini 1.5 Flash connectivity...");
    try {
        const response = await sendMessage([], "Say 'Model is running!'");
        console.log("AI Response:", response);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
