//run "mongosh" at terminal first (default profile: Git Bash). 
//run "node server.js" (default profile: PowerShell), do not use the one under server. 
//run "npm install openai (default profile: PowerShell)". 
//to run the changes in server.js, you need to reopen VS Code and run the commands above again. 

import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
//Open AI_1: get Open AI in
import OpenAI from "openai";
import dotenv from "dotenv";
import UserContext from "./server/models/UserContext.js";

//Open AI_1: get Open AI in
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize the Express application
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Connect to a MongoDB Database
mongoose.connect('mongodb://localhost:27017/design', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// // Update the user context interface
app.post('/update-context', async (req, res) => {
    const { userId, input } = req.body;

    if (!userId || !input) {
        return res.status(400).json({ error: 'Missing userId or input' });
    }

    try {
        let userContext = await UserContext.findOne({ userId });
        if (!userContext) {
            userContext = new UserContext({ userId, preferences: {} });
        }

        //Open AI_4: added "await" below because parseInputToPreferences is now asynchronous.
        const updatedPreferences = await parseInputToPreferences(input, userContext.preferences);
        userContext.preferences = updatedPreferences;

        // Save the updatedPreferences (newly generated parameters) to the user's database record. Example: Store the updated parameters (e.g. {“width”: 20, “height”: 20, “depth”: 20, “color”: 0x0000ff}) to MongoDB.
        await userContext.save();

        // Return the updated context, and eventually return the updated userContext.preferences to the frontend.
        res.json(userContext.preferences);
    } catch (error) {
        console.error('Error updating context:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//save API
const localSynonyms = {
    "greater": "bigger",
    "tighter": "smaller",
    "crimson": "red",
    "navy": "blue",
    "stretch": "longer",
    "compress": "shorter"
};

const inputCache = new Map(); // Cache

//Open AI_2: use GPT to parse the user's input and convert it to standard terms before parseInputToPreferences
async function normalizeInput(input) {
    if (inputCache.has(input)) {
        return inputCache.get(input); // Check the cache first
    }
    if (localSynonyms[input.toLowerCase()]) {
        return localSynonyms[input.toLowerCase()]; // Look up the local dictionary then
    }

    const prompt = `Convert "${input}" into a standardized command.`;

    // const prompt = `
    // Convert the following request into a standardized command using predefined keywords:
    // - "greater" -> "bigger"
    // - "tighter" -> "smaller"
    // - "crimson" -> "red"
    // - "navy" -> "blue"
    // - "stretch" -> "longer"
    // - "compress" -> "shorter"

    // Input: "${input}"
    // Output: 
    // `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 55,
            temperature: 0
        });

        const parsedInput = response.choices[0].message.content.trim();
        inputCache.set(input, parsedInput); // save into the cache
        
        return parsedInput; 
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return input;
    }
}

//Open AI_5: Added "async" below to declare parseInputToPreferences as an async function, so the "await" in Open AI_3 can work. 
async function parseInputToPreferences(input, existingPreferences) {
    
    //Open AI_3: parse the input with GPT 
    input = await normalizeInput(input);
    
    const parameters = { ...existingPreferences };

    const biggerCount = (input.match(/bigger/g) || []).length;
    if (biggerCount > 0) {
        parameters.width = (parameters.width || 10) + biggerCount;
        parameters.height = (parameters.height || 10) + biggerCount;
        parameters.depth = (parameters.depth || 10) + biggerCount;
    }

    const smallerCount = (input.match(/smaller/g) || []).length;
    if (smallerCount > 0) {
        parameters.width = Math.max(1, (parameters.width || 10) - smallerCount);
        parameters.height = Math.max(1,(parameters.height || 10) - smallerCount);
        parameters.depth = Math.max(1,(parameters.depth || 10) - smallerCount);
    }

    const muchBiggerCount = (input.match(/much bigger/g) || []).length;
    if (muchBiggerCount > 0) {
        parameters.width = (parameters.width || 10) + muchBiggerCount * 2;
        parameters.height = (parameters.height || 10) + muchBiggerCount * 2;
        parameters.depth = (parameters.depth || 10) + muchBiggerCount * 2;
    }

    const muchSmallerCount = (input.match(/much smaller/g) || []).length;
    if (muchSmallerCount > 0) {
        parameters.width = Math.max(1, (parameters.width || 10) - muchSmallerCount * 2);
        parameters.height = Math.max(1, (parameters.height || 10) - muchSmallerCount * 2);
        parameters.depth = Math.max(1, (parameters.depth || 10) - muchSmallerCount * 2);
    }

    if (input.includes('longer')) {
        parameters.width = (parameters.width || 10) + 1;
    }

    if (input.includes('shorter')) {
        parameters.width = Math.max(1, (parameters.width || 10) - 1);
    }

    if (input.includes('blue')) {
        parameters.color = 0x0000ff; 
    }

    if (input.includes('red')) {
        parameters.color = 0xFF0000; 
    }

    if (input.includes('green')) {
        parameters.color = 0x00FF00; 
    }

    return parameters;
}

// console.log(parameters);

app.get('/', (req, res) => {
    res.send('Design in Action API is running!');
});
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
