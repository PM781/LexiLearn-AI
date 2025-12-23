// Base URL for the Free Dictionary API
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

// A list of words to quiz
const wordList = [
    "serendipity", "ephemeral", "oblivion", "solitude", "aurora",
    "velocity", "galaxy", "nebula", "labyrinth", "ethereal",
    "nostalgia", "sonder", "petrichor", "luminescence", "zenith"
];

async function fetchWordData() {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];

    try {
        const response = await fetch(API_URL + randomWord);
        const data = await response.json();
        
        // Safety check: sometimes the API returns no definition
        if(!data[0] || !data[0].meanings[0]) return null;

        const definition = data[0].meanings[0].definitions[0].definition;
        
        return {
            word: randomWord,
            definition: definition
        };

    } catch (error) {
        console.error("Error fetching word:", error);
        return null; 
    }
}