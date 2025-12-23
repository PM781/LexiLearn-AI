require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// --- CONNECT TO DATABASE ---
console.log("⏳ Attempting to connect to MongoDB...");
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- INITIALIZE AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// --- ROUTE: Generate Quiz ---
app.post('/api/quiz', async (req, res) => {
    try {
        const { topic, difficulty, count } = req.body;
        console.log(`🧠 Generating Quiz: ${topic} (${difficulty})`);

        const prompt = `
            Create a challenging VOCABULARY quiz about "${topic}".
            Focus on: Complex terminology, definitions of tough words, and jargon related to ${topic}.
            Do NOT ask simple trivia facts. Ask for the meaning of specific words.
            
            Difficulty: ${difficulty}.
            Number of Questions: ${count}.
            Format: Return ONLY a raw JSON array.
            Structure:
            [
              {
                "question": "What is the definition of [Complex Word]?",
                "options": ["Definition A", "Definition B", "Definition C", "Definition D"],
                "answer": "Definition A" 
              }
            ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("🤖 AI Response Received. Cleaning data...");

        // --- THE FIX: SMART CLEANING ---
        // This looks for the first '[' and the last ']' to find the JSON
        const jsonStartIndex = text.indexOf('[');
        const jsonEndIndex = text.lastIndexOf(']') + 1;

        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            throw new Error("AI did not return a valid array");
        }

        const cleanJson = text.substring(jsonStartIndex, jsonEndIndex);
        const quizData = JSON.parse(cleanJson);

        console.log("✅ Quiz Parsed Successfully!");
        res.json(quizData);

    } catch (error) {
        console.error("❌ SERVER ERROR:", error);
        // This sends the actual error details to your browser so we can see it
        res.status(500).json({ error: error.message || "Failed to generate quiz" });
    }
});

// --- ROUTES FOR AUTH (Keep your existing ones) ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});