'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';
import toast from 'react-hot-toast';

function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const searchParams = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/passenger/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Welcome back!');
                // Save user data to localStorage if needed for UI, similar to how admin/conductor do
                localStorage.setItem('passengerData', JSON.stringify(data.passenger));

                const nextUrl = searchParams.get('next');
                router.push(nextUrl || '/');
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (err) {
            toast.error('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass p-8 space-y-8"
            >
                <div className="flex flex-col items-center text-center space-y-2">
                    <Logo iconSize={32} textSize="text-4xl" className="mb-2" />
                    <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
                    <p className="text-foreground/60">Login to your passenger account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="john@example.com"
                                />
                                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Login
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center text-sm text-foreground/60">
                    Don't have an account?{' '}
                    <Link href="/passenger/register" className="text-primary hover:underline font-medium">
                        Register here
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}

export default function PassengerLogin() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
