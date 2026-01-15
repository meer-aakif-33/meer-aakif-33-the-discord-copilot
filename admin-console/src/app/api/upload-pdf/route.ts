export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Official PDF.js Node setup
const pdfjsLib = require("pdfjs-dist/build/pdf.js");
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/build/pdf.worker.js"
);



/* -------------------- Polyfills -------------------- */

// const g = globalThis as any;

// if (!g.DOMMatrix) {
//     g.DOMMatrix = class DOMMatrix {
//         constructor() { }
//         toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
//         multiply() { return this; }
//         translate() { return this; }
//         scale() { return this; }
//         transformPoint(p: any) { return p; }
//     };
// }

// if (!g.Canvas) {
//     g.Canvas = class Canvas {
//         getContext() {
//             return {
//                 drawImage: () => { },
//                 measureText: () => ({ width: 0 }),
//                 fillText: () => { },
//                 strokeText: () => { },
//                 save: () => { },
//                 restore: () => { },
//                 translate: () => { },
//                 rotate: () => { },
//                 scale: () => { },
//                 arc: () => { },
//                 fill: () => { },
//                 stroke: () => { },
//             };
//         }
//     };
// }

// // Some environments might still need these basic mocks
// if (!global.DOMMatrix) {
//     // @ts-ignore
//     global.DOMMatrix = class DOMMatrix {
//         constructor() { }
//         toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
//         multiply() { return this; }
//         translate() { return this; }
//         scale() { return this; }
//         transformPoint(p: any) { return p; }
//     };
// }

// if (!global.Canvas) {
//     // @ts-ignore
//     global.Canvas = class Canvas {
//         getContext() {
//             return {
//                 drawImage: () => { },
//                 measureText: () => ({ width: 0 }),
//                 fillText: () => { },
//                 strokeText: () => { },
//                 save: () => { },
//                 restore: () => { },
//                 translate: () => { },
//                 rotate: () => { },
//                 scale: () => { },
//                 arc: () => { },
//                 fill: () => { },
//                 stroke: () => { },
//             }
//         }
//     };
// }

/* -------------------- Clients -------------------- */

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
}

function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY!;
    return new GoogleGenerativeAI(apiKey);
}


/* -------------------- Core Logic -------------------- */

function sanitizeText(text: string): string {
    return text
        .replace(/\u0000/g, "")
        .replace(/[\x00-\x1F\x7F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

async function extractTextFromPDF(base64Content: string): Promise<string> {
    const raw = Buffer.from(base64Content, "base64");
    const uint8Array = new Uint8Array(raw);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str).join(" ");
        fullText += strings + "\n";
    }

    const clean = sanitizeText(fullText);
    if (clean.length < 20) {
        throw new Error("No readable text found in PDF.");
    }

    return clean;
}


function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        chunks.push(chunk);
        start = end - overlap;
        if (start < 0) start = 0;
    }
    return chunks.map(sanitizeText).filter((c) => c.length > 20);
}

async function generateEmbedding(genAI: GoogleGenerativeAI, text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}


/* -------------------- API Handler -------------------- */

export async function POST(request: NextRequest) {
    const requestId = crypto.randomUUID();
    console.log(`[UPLOAD][${requestId}] Request Received`);

    try {
        const body = await request.json();
        const { filename, fileSize, content } = body;

        if (!filename || !content) {
            return NextResponse.json(
                { success: false, message: "Missing filename or content" },
                { status: 400 }
            );
        }

        // 1. Extract
        // console.log(`[UPLOAD][${requestId}] Extracting text...`);
        const extractedText = await extractTextFromPDF(content);
        // console.log(`[UPLOAD][${requestId}] Extracted ${extractedText.length} chars`);

        // 2. Chunk
        const chunks = chunkText(extractedText);
        if (chunks.length === 0) {
            return NextResponse.json(
                { success: false, message: "No valid text chunks created" },
                { status: 400 }
            );
        }

        // 3. Database & AI
        const supabase = getSupabaseClient();
        const genAI = getGenAI();

        const { data: docData, error: docError } = await supabase
            .from("knowledge_documents")
            .insert({
                filename,
                file_size: fileSize || 0,
                chunk_count: chunks.length,
            })
            .select()
            .single();

        if (docError || !docData) {
            console.error(`[UPLOAD][${requestId}] DB Error:`, docError);
            return NextResponse.json(
                { success: false, message: "Failed to create document record" },
                { status: 500 }
            );
        }

        // 4. Embed & Store Chunks
        // console.log(`[UPLOAD][${requestId}] Storing ${chunks.length} chunks...`);
        const chunkRecords = [];

        for (let i = 0; i < chunks.length; i++) {
            try {
                const embedding = await generateEmbedding(genAI, chunks[i]);
                chunkRecords.push({
                    document_id: docData.id,
                    content: chunks[i],
                    chunk_index: i,
                    embedding,
                });
            } catch (err) {
                console.error(`[UPLOAD][${requestId}] Embedding Error at chunk ${i}:`, err);
                // Continue with other chunks? Or fail? failing is safer for consistency.
                // For now, let's log and continue to save what we can? 
                // Using 'await' loop means it's slow but safe.
            }
        }

        if (chunkRecords.length > 0) {
            const { error: chunkError } = await supabase
                .from("knowledge_chunks")
                .insert(chunkRecords);

            if (chunkError) {
                console.error(`[UPLOAD][${requestId}] Chunk Insert Error:`, chunkError);
                await supabase.from("knowledge_documents").delete().eq("id", docData.id);
                return NextResponse.json(
                    { success: false, message: "Failed to insert chunks into database" },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, message: "Failed to generate embeddings for any chunks" },
                { status: 500 }
            );
        }

        console.log(`[UPLOAD][${requestId}] Success`);
        return NextResponse.json({
            success: true,
            documentId: docData.id,
            chunkCount: chunkRecords.length,
        });

    } catch (error: any) {
        console.error(`[UPLOAD][${requestId}] Fatal Error:`, error);
        return NextResponse.json(
            { success: false, message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
