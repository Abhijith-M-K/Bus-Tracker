'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Loader2, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PassengerRegister() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/passenger/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Registration successful!');
                router.push('/passenger/login');
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (err) {
            toast.error('An error occurred during registration');
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
                    <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                    <p className="text-foreground/60">Register as a passenger</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80 ml-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="John Doe"
                            />
                            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
                        </div>
                    </div>

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
                            Phone Number
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="+1 234 567 890"
                            />
                            <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
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
                                minLength={6}
                            />
                            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 mt-6"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center text-sm text-foreground/60">
                    Already have an account?{' '}
                    <Link href="/passenger/login" className="text-primary hover:underline font-medium">
                        Login here
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
