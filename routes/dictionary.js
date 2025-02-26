const express = require('express');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Store previous word queries
let previousWord = [];
let previousResponse = [];

// APIs configuration
const WORDNIK_API_KEY = '6n88dr8jqmywcpgnjzzbrrlw8u3ou4c4qtnbwj26cj5hej2qj';
const GEMINI_API_KEY = 'AIzaSyAogvnXxx6hO7OGl7Q7kfYiLrGTHocOeLs';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Fetch Definitions and Part of Speech
 */
async function fetchDefinitions(word) {
    try {
        const response = await axios.get(
            `https://api.wordnik.com/v4/word.json/${word}/definitions?limit=10&api_key=${WORDNIK_API_KEY}`
        );
        return response.data.length > 0
            ? response.data.map(entry => ({
                definition: entry.text || "No definition available",
                partOfSpeech: entry.partOfSpeech || "N/A"
            }))
            : [{ definition: "No definition found", partOfSpeech: "N/A" }];
    } catch (error) {
        console.error("Error fetching definitions:", error.message);
        return [{ definition: "Error fetching definition", partOfSpeech: "N/A" }];
    }
}

/**
 * Fetch Examples
 */
async function fetchExamples(word) {
    try {
        const response = await axios.get(
            `https://api.wordnik.com/v4/word.json/${word}/examples?limit=5&api_key=${WORDNIK_API_KEY}`
        );
        return response.data.examples?.map(example => example.text) || ["No examples found"];
    } catch (error) {
        console.error("Error fetching examples:", error.message);
        return ["Error fetching examples"];
    }
}

/**
 * Fetch Synonyms
 */
async function fetchSynonyms(word) {
    try {
        const response = await axios.get(
            `https://api.wordnik.com/v4/word.json/${word}/relatedWords?limitPerRelationshipType=10&api_key=${WORDNIK_API_KEY}`
        );
        const synonymsEntry = response.data.find(entry => entry.relationshipType === 'synonym');
        return synonymsEntry ? synonymsEntry.words : ["No synonyms available"];
    } catch (error) {
        console.error("Error fetching synonyms:", error.message);
        return ["Error fetching synonyms"];
    }
}

/**
 * Smarter Dictionary Query Detection
 */
const dictionaryKeywords = [
    "what is the meaning of", "define", "meaning of", "mean by",
    "word meaning", "mean", "what does", "what is mean by"
];

function extractDictionaryWord(text) {
    const lowerText = text.toLowerCase();
    
    for (const keyword of dictionaryKeywords) {
        if (lowerText.includes(keyword)) {
            const wordsAfterKeyword = lowerText.split(keyword).pop().trim();
            if (wordsAfterKeyword) {
                return wordsAfterKeyword.split(" ")[0]; // Extract the first word after the keyword
            }
        }
    }
    return null;
}

/**
 * Smarter Greetings Detection
 */
const greetingsPatterns = /\b(hi|hello+|hey+|hai+)\b/i;

/**
 * Bot Info Query Detection
 */
const botInfoPatterns = /\b(who are you|what are you doing|what's your job|what is dictionbot|what is your role|why are you here|what's dictionbot)\b/i;

/**
 * Classify query: Dictionary, Greetings, Info about Bot, or General
 */
function classifyQuery(text) {
    const word = extractDictionaryWord(text);
    if (word) return { type: "dictionary", word };

    if (greetingsPatterns.test(text)) return { type: "greeting" };

    if (botInfoPatterns.test(text)) return { type: "bot-info" };

    // Detecting follow-up queries
    if (/\bmore synonyms\b/i.test(text)) return { type: "follow-up", requestType: "synonyms" };
    if (/\bmore examples\b/i.test(text)) return { type: "follow-up", requestType: "examples" };
    if (/\bmore definitions\b/i.test(text)) return { type: "follow-up", requestType: "definitions" };
    if (/\b(didn't get it|explain|elaborate|simpler terms)\b/i.test(text)) return { type: "follow-up", requestType: "explanation" };
    
    return { type: "out-of-scope" };
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
 * Handle all chatbot requests (Dictionary + Bot Info + Greetings + Restrictions)
 */
router.post('/chat', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided' });

    const classification = classifyQuery(query);

    if (classification.type === "dictionary") {
        const word = classification.word;
        console.log(`Fetching dictionary data for: ${word}`);

        const [definitions, examples, synonyms] = await Promise.all([
            fetchDefinitions(word),
            fetchExamples(word),
            fetchSynonyms(word)
        ]);

        previousWord = [word];
        previousResponse = [{ definitions, examples, synonyms }];

        return res.json({ word, definitions, examples, synonyms });
    }

    if (classification.type === "follow-up") {
        if (previousWord.length > 0) {
            const lastWord = previousWord[previousWord.length - 1];
            console.log(`Fetching follow-up details for: ${lastWord}`);
            const q = `${query} of the word ${lastWord}`;
            console.log(q);
            const responseData = await fetchFromGemini(q);

            return res.json({ response: responseData });
        } else {
            return res.json({ error: "No previous word context found" });
        }
    }

    if (classification.type === "greeting") {
        console.log("Greeting detected!");
        return res.json({ response: "Hello! I'm DictionBot, your vocabulary assistant. How can I help you with words today?" });
    }

    if (classification.type === "bot-info") {
        console.log("Bot info detected!");
        return res.json({
            response: "I am DictionBot, a dictionary-based chatbot! I help users understand words by providing definitions, synonyms, and examples. Feel free to ask me about any word!"
        });
    }

    if (classification.type === "out-of-scope") {
        console.log("Out-of-scope query detected!");
        const resp = await fetchFromGemini(query)
        return res.json({
            response: resp
        });
    }

    return res.json({ response: "Sorry, I couldn't understand your query." });
});

module.exports = router;
