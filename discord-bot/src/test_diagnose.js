require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

async function testServices() {
    console.log('--- Starting Diagnosis ---');

    // 1. Check Env Vars
    const steps = [
        { name: 'DISCORD_TOKEN', val: process.env.DISCORD_TOKEN },
        { name: 'GEMINI_API_KEY', val: process.env.GEMINI_API_KEY },
        { name: 'SUPABASE_URL', val: process.env.SUPABASE_URL },
        { name: 'SUPABASE_ANON_KEY', val: process.env.SUPABASE_ANON_KEY },
    ];

    let allVarsPresent = true;
    for (const s of steps) {
        if (!s.val) {
            console.error(`❌ Missing ${s.name}`);
            allVarsPresent = false;
        } else {
            console.log(`✅ ${s.name} is present`);
        }
    }

    if (!allVarsPresent) {
        console.error('Stopping diagnosis due to missing env vars.');
        return;
    }

    // 2. Test Gemini API
    console.log('\n--- Testing Gemini API ---');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use known working model first to test Auth
        const result = await model.generateContent('Hello, are you working?');
        console.log('✅ Gemini API (1.5-flash) Connection Successful');
        console.log('Response:', result.response.text());
    } catch (e) {
        console.error('❌ Gemini API (1.5-flash) Failed:', e.message);
    }

    try {
        console.log('Testing gemini-1.5-flash (as validation)...');
        // Note: The actual code uses 'gemini-1.5-flash', so we test if that model exists/works
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Hello?');
        console.log('✅ Gemini API (1.5-flash) Works!');
    } catch (e) {
        console.error('❌ Gemini API (1.5-flash) Failed (Model might not exist):', e.message);
    }

    // 3. Test Supabase
    console.log('\n--- Testing Supabase ---');
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { data, error } = await supabase.from('admin_config').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Supabase Connection Failed:', error.message);
        } else {
            console.log('✅ Supabase Connection Successful');
        }
    } catch (e) {
        console.error('❌ Supabase Test Exception:', e.message);
    }
}

testServices();
