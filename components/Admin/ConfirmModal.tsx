'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    loading = false
}: ConfirmModalProps) {
    const themes = {
        danger: {
            icon: XCircle,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
        },
        info: {
            icon: CheckCircle2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            btn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
        }
    };

    const theme = themes[type];
    const Icon = theme.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md glass p-6 sm:p-8 overflow-hidden"
                    >
                        {/* Static accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.bg.replace('/10', '')}`} />

                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`w-16 h-16 ${theme.bg} rounded-2xl flex items-center justify-center mb-2`}>
                                <Icon className={`w-8 h-8 ${theme.color}`} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gradient">{title}</h3>
                                <p className="text-foreground/60 leading-relaxed">{message}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-semibold transition-all border border-white/5"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`flex-1 px-6 py-3 rounded-xl ${theme.btn} text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2`}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
