require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listMyModels() {
    console.log("🔍 Contacting Google API directly...");
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n✅ SUCCESS! Here are the models you can use:");
            console.log("---------------------------------------------");
            // Filter to show only 'generateContent' models (the ones we need)
            const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            
            chatModels.forEach(m => {
                // m.name usually looks like "models/gemini-pro"
                // We just want the last part: "gemini-pro"
                const cleanName = m.name.replace("models/", "");
                console.log(`🌟 ${cleanName}`);
            });
            console.log("---------------------------------------------");
        } else {
            console.log("❌ CONNECTION SUCCESSFUL, BUT NO MODELS FOUND.");
            console.log("Google says:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ NETWORK ERROR:", error.message);
    }
}

listMyModels();