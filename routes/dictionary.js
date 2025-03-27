const express = require('express');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Store previous word queries
let previousWord = [];
let previousResponse = [];

// APIs configuration
const WORDNIK_API_KEY = '6n88dr8jqmywcpgnjzzbrrlw8u3ou4c4qtnbwj26cj5hej2qj'
const MW_DICT_API_KEY = 'bc616239-a540-4793-8f59-7741873c1339';
const MW_THESAURUS_API_KEY = 'daa716c5-ed4f-48aa-80d0-2f0888449142';
const GEMINI_API_KEY = 'AIzaSyAogvnXxx6hO7OGl7Q7kfYiLrGTHocOeLs';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });



async function fetchData(url, retries = 3) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data: ${error.message}`);
        if (retries > 0) return fetchData(url, retries - 1);
        return null;
    }
}

/**
 * ✅ Fetch Data from Merriam-Webster
 */
async function getMWData(word) {
    try {
        const dictRes = await fetchData(`https://www.dictionaryapi.com/api/v3/references/sd3/json/${word}?key=${MW_DICT_API_KEY}`);
        const thesaurusRes = await fetchData(`https://www.dictionaryapi.com/api/v3/references/ithesaurus/json/${word}?key=${MW_THESAURUS_API_KEY}`);

        let definitions = [];
        let synonyms = [];
        let examples = [];

        for (const entry of dictRes || []) {
            if (typeof entry === "object" && entry.shortdef) {
                entry.shortdef.forEach(def => {
                    definitions.push({
                        definition: def,
                        partOfSpeech: entry.fl || "Unknown",
                        source: "Merriam-Webster"
                    });
                });
            }
        }

        for (const entry of thesaurusRes || []) {
            if (typeof entry === "object" && entry.meta?.syns) {
                synonyms = entry.meta.syns[0].map(s => ({ word: s, source: "Merriam-Webster" }));
            }
        }

        return { definitions, synonyms, examples };
    } catch (error) {
        console.error("Merriam-Webster API Error:", error.message);
        return { definitions: [], synonyms: [], examples: [] };
    }
}

/**
 * ✅ Fetch Data from Wordnik
 */
async function getWordnikData(word) {
    try {
        const definitionsRes = await fetchData(`https://api.wordnik.com/v4/word.json/${word}/definitions?limit=5&api_key=${WORDNIK_API_KEY}`);
        const synonymsRes = await fetchData(`https://api.wordnik.com/v4/word.json/${word}/relatedWords?limitPerRelationshipType=10&api_key=${WORDNIK_API_KEY}`);
        const examplesRes = await fetchData(`https://api.wordnik.com/v4/word.json/${word}/examples?limit=5&api_key=${WORDNIK_API_KEY}`);

        let definitions = definitionsRes?.map(def => ({
            definition: def.text,
            partOfSpeech: def.partOfSpeech || "Unknown",
            source: "Wordnik"
        })) || [];

        const synonymsEntry = synonymsRes?.find(entry => entry.relationshipType === 'synonym');
        const synonym = synonymsEntry ? synonymsEntry.words : ["No synonyms available"];
    

        let examples = examplesRes?.examples?.map(example => example.text) || [];

        return { definitions, synonym, examples };
    } catch (error) {
        console.error("Wordnik API Error:", error.message);
        return { definitions: [], synonyms: [], examples: [] };
    }
}

async function getFreeDictionaryData(word) {
    const data = await fetchData(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    let definitions = [], synonyms = [], examples = [];

    for (const entry of data || []) {
        for (const meaning of entry.meanings || []) {
            for (const def of meaning.definitions || []) {
                definitions.push({ definition: def.definition, partOfSpeech: meaning.partOfSpeech, source: "Free Dictionary" });
                if (def.example) examples.push(def.example);
                if (def.synonyms) synonyms.push(...def.synonyms);
            }
        }
    }

    return { definitions, synonyms, examples };
}


async function mergeData(word) {
    const mwData = await getMWData(word);
    const wordnikData = await getWordnikData(word);
    const freeDict = await getFreeDictionaryData(word)
    return {
        word,
        sources: {
            "Merriam-Webster API": {
                definitions: mwData.definitions,
                synonyms: mwData.synonyms,
                examples: mwData.examples
            },
            "Wordnik API": {
                definitions: wordnikData.definitions,
                synonyms: wordnikData.synonym,  // Fixing the key naming issue
                examples: wordnikData.examples
            },
            "Free Dictionary API":{
                definitions: freeDict.definitions,
                synonyms: freeDict.synonyms,  // Fixing the key naming issue
                examples: freeDict.examples
            }
        }
    };
}



async function classifyQueryUsingGemini(text) {
    try {
        const prompt = `Classify the following user query into one of these types:
        - "greeting" (if it's a greeting like hi, hello)
        - "bot-info" (if it's about the bot's role, like who are you?)
        - "follow-up" (if it's asking for more details like more examples,explain clearly,proper explaination,if the user didn't get the word meaning)
        - "dictionary" (if the user is asking for a word meaning)
        - "out-of-scope" (if it's not related to the above categories and it's not related to meaning or vocabulary or dictionary)
        
        Query: "${text}"
        Return the type ONLY, without explanation.`;

        console.log("🔹 Sending request to Gemini for classification...");

        const result = await model.generateContent(prompt);
        console.log("🔹 Full Gemini API Response:", JSON.stringify(result, null, 2));

        const classification = result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        console.log("🔹 Classified as:", classification);

        if (classification === "dictionary") {
            const word = await extractWordUsingGemini(text);
            return { type: "dictionary", word };
        }

        return { type: classification || "out-of-scope" };
    } catch (error) {
        console.error("❌ Error classifying query using Gemini:", error.message);
        return { type: "out-of-scope" };
    }
}

async function extractWordUsingGemini(text) {
    try {
        const prompt = `Extract the main dictionary word from the following query:
        "${text}"
        Only return the single word without any extra text.`;

        console.log("🔹 Sending request to Gemini for word extraction...");

        const result = await model.generateContent(prompt);
        console.log("🔹 Full Gemini API Response:", JSON.stringify(result, null, 2));

        const extractedWord = result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        console.log("🔹 Extracted word from Gemini:", extractedWord);

        return extractedWord || null;
    } catch (error) {
        console.error("❌ Error extracting word using Gemini API:", error.message);
        return null;
    }
}

/**
 * Fetch AI-generated responses for out-of-scope queries
 */
async function fetchFromGemini(query) {
    try {
        const result = await model.generateContent(query);
        return result.response || "I'm sorry, I couldn't process that request.";
    } catch (error) {
        console.error("Error fetching response from Gemini AI:", error.message);
        return "Error processing request.";
    }
}

/**
 * ✅ Handle all chatbot requests (Dictionary + Bot Info + Greetings + Follow-ups)
 */
router.post('/chat', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided' });

    const classification = await classifyQueryUsingGemini(query);
    if (classification.type === "dictionary") {
        const word = classification.word;
        console.log(`Fetching dictionary data for: ${word}`);
    
        try {
            const data = await mergeData(word);
    
            if (data.sources) {
                previousWord = [word];
                previousResponse = [data.sources];
            }
    
            return res.json(data);
        } catch (error) {
            console.error(`Error fetching dictionary data for ${word}:`, error.message);
            return res.json({ word, error: "Error retrieving dictionary data" });
        }
    }
    

    if (classification.type === "follow-up") {
        if (previousWord.length > 0) {
            const lastWord = previousWord[previousWord.length - 1];
            console.log(`Fetching follow-up details for: ${lastWord}`);
            const responseData = await fetchFromGemini(`${query} of the word ${lastWord}`);
            return res.json({ response: responseData });
        }
        return res.json({ error: "No previous word context found" });
    }

    if (classification.type === "greeting") return res.json({ response: "Hello! I'm DictionBot, your vocabulary assistant. How can I help you with words today?" });

    if (classification.type === "bot-info") return res.json({ response: "I am DictionBot, a dictionary-based chatbot! I will help you to learn vocabulary and provide explanation for clear understanding." });

    if (classification.type === "out-of-scope") return res.json({ response: "I am DictionBot, a dictionary-based chatbot! I only provide knowledge related to dictionary and vocabulary. Please feel free to ask any kind of meanings, definitions, etc." });
    
    return res.json({ response: await fetchFromGemini(query) });
});

module.exports = router;
