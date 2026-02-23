'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Bus, Loader2, LogIn, AlertCircle,
    UserPlus, Mail, Lock, Phone, Building2, User
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function ConductorAuth() {
    const router = useRouter();
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [conductorName, setConductorName] = useState('');

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        depo: '',
        email: '',
        phone: '',
        password: '',
        busId: ''
    });

    useEffect(() => {
        const savedAuth = localStorage.getItem('conductor_authenticated');
        if (savedAuth === 'true') {
            setIsLoggedIn(true);
            setConductorName(localStorage.getItem('conductor_name') || '');
        }
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const endpoint = authMode === 'login' ? '/api/conductor/login' : '/api/conductor/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                if (authMode === 'login') {
                    localStorage.setItem('conductor_authenticated', 'true');
                    localStorage.setItem('conductor_name', data.conductor.name);
                    setConductorName(data.conductor.name);
                    setIsLoggedIn(true);
                    setMessage('Login successful!');
                } else {
                    setMessage('Registration successful! Please login.');
                    setAuthMode('login');
                }
            } else {
                setIsError(true);
                setMessage(data.error || 'Authentication failed');
            }
        } catch (err) {
            setIsError(true);
            setMessage('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.busId) return;
        setLoading(true);
        setMessage('');
        setIsError(false);
        try {
            const res = await fetch(`/api/bus/check/${formData.busId.trim()}`);
            const data = await res.json();
            if (res.ok) {
                router.push(`/conductor/track/${data.bus.busId}`);
            } else {
                setIsError(true);
                setMessage(data.error || 'Bus ID not registered.');
            }
        } catch (err) {
            setIsError(true);
            setMessage('Error starting shift.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('conductor_authenticated');
        localStorage.removeItem('conductor_name');
        setIsLoggedIn(false);
        setConductorName('');
        setMessage('Logged out successfully.');
        setIsError(false);
    };

    const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all";

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass p-8 space-y-8"
            >
                <div className="text-center space-y-2 flex flex-col items-center">
                    <Logo className="mb-2" />
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">
                        {isLoggedIn ? 'Start Your Shift' : `Conductor ${authMode === 'login' ? 'Login' : 'Registration'}`}
                    </h1>
                    <p className="text-sm text-foreground/50">
                        {isLoggedIn
                            ? `Welcome back, ${conductorName}`
                            : (authMode === 'login' ? 'Access your tracking dashboard' : 'Create your conductor account')}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!isLoggedIn ? (
                        <motion.div
                            key="auth-forms"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {/* MODE TOGGLE */}
                            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 sticky top-0 z-10 backdrop-blur-md">
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-foreground/60'}`}
                                >
                                    <LogIn className="w-4 h-4" /> Login
                                </button>
                                <button
                                    onClick={() => setAuthMode('register')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === 'register' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-foreground/60'}`}
                                >
                                    <UserPlus className="w-4 h-4" /> Register
                                </button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                <div className="space-y-4">
                                    {authMode === 'register' && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground/40 uppercase ml-1">Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} placeholder="John Doe" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground/40 uppercase ml-1">Depo</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                                    <input required value={formData.depo} onChange={e => setFormData({ ...formData, depo: e.target.value })} className={inputClasses} placeholder="Kozhikode" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground/40 uppercase ml-1">Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                                    <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} placeholder="9876543210" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground/40 uppercase ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} placeholder="conductor@example.com" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground/40 uppercase ml-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                            <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClasses} placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>

                                {message && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <p>{message}</p>
                                    </div>
                                )}

                                <button
                                    disabled={loading}
                                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{authMode === 'login' ? 'Login' : 'Register Account'}</span>}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="shift-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground/40 uppercase ml-1">Enter Bus Identification ID</label>
                                <form onSubmit={handleStartShift} className="relative">
                                    <Bus className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                    <input
                                        required
                                        autoFocus
                                        value={formData.busId}
                                        onChange={e => setFormData({ ...formData, busId: e.target.value })}
                                        className={inputClasses}
                                        placeholder="KA-01-1234"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="absolute right-2 top-1.5 bg-primary px-5 py-2 rounded-lg text-sm font-bold text-white hover:bg-primary/90 transition-all flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start'}
                                    </button>
                                </form>
                            </div>

                            {message && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <p>{message}</p>
                                </div>
                            )}

                            <div className="text-center pt-2">
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-foreground/40 hover:text-foreground/60 font-semibold underline underline-offset-4"
                                >
                                    Not your account? Logout
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </main>
    );
}
