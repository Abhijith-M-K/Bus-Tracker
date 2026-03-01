'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, LogOut, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountTab() {
    const router = useRouter();
    const [passenger, setPassenger] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load safely from local storage for now until we build a profile fetch route
        const data = localStorage.getItem('passengerData');
        if (data) {
            setPassenger(JSON.parse(data));
        }
        setLoading(false);
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/passenger/logout', { method: 'POST' });
            if (res.ok) {
                localStorage.removeItem('passengerData');
                toast.success('Logged out successfully');
                router.push('/passenger/login');
            } else {
                toast.error('Failed to logout');
            }
        } catch (err) {
            toast.error('An error occurred during logout');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md pt-8 mx-auto"
        >
            <div className="glass p-8 space-y-8 rounded-2xl relative overflow-hidden">
                {/* Background Decorative Element */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-transparent -z-10" />

                <div className="flex flex-col items-center text-center space-y-4 pt-4">
                    <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                        <User className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{passenger?.name || 'Passenger'}</h1>
                        <p className="text-foreground/60 text-sm">Account Details</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</span>
                        <span className="text-sm font-medium">{passenger?.email || 'N/A'}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone Number</span>
                        <span className="text-sm font-medium">{passenger?.phone || 'N/A'}</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-4 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Logout Safely
                </button>
            </div>
        </motion.div>
    );
}
