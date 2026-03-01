'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Navigation, Power, AlertCircle, MapPin, Loader2, RefreshCcw, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';

export default function TrackPage({ params }: { params: Promise<{ busId: string }> }) {
    const { busId } = use(params);
    const router = useRouter();
    const [tracking, setTracking] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [bus, setBus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    const requestLock = useRef(false);
    const [direction, setDirection] = useState<'forward' | 'return'>('forward');
    const [storedName, setStoredName] = useState<string>('');
    const [storedPhone, setStoredPhone] = useState<string>('');

    useEffect(() => {
        setStoredName(localStorage.getItem('conductor_name') || '');
        setStoredPhone(localStorage.getItem('conductor_phone') || '');
    }, []);

    const checkBus = useCallback(async () => {
        try {
            const res = await fetch(`/api/bus/check/${busId}`);
            const data = await res.json();
            if (res.ok) {
                setBus(data.bus);
            } else {
                setError('Bus not registered. Returning to login...');
                setTimeout(() => router.push('/conductor'), 3000);
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    }, [busId, router]);

    useEffect(() => {
        checkBus();
    }, [checkBus]);

    const updateLocationOnServer = async (lat: number, lng: number, currentStatus: string) => {
        if (requestLock.current) return;
        requestLock.current = true;

        try {
            const endpoint = currentStatus === 'starting' ? '/api/journey/start' : '/api/journey/update';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    busId,
                    lat,
                    lng,
                    direction,
                    conductorName: bus?.conductorName || storedName,
                    conductorPhone: bus?.mobileNo || storedPhone
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');

            if (currentStatus === 'starting') setStatus('active');
            setError(null);
        } catch (err: any) {
            setError(err.message);
            if (currentStatus === 'starting') {
                setTracking(false);
                setStatus('idle');
            }
        } finally {
            requestLock.current = false;
        }
    };

    const stopJourneyOnServer = async () => {
        try {
            await fetch('/api/journey/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ busId }),
            });
        } catch (err) {
            console.error('Failed to stop journey:', err);
        }
    };

    useEffect(() => {
        let watchId: number;

        if (tracking) {
            if ('geolocation' in navigator) {
                if (status === 'idle') setStatus('starting');

                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocation({ lat: latitude, lng: longitude });
                        setError(null); // Clear any temporary errors
                        updateLocationOnServer(latitude, longitude, status === 'idle' ? 'starting' : status);
                    },
                    (err) => {
                        console.warn('Geolocation update failed:', err.code, err.message);
                        setError(`Signal weak: ${err.message}`);

                        // Only stop tracking if permission is denied
                        if (err.code === 1) { // PERMISSION_DENIED
                            setStatus('error');
                            setTracking(false);
                        }
                        // Otherwise (Code 2: POSITION_UNAVAILABLE, Code 3: TIMEOUT), 
                        // we keep tracking=true so it continues to try.
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000, // Increased timeout
                        maximumAge: 5000 // Allow 5-second old cache for stability
                    }
                );
            } else {
                setError('Geolocation is not supported by this browser.');
                setTracking(false);
            }
        } else {
            if (status === 'active' || status === 'starting') {
                stopJourneyOnServer();
                setStatus('idle');
            }
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [tracking, busId, status]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background p-6 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg space-y-6"
            >
                <div className="flex items-center justify-between glass p-4 px-6">
                    <div className="flex items-center gap-3">
                        <Logo iconSize={20} textSize="text-xl" />
                        <div className="w-px h-8 bg-white/10 mx-1" />
                        <div>
                            <h2 className="font-bold text-sm">Conductor Panel</h2>
                            <p className="text-[10px] text-foreground/40 font-mono">
                                {bus ? `${bus.busNumber} (${bus.busId})` : busId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/conductor')}
                        className="text-xs text-foreground/60 hover:text-foreground font-semibold"
                    >
                        Logout
                    </button>
                </div>

                <div className="glass p-8 text-center space-y-6">
                    {status === 'active' && (
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                                <div className="relative p-6 rounded-full bg-primary/10">
                                    <Navigation className="w-12 h-12 text-primary animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">
                            {status === 'active' ? 'Broadcasting Location' : status === 'starting' ? 'Initializing...' : 'Ready to Start'}
                        </h1>
                        <p className="text-foreground/50 text-sm max-w-xs mx-auto">
                            {`Hi ${bus?.conductorName || storedName || 'Staff'}, start your shift to broadcast location.`}
                        </p>
                    </div>

                    {location && (
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-foreground/40 uppercase font-semibold mb-1">Latitude</p>
                                <p className="font-mono text-lg">{location.lat.toFixed(6)}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-foreground/40 uppercase font-semibold mb-1">Longitude</p>
                                <p className="font-mono text-lg">{location.lng.toFixed(6)}</p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-left"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Direction Toggle */}
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 relative">
                        <button
                            type="button"
                            onClick={() => setDirection('forward')}
                            disabled={tracking}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all relative z-10 cursor-pointer ${direction === 'forward' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]' : 'text-foreground/40 hover:text-white hover:bg-white/5'} ${tracking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Forward Trip
                        </button>
                        <button
                            type="button"
                            onClick={() => setDirection('return')}
                            disabled={tracking}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all relative z-10 cursor-pointer ${direction === 'return' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]' : 'text-foreground/40 hover:text-white hover:bg-white/5'} ${tracking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Return Trip
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setError(null);
                            setTracking(!tracking);
                        }}
                        className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${tracking
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                            : 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90'
                            }`}
                    >
                        <Power className="w-6 h-6" />
                        {tracking ? 'Stop Journey' : 'Start Journey'}
                    </button>
                </div>

                {bus && (
                    <div className="glass p-5 border-l-4 border-l-primary flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-sm">{bus.routeName}</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                {bus.busNumber} • {bus.conductorName || storedName || 'Staff Not Assigned'} • {bus.mobileNo || 'N/A'}
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>
        </main>
    );
}
