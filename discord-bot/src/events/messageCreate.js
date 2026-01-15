const { Events } = require('discord.js');
const { generateResponse, generateEmbedding } = require('../services/ai');
const { searchKnowledge, getSystemInstructions, getAllowedChannels } = require('../services/supabase');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore messages from bots
        if (message.author.bot) {
            return;
        }

        // Check if channel is allowed
        const allowedChannels = await getAllowedChannels();
        const isAllowedChannel = allowedChannels.includes(message.channel.id);

        // Check mentions/keywords
        const isMentioned = message.mentions.users.has(message.client.user.id);
        const isDM = !message.guild;
        const keywords = ['bot', 'copilot', 'hey', 'hi', 'hello'];
        const hasKeyword = keywords.some(k => message.content.toLowerCase().includes(k));

        // Logic: 
        // 1. If in allowed channel -> Respond to EVERYTHING (unless bot)
        // 2. If mentioned/DM/keyword -> Respond (fallback for other channels)
        if (!isAllowedChannel && !isMentioned && !isDM && !hasKeyword) return;

        try {
            await message.channel.sendTyping();

            // Extract the user's query (remove mention)
            const userQuery = message.content.replace(/<@!?[0-9]+>/g, '').trim();

            if (!userQuery) return;

            // 1. Generate embedding for the query
            const embedding = await generateEmbedding(userQuery);

            // 2. Search for relevant context from knowledge base
            let context = '';
            if (embedding) {
                const relevantDocs = await searchKnowledge(embedding);
                if (relevantDocs && relevantDocs.length > 0) {
                    context = "RELEVANT KNOWLEDGE BASE INFO:\n" +
                        relevantDocs.map(doc => `- ${doc.content}`).join('\n') +
                        "\n\n";
                }
            }

            // 3. Get generic system instructions
            const systemInstructions = await getSystemInstructions();
            console.log('   - System Instructions Fetched:', systemInstructions ? 'Yes' : 'No');
            console.log('   - Instructions Preview:', (systemInstructions || '').substring(0, 50) + '...');

            // 4. Combine instructions + context
            const fullContext = `SYSTEM INSTRUCTIONS: ${systemInstructions}\n\n${context}`;

            // 5. Generate AI response
            const response = await generateResponse(fullContext, userQuery);

            // 6. Split response if too long for Discord (2000 chars)
            if (response.length > 2000) {
                const chunks = response.match(/[\s\S]{1,1900}/g) || [];
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
            } else {
                await message.reply(response);
            }

        } catch (error) {
            console.error('Error processing message:', error);
            await message.reply('Sorry, I encountered an error while processing your request.');
        }
    },
};
