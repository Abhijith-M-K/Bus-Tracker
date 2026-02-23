'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import {
    Plus, Users, Bus as BusIcon, Phone, MapPin, Loader2,
    Edit2, Trash2, X, Save, LogIn, UserPlus, LogOut,
    Mail, Lock, Building2, Map as MapIcon, Search, Check, ChevronDown, ChevronUp
} from 'lucide-react';

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-foreground/40 text-xs">Loading Map...</div>
});

export default function AdminDashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [activeTab, setActiveTab] = useState<'buses' | 'depos'>('buses');

    const [buses, setBuses] = useState<any[]>([]);
    const [depos, setDepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    // Auth Form State
    const [authForm, setAuthForm] = useState({
        depoName: '', email: '', phone: '', password: ''
    });

    // Bus Form State
    const [busForm, setBusForm] = useState({
        busId: '', busNumber: '', routeName: '', conductorName: '', mobileNo: '', stops: [] as string[]
    });

    // Depo Form State
    const [depoForm, setDepoForm] = useState({
        name: '', lat: 10.8505, lng: 76.2711
    });

    useEffect(() => {
        const savedAuth = localStorage.getItem('admin_authenticated');
        if (savedAuth === 'true') {
            setIsLoggedIn(true);
            refreshData();
        } else {
            setLoading(false);
        }
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [busRes, depoRes] = await Promise.all([
                fetch('/api/bus'),
                fetch('/api/depo')
            ]);
            const busData = await busRes.json();
            const depoData = await depoRes.json();
            if (busData.success) setBuses(busData.buses);
            if (depoData.success) setDepos(depoData.depos);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        const endpoint = authMode === 'login' ? '/api/admin/login' : '/api/admin/register';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authForm)
            });
            const data = await res.json();
            if (data.success) {
                if (authMode === 'login') {
                    localStorage.setItem('admin_authenticated', 'true');
                    setIsLoggedIn(true);
                    refreshData();
                } else {
                    setMessage('Registration successful! Please login.');
                    setAuthMode('login');
                }
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        localStorage.removeItem('admin_authenticated');
        setIsLoggedIn(false);
    };

    // DEPO Actions
    const handleDepoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const method = editingId ? 'PUT' : 'POST';
            const payload = editingId ? { ...depoForm, _id: editingId, location: { lat: depoForm.lat, lng: depoForm.lng } } : { name: depoForm.name, location: { lat: depoForm.lat, lng: depoForm.lng } };
            const res = await fetch('/api/depo', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Depo updated!' : 'Depo added!');
                setDepoForm({ name: '', lat: 10.8505, lng: 76.2711 });
                setEditingId(null);
                refreshData();
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const searchDepoLocation = async () => {
        if (!depoForm.name || submitting) return;
        setSubmitting(true);
        setMessage('Searching for location...');

        const queries = [
            `${depoForm.name}, Kerala, India`,
            `${depoForm.name} KSRTC, Kerala`,
            `${depoForm.name.split(' ')[0]} Bus Stand, Kerala`
        ];

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            for (let i = 0; i < queries.length; i++) {
                // Call our local proxy instead of outside directly
                const res = await fetch(`/api/depo/search?q=${encodeURIComponent(queries[i])}`);

                if (res.status === 429 || res.status === 425) {
                    setMessage(`Server busy. Retrying in 3s...`);
                    await sleep(3000);
                    i--; // Retry same query
                    continue;
                }

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                if (data && data.length > 0) {
                    setDepoForm({ ...depoForm, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                    setMessage(`Found: ${data[0].display_name}`);
                    return;
                }

                // If not found, wait a bit before trying the next query to respect Nominatim limits via proxy
                if (i < queries.length - 1) await sleep(1200);
            }
            setMessage('Location not found. Please click on map manually.');
        } catch (err: any) {
            console.error(err);
            setMessage(`Search error: ${err.message}. Please use map.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...busForm, _id: editingId } : busForm;
            const res = await fetch('/api/bus', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Bus updated!' : 'Bus added!');
                setBusForm({ busId: '', busNumber: '', routeName: '', conductorName: '', mobileNo: '', stops: [] });
                setEditingId(null);
                refreshData();
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass p-8 space-y-8">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                            {authMode === 'login' ? <LogIn className="w-8 h-8 text-primary" /> : <UserPlus className="w-8 h-8 text-primary" />}
                        </div>
                        <h1 className="text-3xl font-bold text-gradient">Admin {authMode === 'login' ? 'Login' : 'Register'}</h1>
                        <p className="text-foreground/50">{authMode === 'login' ? 'Welcome back, admin!' : 'Create an admin account'}</p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-4">
                        {authMode === 'register' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Depo Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input required value={authForm.depoName} onChange={e => setAuthForm({ ...authForm, depoName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input required value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground/40 uppercase">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input required type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground/40 uppercase">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input required type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                        </div>
                        {message && <p className={`text-sm p-3 rounded-lg ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message}</p>}
                        <button disabled={submitting} className="w-full bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Login' : 'Register')}
                        </button>
                    </form>
                    <div className="text-center">
                        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setMessage(''); }} className="text-primary hover:underline font-medium">
                            {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                        </button>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6">
                    <div className="space-y-1">
                        <Logo />
                        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                        <p className="text-foreground/60">System monitoring & resource management</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleLogout} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-red-400 flex items-center gap-2">
                            <LogOut className="w-5 h-5" /> <span className="hidden md:block">Logout</span>
                        </button>
                        <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="w-8 h-8" /></div>
                    </div>
                </header>

                {/* TABS */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
                    <button onClick={() => { setActiveTab('buses'); setEditingId(null); setMessage(''); }} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'buses' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-foreground/50'}`}>Buses</button>
                    <button onClick={() => { setActiveTab('depos'); setEditingId(null); setMessage(''); }} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'depos' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-foreground/50'}`}>Depos</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT PANEL - FORMS */}
                    <div className="lg:col-span-1">
                        <div className="glass p-6 space-y-6 sticky top-8">
                            {activeTab === 'buses' ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold flex items-center gap-2">{editingId ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />} {editingId ? 'Edit Bus' : 'Add New Bus'}</h2>
                                        {editingId && <button onClick={() => { setEditingId(null); setBusForm({ busId: '', busNumber: '', routeName: '', conductorName: '', mobileNo: '', stops: [] }); }} className="p-1 hover:bg-white/10 rounded-lg text-foreground/50"><X className="w-5 h-5" /></button>}
                                    </div>
                                    <form onSubmit={handleBusSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Bus ID</label>
                                            <input required value={busForm.busId} onChange={e => setBusForm({ ...busForm, busId: e.target.value })} placeholder="KA-01-1234" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Bus Number / Service Name</label>
                                            <input required value={busForm.busNumber} onChange={e => setBusForm({ ...busForm, busNumber: e.target.value })} placeholder="Route 242" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Route Name (Label)</label>
                                            <input required value={busForm.routeName} onChange={e => setBusForm({ ...busForm, routeName: e.target.value })} placeholder="Kozhikode-Palakkad" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Stops / Route Path</label>
                                            <div className="space-y-2">
                                                {busForm.stops.map((stopId, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm flex justify-between items-center">
                                                            <span>{depos.find(d => d._id === stopId)?.name}</span>
                                                            <button type="button" onClick={() => setBusForm({ ...busForm, stops: busForm.stops.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                                                        </div>
                                                        {idx > 0 && <button type="button" onClick={() => {
                                                            const newStops = [...busForm.stops];
                                                            [newStops[idx], newStops[idx - 1]] = [newStops[idx - 1], newStops[idx]];
                                                            setBusForm({ ...busForm, stops: newStops });
                                                        }} className="p-1 hover:bg-white/10 rounded"><ChevronUp className="w-4 h-4" /></button>}
                                                    </div>
                                                ))}
                                                <select
                                                    onChange={e => {
                                                        if (e.target.value && !busForm.stops.includes(e.target.value)) {
                                                            setBusForm({ ...busForm, stops: [...busForm.stops, e.target.value] });
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                    value=""
                                                >
                                                    <option value="" disabled className="bg-background">Add a stop...</option>
                                                    {depos.filter(d => !busForm.stops.includes(d._id)).map(d => (
                                                        <option key={d._id} value={d._id} className="bg-background">{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Conductor</label>
                                            <input required value={busForm.conductorName} onChange={e => setBusForm({ ...busForm, conductorName: e.target.value })} placeholder="John" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Mobile</label>
                                            <input required value={busForm.mobileNo} onChange={e => setBusForm({ ...busForm, mobileNo: e.target.value })} placeholder="9876543210" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        {message && <p className="text-sm p-3 bg-primary/10 text-primary rounded-lg">{message}</p>}
                                        <button disabled={submitting} className="w-full bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Update Bus" : "Register Bus"}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold flex items-center gap-2">{editingId ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />} {editingId ? 'Edit Depo' : 'Add New Depo'}</h2>
                                        {editingId && <button onClick={() => { setEditingId(null); setDepoForm({ name: '', lat: 10.8505, lng: 76.2711 }); }} className="p-1 hover:bg-white/10 rounded-lg text-foreground/50"><X className="w-5 h-5" /></button>}
                                    </div>
                                    <form onSubmit={handleDepoSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Depo Name</label>
                                            <div className="flex gap-2">
                                                <input required value={depoForm.name} onChange={e => setDepoForm({ ...depoForm, name: e.target.value })} placeholder="Malappuram" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" />
                                                <button type="button" onClick={searchDepoLocation} className="p-3 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary transition-colors"><Search className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase">Location (Coordinates)</label>
                                            <div className="flex gap-2">
                                                <input required type="number" step="any" value={depoForm.lat} onChange={e => setDepoForm({ ...depoForm, lat: parseFloat(e.target.value) })} placeholder="Lat" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs" />
                                                <input required type="number" step="any" value={depoForm.lng} onChange={e => setDepoForm({ ...depoForm, lng: parseFloat(e.target.value) })} placeholder="Lng" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs" />
                                            </div>
                                            <MapPicker lat={depoForm.lat} lng={depoForm.lng} onChange={(lat, lng) => setDepoForm({ ...depoForm, lat, lng })} />
                                            <p className="text-[10px] text-foreground/40 text-center mt-1">Click on map to manually adjust location</p>
                                        </div>
                                        {message && <p className="text-sm p-3 bg-primary/10 text-primary rounded-lg">{message}</p>}
                                        <button disabled={submitting} className="w-full bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Update Depo" : "Save Depo"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL - LISTS */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">{activeTab === 'buses' ? 'Registered Fleet' : 'Manage Depos'}</h2>
                            <button onClick={refreshData} className="text-xs text-primary hover:underline">Refresh</button>
                        </div>

                        {loading ? (
                            <div className="glass p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (activeTab === 'buses' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {buses.map(bus => (
                                        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={bus._id} className="glass p-5 border-l-4 border-accent relative group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-accent uppercase">ID: {bus.busId}</span>
                                                    <h3 className="text-lg font-bold mt-1 uppercase">{bus.busNumber}</h3>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {
                                                        setEditingId(bus._id);
                                                        setBusForm({
                                                            busId: bus.busId, busNumber: bus.busNumber,
                                                            routeName: bus.routeName, conductorName: bus.conductorName,
                                                            mobileNo: bus.mobileNo, stops: bus.stops?.map((s: any) => s._id) || []
                                                        });
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={async () => {
                                                        if (confirm('Delete?')) {
                                                            await fetch(`/ api / bus ? id = ${bus._id} `, { method: 'DELETE' });
                                                            refreshData();
                                                        }
                                                    }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-primary mt-2">{bus.routeName}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {bus.stops?.map((stop: any, i: number) => (
                                                    <span key={i} className="text-[10px] bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                                                        {i > 0 && <span className="text-foreground/30">→</span>} {stop.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-foreground/60">
                                                <div className="flex items-center gap-2"><Users className="w-3 h-3" /> {bus.conductorName}</div>
                                                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {bus.mobileNo}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {buses.length === 0 && <div className="col-span-2 glass p-12 text-center text-foreground/40">No buses found.</div>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {depos.map(depo => (
                                        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={depo._id} className="glass p-5 flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">{depo.name[0]}</div>
                                                <div>
                                                    <h3 className="font-bold">{depo.name}</h3>
                                                    <p className="text-[10px] text-foreground/40">Coords: {depo.location.lat.toFixed(4)}, {depo.location.lng.toFixed(4)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => {
                                                    setEditingId(depo._id);
                                                    setDepoForm({ name: depo.name, lat: depo.location.lat, lng: depo.location.lng });
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={async () => {
                                                    if (confirm('Delete Depo? This might affect routes.')) {
                                                        await fetch(`/ api / depo ? id = ${depo._id} `, { method: 'DELETE' });
                                                        refreshData();
                                                    }
                                                }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {depos.length === 0 && <div className="col-span-2 glass p-12 text-center text-foreground/40">No depos registered.</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
