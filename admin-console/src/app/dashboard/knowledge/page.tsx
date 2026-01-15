'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Document {
    id: string;
    filename: string;
    file_size: number;
    chunk_count: number;
    uploaded_at: string;
}

export default function KnowledgePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('knowledge_documents')
                .select('*')
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            showToast('error', 'Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            showToast('error', 'Only PDF files are supported');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            // Read file content
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');

            setUploadProgress(30);

            // Call our API to process the PDF
            const response = await fetch('/api/upload-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    fileSize: file.size,
                    content: base64,
                }),
            });

            setUploadProgress(70);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            setUploadProgress(100);
            fetchDocuments();
            showToast('success', 'Document uploaded and processed successfully!');
        } catch (error) {
            console.error('Error uploading document:', error);
            showToast('error', error instanceof Error ? error.message : 'Failed to upload document');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document? This will also remove all associated knowledge.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('knowledge_documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setDocuments(documents.filter((d) => d.id !== id));
            showToast('success', 'Document deleted');
        } catch (error) {
            console.error('Error deleting document:', error);
            showToast('error', 'Failed to delete document');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
                <p className="text-gray-400">
                    Upload PDF documents to give your bot domain-specific knowledge. The bot will search these documents when answering questions.
                </p>
            </div>

            {/* Info Card */}
            <div className="glass-card p-5 mb-6 border-l-4 border-green-500">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    How RAG Works
                </h3>
                <p className="text-sm text-gray-400">
                    When you upload a PDF, it&apos;s split into chunks and converted to embeddings. When users ask questions, the bot searches for relevant chunks and includes them in its context for more accurate answers.
                </p>
            </div>

            {/* Upload Section */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Upload Document</h2>

                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isUploading ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-600 hover:border-indigo-500/50'
                        }`}
                >
                    {isUploading ? (
                        <div>
                            <div className="spinner mx-auto mb-4"></div>
                            <p className="text-gray-300 mb-2">Processing document...</p>
                            <div className="w-full max-w-xs mx-auto bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-300 mb-2">Drag and drop a PDF file, or click to browse</p>
                            <p className="text-sm text-gray-500">Only PDF files are supported</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-primary mt-4"
                            >
                                Choose File
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Documents List */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Uploaded Documents</h2>
                    <span className="text-sm text-gray-500">{documents.length} document(s)</span>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No documents uploaded yet</p>
                        <p className="text-sm mt-1">Upload a PDF to build your knowledge base</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">{doc.filename}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(doc.file_size)} • {doc.chunk_count} chunks • {formatDate(doc.uploaded_at)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-2 hover:bg-red-500/10 rounded-lg"
                                    title="Delete document"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
