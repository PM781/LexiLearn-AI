const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        console.log("Testing connection...");
        const result = await model.generateContent("Hello");
        console.log("✅ SUCCESS! Model is working.");
    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}
listModels();