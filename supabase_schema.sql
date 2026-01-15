    -- ============================================
    -- Discord Copilot Database Schema
    -- Run this in your Supabase SQL Editor
    -- ============================================

    -- Enable pgvector extension for RAG (embeddings)
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Admin Configuration Table
    -- Stores system instructions and global settings
    CREATE TABLE IF NOT EXISTS admin_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        system_instructions TEXT DEFAULT 'You are a helpful assistant.',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insert default config if not exists
    INSERT INTO admin_config (system_instructions) 
    VALUES ('You are a helpful assistant. Be friendly, concise, and accurate in your responses.')
    ON CONFLICT DO NOTHING;

    -- Allowed Discord Channels Table
    -- Only channels in this list will receive bot responses
    CREATE TABLE IF NOT EXISTS allowed_channels (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        channel_id TEXT NOT NULL UNIQUE,
        channel_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Conversation Memory Table
    -- Stores rolling summaries per channel
    CREATE TABLE IF NOT EXISTS conversation_memory (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        channel_id TEXT NOT NULL UNIQUE,
        summary TEXT DEFAULT '',
        message_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Knowledge Documents Table
    -- Stores uploaded PDF metadata
    CREATE TABLE IF NOT EXISTS knowledge_documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        filename TEXT NOT NULL,
        file_size INTEGER,
        chunk_count INTEGER DEFAULT 0,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Knowledge Chunks Table
    -- Stores chunked text from PDFs with embeddings
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding VECTOR(768),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for vector similarity search
    CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
    ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

    -- Function to search similar chunks
    CREATE OR REPLACE FUNCTION search_knowledge(
        query_embedding VECTOR(768),
        match_threshold FLOAT DEFAULT 0.7,
        match_count INT DEFAULT 5
    )
    RETURNS TABLE (
        id UUID,
        content TEXT,
        similarity FLOAT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT
            knowledge_chunks.id,
            knowledge_chunks.content,
            1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
        FROM knowledge_chunks
        WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
        ORDER BY knowledge_chunks.embedding <=> query_embedding
        LIMIT match_count;
    END;
    $$;

    -- Row Level Security (RLS) Policies
    -- Enable RLS on all tables
    ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
    ALTER TABLE allowed_channels ENABLE ROW LEVEL SECURITY;
    ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
    ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

    -- Allow authenticated users to manage all data
    CREATE POLICY "Allow authenticated access" ON admin_config
        FOR ALL USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated access" ON allowed_channels
        FOR ALL USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated access" ON conversation_memory
        FOR ALL USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated access" ON knowledge_documents
        FOR ALL USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated access" ON knowledge_chunks
        FOR ALL USING (auth.role() = 'authenticated');

    -- Allow anon access for the Discord bot (read-only for config, write for memory)
    CREATE POLICY "Allow anon read" ON admin_config
        FOR SELECT USING (true);

    CREATE POLICY "Allow anon read" ON allowed_channels
        FOR SELECT USING (true);

    CREATE POLICY "Allow anon all" ON conversation_memory
        FOR ALL USING (true);

    CREATE POLICY "Allow anon read" ON knowledge_chunks
        FOR SELECT USING (true);
