const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or Key is missing!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Search for relevant content using vector similarity
async function searchKnowledge(queryEmbedding) {
    try {
        const { data, error } = await supabase.rpc('search_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: 0.6,
            match_count: 5
        });

        if (error) {
            console.error('Error searching knowledge:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Unexpected error in searchKnowledge:', error);
        return [];
    }
}

// Get system instructions from admin config
async function getSystemInstructions() {
    try {
        const { data, error } = await supabase
            .from('admin_config')
            .select('system_instructions')
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching system instructions:', error);
            return 'You are a helpful assistant.';
        }

        return data?.system_instructions || 'You are a helpful assistant.';
    } catch (error) {
        return 'You are a helpful assistant.';
    }
}

// Get allowed channels
async function getAllowedChannels() {
    try {
        const { data, error } = await supabase
            .from('allowed_channels')
            .select('channel_id');

        if (error) {
            console.error('Error fetching allowed channels:', error);
            return [];
        }

        return data.map(ch => ch.channel_id);
    } catch (error) {
        console.error('Unexpected error in getAllowedChannels:', error);
        return [];
    }
}

module.exports = {
    supabase,
    searchKnowledge,
    getSystemInstructions,
    getAllowedChannels
};
