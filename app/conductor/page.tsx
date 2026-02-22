'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Bus, Loader2, LogIn, AlertCircle } from 'lucide-react';

export default function ConductorLogin() {
    const [busId, setBusId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Verify if the bus is registered in the Admin Dashboard
            const res = await fetch(`/api/bus/check/${busId.trim()}`);
            const data = await res.json();

            if (res.ok) {
                // Bus is found, proceed to tracking
                router.push(`/track/${data.bus.busId}`);
            } else {
                setError(data.error || 'Bus ID not registered. Contact your administrator.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass p-8 space-y-8"
            >
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-2xl bg-accent/10 mb-2">
                        <ShieldCheck className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Conductor Login</h1>
                    <p className="text-foreground/50">Enter Bus ID to start tracking</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Bus Identification ID</label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                value={busId}
                                onChange={(e) => setBusId(e.target.value)}
                                placeholder="KA-01-1234"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono"
                            />
                            <Bus className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                        Start My Shift
                    </button>

                    <p className="text-center text-xs text-foreground/30">
                        Forgot ID? Contact your administrator.
                    </p>
                </form>
            </motion.div>
        </main>
    );
}
