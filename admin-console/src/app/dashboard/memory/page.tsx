'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Memory {
    id: string;
    channel_id: string;
    summary: string;
    message_count: number;
    last_updated: string;
}

export default function MemoryPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResetting, setIsResetting] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const { data, error } = await supabase
                .from('conversation_memory')
                .select('*')
                .order('last_updated', { ascending: false });

            if (error) throw error;
            setMemories(data || []);
        } catch (error) {
            console.error('Error fetching memories:', error);
            showToast('error', 'Failed to load memories');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleResetMemory = async (id: string) => {
        setIsResetting(id);
        try {
            const { error } = await supabase
                .from('conversation_memory')
                .update({
                    summary: '',
                    message_count: 0,
                    last_updated: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            fetchMemories();
            showToast('success', 'Memory reset successfully!');
        } catch (error) {
            console.error('Error resetting memory:', error);
            showToast('error', 'Failed to reset memory');
        } finally {
            setIsResetting(null);
        }
    };

    const handleResetAll = async () => {
        if (!confirm('Are you sure you want to reset ALL conversation memories? This cannot be undone.')) {
            return;
        }

        setIsResetting('all');
        try {
            const { error } = await supabase
                .from('conversation_memory')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) throw error;
            setMemories([]);
            showToast('success', 'All memories reset successfully!');
        } catch (error) {
            console.error('Error resetting all memories:', error);
            showToast('error', 'Failed to reset memories');
        } finally {
            setIsResetting(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
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
                <h1 className="text-3xl font-bold mb-2">Memory Control</h1>
                <p className="text-gray-400">
                    View and manage the bot&apos;s conversation summaries. These summaries help the bot maintain context across messages.
                </p>
            </div>

            {/* Info Card */}
            <div className="glass-card p-5 mb-6 border-l-4 border-purple-500">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    How Memory Works
                </h3>
                <p className="text-sm text-gray-400">
                    The bot maintains a rolling summary of conversations in each channel. This helps it understand context without storing every message. Resetting memory will make the bot &quot;forget&quot; previous conversations.
                </p>
            </div>

            {/* Actions */}
            {memories.length > 0 && (
                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleResetAll}
                        className="btn-danger flex items-center gap-2"
                        disabled={isResetting === 'all'}
                    >
                        {isResetting === 'all' ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Reset All Memories
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Memory List */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Channel Memories</h2>
                    <span className="text-sm text-gray-500">{memories.length} active session(s)</span>
                </div>

                {memories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        <p>No active conversation memories</p>
                        <p className="text-sm mt-1">Memories are created when the bot responds in channels</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {memories.map((memory) => (
                            <div
                                key={memory.id}
                                className="p-5 bg-black/20 rounded-lg border border-indigo-500/10"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm">{memory.channel_id}</p>
                                            <p className="text-xs text-gray-500">
                                                {memory.message_count} messages • Updated {formatDate(memory.last_updated)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleResetMemory(memory.id)}
                                        className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                                        disabled={isResetting === memory.id}
                                    >
                                        {isResetting === memory.id ? (
                                            <div className="spinner w-4 h-4"></div>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Reset
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Summary */}
                                <div className="bg-black/30 rounded-lg p-4 mt-3">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                        {memory.summary || 'No summary yet - conversations will be summarized as they happen.'}
                                    </p>
                                </div>
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
