const { Events } = require('discord.js');
const { generateResponse, generateEmbedding, generateSummary } = require('../services/ai');
const { searchKnowledge, getSystemInstructions, getAllowedChannels, getConversationMemory, updateConversationMemory } = require('../services/supabase');

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

        // Check mentions
        const isMentioned = message.mentions.users.has(message.client.user.id);

        // Logic: 
        // 1. If in allowed channel -> Respond to EVERYTHING
        // 2. If NOT in allowed channel -> Respond ONLY if mentioned
        if (!isAllowedChannel && !isMentioned) return;

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

            // 3. Get generic system instructions and conversation memory
            const systemInstructions = await getSystemInstructions();
            const memory = await getConversationMemory(message.channel.id);
            const memorySummary = memory?.summary || 'No previous context available.';

            console.log('   - System Instructions Fetched:', systemInstructions ? 'Yes' : 'No');
            console.log('   - Memory Fetched:', memory ? `Yes (${memory.message_count} msgs)` : 'No');

            // 4. Combine instructions + memory + context
            const fullContext = `SYSTEM INSTRUCTIONS: ${systemInstructions}\n\nCONVERSATION SUMMARY: ${memorySummary}\n\n${context}`;

            // 5. Generate AI response
            let response;
            try {
                response = await generateResponse(fullContext, userQuery);
            } catch (aiError) {
                console.error('❌ AI Response Generation Failed:', aiError.message);
                await message.reply('I am having trouble processing that right now. Please try again in a moment.');
                return;
            }

            // 6. Split response if too long for Discord (2000 chars)
            if (response.length > 2000) {
                const chunks = response.match(/[\s\S]{1,1900}/g) || [];
                for (const chunk of chunks) {
                    await message.reply(chunk).catch(console.error);
                }
            } else {
                await message.reply(response).catch(console.error);
            }

            // 7. Update Conversation Memory
            try {
                const newMessageCount = (memory?.message_count || 0) + 1;
                let finalSummary = memorySummary;

                // Update summary every 5 messages or if it's the first message
                if (newMessageCount % 5 === 0 || !memory) {
                    console.log('   - Updating conversation summary...');
                    const recentHistory = `User: ${userQuery}\nBot: ${response}`;
                    const combinedContext = memory ? `Previous Summary: ${memory.summary}\nRecent Interaction: ${recentHistory}` : recentHistory;

                    try {
                        const newSummary = await generateSummary(combinedContext);
                        if (newSummary) finalSummary = newSummary;
                    } catch (sumError) {
                        console.error('   ⚠️ Summary generation failed (using old summary):', sumError.message);
                    }
                }

                await updateConversationMemory(message.channel.id, finalSummary, newMessageCount);
                console.log('   ✅ Memory Synced to Supabase');
            } catch (memError) {
                console.error('   ❌ Failed to sync memory to Supabase:', memError.message);
            }

        } catch (error) {
            console.error('Error processing message:', error);
            await message.reply('Sorry, I encountered an error while processing your request.');
        }
    },
};
