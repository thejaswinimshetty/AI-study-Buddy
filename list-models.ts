import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const genAI = new GoogleGenerativeAI("AIzaSyA1n3sR5zH5xxzZolsmgkcCl2XFLw-F-TY");
    try {
        const modelList = await genAI.listModels();
        console.log("Available Models:");
        modelList.models.forEach(m => {
            console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(", ")})`);
        });
    } catch (error: any) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
