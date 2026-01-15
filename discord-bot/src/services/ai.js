const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set!');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Generate a response using Gemini
async function generateResponse(context, userMessage) {
    try {
        // Use a supported model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `${context}

USER MESSAGE: ${userMessage}

Please respond to the user's message based on the context provided above. Be helpful, concise, and follow any system instructions given.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return text || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error('Error generating response:', error);
        throw new Error('Failed to generate AI response');
    }
}

// Generate a summary of conversation history
async function generateSummary(conversationHistory) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Please create a concise summary of the following conversation history. Focus on the key topics discussed, any decisions made, and important information shared. Keep the summary under 500 characters.

CONVERSATION:
${conversationHistory}

SUMMARY:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return text || conversationHistory.slice(0, 500);
    } catch (error) {
        console.error('Error generating summary:', error);
        return conversationHistory.slice(-500);
    }
}

// Generate embeddings for RAG search
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}

module.exports = {
    generateResponse,
    generateSummary,
    generateEmbedding,
};
