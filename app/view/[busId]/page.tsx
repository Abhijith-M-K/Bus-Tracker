'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Bus, MapPin, RefreshCcw, ArrowLeft, Clock, Navigation2, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center">Loading Map...</div>
});

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export default function ViewPage({ params }: { params: Promise<{ busId: string }> }) {
    const { busId } = use(params);
    const router = useRouter();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [busDetails, setBusDetails] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // User location state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [eta, setEta] = useState<number | null>(null); // in minutes

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

                // Update distance if user location is available
                if (userLocation && data.journey.currentLocation) {
                    const d = calculateDistance(
                        userLocation.lat, userLocation.lng,
                        data.journey.currentLocation.lat, data.journey.currentLocation.lng
                    );
                    setDistance(d);
                    // Estimate time: distance / speed (e.g. 30km/h) * 60 minutes
                    setEta(Math.round((d / 30) * 60));
                }
            } else {
                setError(data.error || 'Could not find active bus location');
            }
        } catch (err) {
            setError('Failed to connect to tracker');
        } finally {
            setLoading(false);
        }
    };

    const enableUserLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            });
        }
    };

    useEffect(() => {
        fetchLocation();
        const interval = setInterval(fetchLocation, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, [busId, userLocation]);

    return (
        <main className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="p-4 md:p-6 flex items-center justify-between glass m-4 mb-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg md:text-xl flex items-center gap-2">
                            <Bus className="w-5 h-5 text-primary" />
                            {busDetails ? busDetails.busNumber : busId}
                        </h1>
                        {busDetails && (
                            <p className="text-xs text-foreground/60 font-medium">{busDetails.routeName}</p>
                        )}
                        <AnimatePresence mode="wait">
                            {lastUpdated && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={lastUpdated.getTime()}
                                    className="text-xs text-foreground/40 flex items-center gap-1"
                                >
                                    <Clock className="w-3 h-3" />
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={enableUserLocation}
                        className={`p-3 rounded-xl transition-all ${userLocation ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}
                        title="Enable My Location"
                    >
                        <Navigation2 className={`w-5 h-5 ${userLocation ? '' : 'animate-pulse'}`} />
                    </button>
                    <button
                        onClick={() => { setLoading(true); fetchLocation(); }}
                        className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative m-4 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
                {/* Map Container */}
                <div className="flex-[2] glass overflow-hidden relative min-h-[40vh] md:min-h-0">
                    {location ? (
                        <Map center={[location.lat, location.lng]} />
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/5">
                            <div className="p-4 rounded-full bg-red-500/10 mb-4">
                                <MapPin className="w-12 h-12 text-red-500/50" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Location Not Found</h3>
                            <p className="text-foreground/50 max-w-xs">{error}</p>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    )}

                    {/* Distance Badge */}
                    {distance !== null && (
                        <div className="absolute top-4 right-4 z-[1000] glass px-4 py-2 flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">{distance.toFixed(2)} km away</span>
                        </div>
                    )}
                </div>

                {/* Info Sidebar */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div className="glass p-6 space-y-4">
                        <h3 className="font-bold text-foreground/60 uppercase text-xs tracking-wider">Bus & Conductor</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Bus className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/40 font-medium">Conductor Details</p>
                                    <p className="font-medium text-sm md:text-base">
                                        {busDetails ? `${busDetails.conductorName} (${busDetails.mobileNo})` : 'Conductor details unavailable'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-accent/10">
                                    <MapPin className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/40 font-medium">Current Location</p>
                                    <p className="font-medium text-sm md:text-base leading-tight">
                                        {address || (location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E` : 'Searching...')}
                                    </p>
                                </div>
                            </div>

                            {distance !== null && (
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-foreground/50">Distance</span>
                                        <span className="font-bold text-lg text-primary">{distance.toFixed(1)} KM</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-foreground/50">Estimated Arrival</span>
                                        <span className="font-bold text-lg text-accent">{eta} MINS</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-xs text-foreground/40 mb-2">Tracking Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${location ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-sm font-semibold">{location ? 'Live Signal' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!userLocation && (
                        <button
                            onClick={enableUserLocation}
                            className="glass p-4 text-center text-sm font-bold text-accent hover:bg-accent/10 transition-all flex items-center justify-center gap-2"
                        >
                            <Navigation2 className="w-4 h-4" />
                            Enable My Location for Distance & ETA
                        </button>
                    )}

                    <div className="glass p-6 hidden md:block">
                        <h3 className="font-bold text-foreground/60 uppercase text-xs tracking-wider mb-4">About this Data</h3>
                        <p className="text-xs text-foreground/40 leading-relaxed">
                            Address is detected using reverse geocoding. Distance is calculated as-the-crow-flies between you and the bus. ETA is an estimate based on average bus speed.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
