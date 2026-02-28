'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Bus, MapPin, RefreshCcw, ArrowLeft, Clock, Navigation2, Ruler, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';

// Dynamically import map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center">Loading Map...</div>
});

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

const RouteTimeline = ({ stops, busLocation }: { stops: any[], busLocation: { lat: number, lng: number } | null }) => {
    if (!stops || stops.length === 0) return null;

    let closestIndex = -1;
    if (busLocation) {
        let minDistance = Infinity;
        stops.forEach((stop, index) => {
            const d = calculateDistance(busLocation.lat, busLocation.lng, stop.location.lat, stop.location.lng);
            if (d < minDistance) {
                minDistance = d;
                closestIndex = index;
            }
        });
    }

    return (
        <div className="glass p-6 space-y-6">
            <h3 className="font-bold text-foreground/60 uppercase text-xs tracking-wider">Route Progress</h3>
            <div className="relative space-y-8">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10" />
                {stops.map((stop, index) => {
                    const isPassed = closestIndex > index;
                    const isCurrent = closestIndex === index;
                    return (
                        <div key={stop._id} className="relative flex items-start gap-4 pl-8">
                            <div className="absolute left-0 top-1 z-10">
                                {isPassed ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500 bg-background rounded-full" />
                                ) : isCurrent ? (
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                        <Navigation2 className="w-6 h-6 text-primary bg-background rounded-full rotate-45" />
                                    </div>
                                ) : (
                                    <Circle className="w-6 h-6 text-foreground/20 bg-background rounded-full" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isCurrent ? 'text-primary' : isPassed ? 'text-foreground/60' : 'text-foreground/40'}`}>
                                    {stop.name}
                                </span>
                                {isCurrent && (
                                    <span className="text-[10px] text-primary/60 font-medium uppercase tracking-tighter">Current Stop / Nearby</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ViewBus({ params }: { params: Promise<{ busId: string }> }) {
    const { busId } = use(params);
    const router = useRouter();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [busDetails, setBusDetails] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [eta, setEta] = useState<number | null>(null);

    const fetchLocation = async () => {
        try {
            const res = await fetch(`/api/journey/location/${busId}`);
            const data = await res.json();
            if (res.ok) {
                setLocation(data.journey.currentLocation);
                setAddress(data.address);
                setBusDetails(data.busDetails);
                setLastUpdated(new Date(data.journey.lastUpdated));
                setError(null);
                if (userLocation && data.journey.currentLocation) {
                    const d = calculateDistance(userLocation.lat, userLocation.lng, data.journey.currentLocation.lat, data.journey.currentLocation.lng);
                    setDistance(d);
                    setEta(Math.round((d / 30) * 60));
                }
            } else {
                setError(data.error || 'No active signal found');
                setLocation(null);
                setDistance(null);
                setEta(null);
            }
        } catch (err) {
            setError('Connection lost');
        } finally {
            setLoading(false);
        }
    };

    const enableUserLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            });
        }
    };

    useEffect(() => {
        fetchLocation();
        const interval = setInterval(fetchLocation, 10000);
        return () => clearInterval(interval);
    }, [busId, userLocation]);

    return (
        <main className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
            <header className="p-4 md:p-6 flex items-center justify-between glass m-4 mb-2 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <Logo iconSize={20} textSize="text-xl" />
                        <h1 className="font-bold text-lg md:text-xl flex items-center gap-2 mt-0.5">
                            {busDetails ? busDetails.busNumber : busId}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={enableUserLocation} className={`p-2.5 rounded-xl transition-all ${userLocation ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-foreground/50 hover:bg-white/10'}`}>
                        <Navigation2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setLoading(true); fetchLocation(); }} className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="flex-1 relative m-4 mt-0 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
                <div className="flex-[2] glass overflow-hidden relative min-h-[40vh] md:min-h-0">
                    {location ? <Map center={[location.lat, location.lng]} stops={busDetails?.stops} /> :
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/5">
                            <MapPin className="w-12 h-12 text-foreground/10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Signal Lost</h3>
                            <p className="text-foreground/40 max-w-xs">{error || 'Waiting for bus location...'}</p>
                        </div>}
                    {distance !== null && (
                        <div className="absolute top-4 right-4 z-[1000] glass px-4 py-2 flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm tracking-tight">{distance.toFixed(1)} KM</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4">
                    <div className="glass p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-foreground/60 uppercase text-[10px] tracking-widest">Bus Details</h3>
                            {lastUpdated && <span className="text-[10px] text-foreground/30 font-mono">LIVE: {lastUpdated.toLocaleTimeString()}</span>}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-lg font-bold text-primary">{busDetails?.routeName || 'Direct Route'}</h4>
                                <p className="text-sm text-foreground/50">{busDetails?.conductorName} • {busDetails?.mobileNo}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-accent mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-foreground/30 uppercase">Last Seen At</p>
                                    <p className="text-sm font-medium leading-tight mt-0.5">{address || 'Kozhikode District, Kerala'}</p>
                                </div>
                            </div>
                            {distance !== null && eta !== null && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                                        <p className="text-[10px] font-bold text-primary/60 uppercase mb-1">Distance</p>
                                        <p className="text-xl font-black">{distance.toFixed(1)} <span className="text-sm">KM</span></p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-center">
                                        <p className="text-[10px] font-bold text-accent/60 uppercase mb-1">Arrival</p>
                                        <p className="text-xl font-black">{eta} <span className="text-sm">MIN</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {busDetails?.stops && busDetails.stops.length > 0 && <RouteTimeline stops={busDetails.stops} busLocation={location} />}
                </div>
            </div>
        </main>
    );
}
