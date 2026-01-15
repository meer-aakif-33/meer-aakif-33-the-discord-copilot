'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function InstructionsPage() {
    const [instructions, setInstructions] = useState('');
    const [originalInstructions, setOriginalInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const fetchInstructions = async () => {
            try {
                const { data, error } = await supabase
                    .from('admin_config')
                    .select('system_instructions')
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (data) {
                    setInstructions(data.system_instructions || '');
                    setOriginalInstructions(data.system_instructions || '');
                }
            } catch (error) {
                console.error('Error fetching instructions:', error);
                showToast('error', 'Failed to load instructions');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInstructions();
    }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Check if config exists
            const { data: existing } = await supabase
                .from('admin_config')
                .select('id')
                .single();

            if (existing) {
                // Update existing
                const { error } = await supabase
                    .from('admin_config')
                    .update({
                        system_instructions: instructions,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('admin_config')
                    .insert({ system_instructions: instructions });

                if (error) throw error;
            }

            setOriginalInstructions(instructions);
            showToast('success', 'Instructions saved successfully!');
        } catch (error) {
            console.error('Error saving instructions:', error);
            showToast('error', 'Failed to save instructions');
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = instructions !== originalInstructions;

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
                <h1 className="text-3xl font-bold mb-2">System Instructions</h1>
                <p className="text-gray-400">
                    Define your bot&apos;s personality, tone, behavior, and rules. These instructions shape how the bot responds to users.
                </p>
            </div>

            {/* Tips Card */}
            <div className="glass-card p-5 mb-6 border-l-4 border-indigo-500">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tips for effective instructions
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Define the bot&apos;s role and expertise</li>
                    <li>• Specify the tone (friendly, professional, casual)</li>
                    <li>• Set boundaries for topics it should avoid</li>
                    <li>• Include example responses if needed</li>
                </ul>
            </div>

            {/* Editor */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-lg font-medium">Bot Instructions</label>
                    <span className="text-sm text-gray-500">
                        {instructions.length} characters
                    </span>
                </div>

                <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="textarea-field min-h-[350px]"
                    placeholder="You are a helpful assistant for our team. Be friendly, concise, and accurate in your responses.

Your role is to:
- Answer questions about our products and services
- Help with technical troubleshooting
- Provide information about company policies

Always maintain a professional yet approachable tone. If you're unsure about something, say so rather than making up information."
                />

                {/* Actions */}
                <div className="flex items-center justify-between mt-6">
                    <div>
                        {hasChanges && (
                            <span className="text-yellow-400 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Unsaved changes
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setInstructions(originalInstructions)}
                            className="btn-secondary"
                            disabled={!hasChanges}
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-2"
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="spinner"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
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
