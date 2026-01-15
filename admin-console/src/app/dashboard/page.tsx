'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Stats {
    channelCount: number;
    memoryCount: number;
    documentCount: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({ channelCount: 0, memoryCount: 0, documentCount: 0 });
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats
                const [channelsRes, memoryRes, docsRes, configRes] = await Promise.all([
                    supabase.from('allowed_channels').select('*', { count: 'exact' }),
                    supabase.from('conversation_memory').select('*', { count: 'exact' }),
                    supabase.from('knowledge_documents').select('*', { count: 'exact' }),
                    supabase.from('admin_config').select('system_instructions').single(),
                ]);

                setStats({
                    channelCount: channelsRes.count || 0,
                    memoryCount: memoryRes.count || 0,
                    documentCount: docsRes.count || 0,
                });

                if (configRes.data) {
                    setInstructions(configRes.data.system_instructions || '');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const statCards = [
        {
            title: 'Allowed Channels',
            value: stats.channelCount,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
            ),
            color: 'from-cyan-500 to-blue-500',
            href: '/dashboard/channels',
        },
        {
            title: 'Active Memories',
            value: stats.memoryCount,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            ),
            color: 'from-purple-500 to-pink-500',
            href: '/dashboard/memory',
        },
        {
            title: 'Knowledge Docs',
            value: stats.documentCount,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            color: 'from-green-500 to-emerald-500',
            href: '/dashboard/knowledge',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold mb-2">Welcome back 👋</h1>
                <p className="text-gray-400">Manage your Discord Copilot settings and monitor activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {statCards.map((card) => (
                    <Link key={card.title} href={card.href}>
                        <div className="stat-card cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                                    {card.icon}
                                </div>
                                <svg className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-4xl font-bold mb-1">{card.value}</p>
                            <p className="text-gray-400">{card.title}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick View: Current Instructions */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Current System Instructions</h2>
                    <Link href="/dashboard/instructions" className="btn-secondary text-sm py-2 px-4">
                        Edit
                    </Link>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-indigo-500/10">
                    <p className="text-gray-300 whitespace-pre-wrap line-clamp-4">
                        {instructions || 'No instructions set. Click Edit to configure your bot\'s behavior.'}
                    </p>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-8 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-400">Bot is active and listening</span>
            </div>
        </div>
    );
}
