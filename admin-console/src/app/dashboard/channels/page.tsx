'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Channel {
    id: string;
    channel_id: string;
    channel_name: string | null;
    created_at: string;
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [newChannelId, setNewChannelId] = useState('');
    const [newChannelName, setNewChannelName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const { data, error } = await supabase
                .from('allowed_channels')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setChannels(data || []);
        } catch (error) {
            console.error('Error fetching channels:', error);
            showToast('error', 'Failed to load channels');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChannelId.trim()) return;

        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('allowed_channels')
                .insert({
                    channel_id: newChannelId.trim(),
                    channel_name: newChannelName.trim() || null,
                });

            if (error) {
                if (error.code === '23505') {
                    showToast('error', 'This channel ID already exists');
                } else {
                    throw error;
                }
                return;
            }

            setNewChannelId('');
            setNewChannelName('');
            fetchChannels();
            showToast('success', 'Channel added successfully!');
        } catch (error) {
            console.error('Error adding channel:', error);
            showToast('error', 'Failed to add channel');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteChannel = async (id: string) => {
        try {
            const { error } = await supabase
                .from('allowed_channels')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setChannels(channels.filter((c) => c.id !== id));
            showToast('success', 'Channel removed');
        } catch (error) {
            console.error('Error deleting channel:', error);
            showToast('error', 'Failed to remove channel');
        }
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
                <h1 className="text-3xl font-bold mb-2">Allowed Channels</h1>
                <p className="text-gray-400">
                    Specify which Discord channels the bot is permitted to respond in. The bot will only reply in these channels.
                </p>
            </div>

            {/* How to get Channel ID */}
            <div className="glass-card p-5 mb-6 border-l-4 border-cyan-500">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How to get a Channel ID
                </h3>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)</li>
                    <li>Right-click on any channel</li>
                    <li>Click &quot;Copy Channel ID&quot;</li>
                </ol>
            </div>

            {/* Add New Channel */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Add New Channel</h2>
                <form onSubmit={handleAddChannel} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newChannelId}
                            onChange={(e) => setNewChannelId(e.target.value)}
                            className="input-field"
                            placeholder="Channel ID (e.g., 123456789012345678)"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            className="input-field"
                            placeholder="Channel Name (optional, for your reference)"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Channel
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Channel List */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Active Channels</h2>
                    <span className="text-sm text-gray-500">{channels.length} channel(s)</span>
                </div>

                {channels.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <p>No channels configured yet</p>
                        <p className="text-sm mt-1">Add a channel above to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {channels.map((channel) => (
                            <div
                                key={channel.id}
                                className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {channel.channel_name || 'Unnamed Channel'}
                                        </p>
                                        <p className="text-sm text-gray-500 font-mono">{channel.channel_id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteChannel(channel.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-2 hover:bg-red-500/10 rounded-lg"
                                    title="Remove channel"
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
