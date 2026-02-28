'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import {
    Plus, Users, Bus as BusIcon, Phone, MapPin, Loader2,
    Edit2, Trash2, X, Save, LogIn, UserPlus, LogOut,
    Mail, Lock, Building2, Map as MapIcon, Search, Check, ChevronDown, ChevronUp,
    LayoutDashboard, Menu
} from 'lucide-react';
import Sidebar from '@/components/Admin/Sidebar';
import StatCard from '@/components/Admin/StatCard';
import ConfirmModal from '@/components/Admin/ConfirmModal';

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-foreground/40 text-xs">Loading Map...</div>
});

export default function AdminDashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'bus-list' | 'bus-add' | 'route-list' | 'route-add' | 'depo-list' | 'depo-add' | 'conductors' | 'allocation-add' | 'allocation-list'>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [admin, setAdmin] = useState<any>(null);

    const [buses, setBuses] = useState<any[]>([]);
    const [depos, setDepos] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [conductors, setConductors] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [stats, setStats] = useState({ buses: 0, depos: 0, conductors: 0, routes: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Auth Form State
    const [authForm, setAuthForm] = useState({
        depoName: '', email: '', phone: '', password: ''
    });

    // Route Form State
    const [routeForm, setRouteForm] = useState({
        name: '', lat: 10.8505, lng: 76.2711, address: ''
    });

    // Bus Form State
    const [busForm, setBusForm] = useState({
        busId: '', busNumber: '', routeName: '', depo: '', route: [] as string[]
    });
    const [routeSearch, setRouteSearch] = useState('');
    const [showRouteDropdown, setShowRouteDropdown] = useState(false);

    // Depo Form State
    const [depoForm, setDepoForm] = useState({
        name: '', lat: 10.8505, lng: 76.2711, address: ''
    });

    // Conductor Form State
    const [conductorForm, setConductorForm] = useState({
        name: '', depo: '', email: '', phone: '', password: '', conductorId: ''
    });

    // Allocation Form State
    const [allocationForm, setAllocationForm] = useState({
        busId: '', conductorId: '', date: new Date().toISOString().split('T')[0]
    });
    const [busSearch, setBusSearch] = useState('');
    const [conductorSearch, setConductorSearch] = useState('');
    const [showBusDropdown, setShowBusDropdown] = useState(false);
    const [showConductorDropdown, setShowConductorDropdown] = useState(false);
    const [listSearchQuery, setListSearchQuery] = useState('');
    const [allocationDateFilter, setAllocationDateFilter] = useState('');

    useEffect(() => {
        const fetchDeposForReg = async () => {
            try {
                const res = await fetch('/api/depo');
                const data = await res.json();
                if (data.success) setDepos(data.depos);
            } catch (err) {
                console.error('Failed to fetch depos for registration:', err);
            }
        };
        fetchDeposForReg();

        const savedAuth = localStorage.getItem('admin_authenticated');
        const savedAdmin = localStorage.getItem('admin_data');
        if (savedAuth === 'true' && savedAdmin) {
            setIsLoggedIn(true);
            setAdmin(JSON.parse(savedAdmin));
            // We'll call refreshData inside another useEffect that watches 'admin'
        } else {
            setLoading(false);
        }
    }, [authMode]); // Re-fetch on authMode change just in case

    useEffect(() => {
        if (isLoggedIn && admin) {
            refreshData();
        }
    }, [isLoggedIn, admin]);

    useEffect(() => {
        setListSearchQuery('');
    }, [activeTab]);

    const refreshData = async () => {
        if (!admin?.depoName) return;
        setLoading(true);
        try {
            const [busRes, depoRes, routeRes, condRes, statsRes, allocRes] = await Promise.all([
                fetch(`/api/bus?depo=${encodeURIComponent(admin.depoName)}`),
                fetch('/api/depo'),
                fetch(`/api/route?depo=${encodeURIComponent(admin.depoName)}`),
                fetch(`/api/conductor?depo=${encodeURIComponent(admin.depoName)}`),
                fetch(`/api/admin/stats?depo=${encodeURIComponent(admin.depoName)}`),
                fetch('/api/allocation')
            ]);
            const busData = await busRes.json();
            const depoData = await depoRes.json();
            const routeData = await routeRes.json();
            const condData = await condRes.json();
            const statsData = await statsRes.json();
            const allocData = await allocRes.json();

            if (busData.success) setBuses(busData.buses);
            if (depoData.success) setDepos(depoData.depos);
            if (routeData.success) setRoutes(routeData.routes);
            if (condData.success) setConductors(condData.conductors);
            if (statsData.success) setStats(statsData.stats);
            if (allocData.success) setAllocations(allocData.allocations);
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
                    localStorage.setItem('admin_data', JSON.stringify(data.admin));
                    setAdmin(data.admin);
                    setIsLoggedIn(true);
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
        localStorage.removeItem('admin_data');
        setAdmin(null);
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
                setDepoForm({ name: '', lat: 10.8505, lng: 76.2711, address: '' });
                setEditingId(null);
                refreshData();
                setActiveTab('depo-list');
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
                    setDepoForm({
                        ...depoForm,
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon),
                        address: data[0].display_name
                    });
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

    const searchRouteLocation = async () => {
        if (!routeForm.name || submitting) return;
        setSubmitting(true);
        setMessage('Searching for route location...');

        const queries = [
            `${routeForm.name}, Kerala, India`,
            `${routeForm.name} Bus Stand, Kerala`,
            `${routeForm.name.split(' ')[0]} Kerala`
        ];

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            for (let i = 0; i < queries.length; i++) {
                const res = await fetch(`/api/depo/search?q=${encodeURIComponent(queries[i])}`);

                if (res.status === 429 || res.status === 425) {
                    await sleep(3000);
                    i--;
                    continue;
                }

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                if (data && data.length > 0) {
                    setRouteForm({
                        ...routeForm,
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon),
                        address: data[0].display_name
                    });
                    setMessage(`Found: ${data[0].display_name}`);
                    return;
                }

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
                setBusForm({ busId: '', busNumber: '', routeName: '', depo: '', route: [] });
                setRouteSearch('');
                setShowRouteDropdown(false);
                setEditingId(null);
                refreshData();
                setActiveTab('bus-list');
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRouteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const method = editingId ? 'PUT' : 'POST';
            const payload = {
                name: routeForm.name,
                depoName: admin.depoName,
                location: { lat: routeForm.lat, lng: routeForm.lng },
                ...(editingId ? { _id: editingId } : {})
            };
            const res = await fetch('/api/route', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Route updated!' : 'Route added!');
                setRouteForm({ name: '', lat: 10.8505, lng: 76.2711, address: '' });
                setEditingId(null);
                refreshData();
                setActiveTab('route-list');
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAllocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const res = await fetch('/api/allocation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allocationForm)
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Allocation successful!');
                setAllocationForm({
                    busId: '', conductorId: '', date: new Date().toISOString().split('T')[0]
                });
                setBusSearch('');
                setConductorSearch('');
                refreshData();
                setActiveTab('allocation-list');
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConductorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const method = editingId ? 'PUT' : 'POST';
            const endpoint = editingId ? '/api/conductor' : '/api/conductor/register';
            const body = editingId ? { ...conductorForm, _id: editingId } : conductorForm;
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Conductor updated!' : 'Conductor added!');
                setConductorForm({ name: '', depo: '', email: '', phone: '', password: '', conductorId: '' });
                setEditingId(null);
                refreshData();
            } else setMessage(data.error);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };
    const handleConfirmDelete = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
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
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 z-10" />
                                        <select
                                            required
                                            value={authForm.depoName}
                                            onChange={e => setAuthForm({ ...authForm, depoName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-foreground"
                                        >
                                            <option value="" disabled className="bg-background">Select Depo</option>
                                            {depos.map(d => (
                                                <option key={d._id} value={d.name} className="bg-background">{d.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
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
        <main className="h-screen bg-background flex overflow-hidden">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="flex-shrink-0 bg-background/80 backdrop-blur-xl p-4 lg:p-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                            <p className="text-xs text-foreground/40 hidden md:block">System monitoring & resource management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={refreshData} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-primary transition-all">
                            <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`p-2.5 rounded-xl transition-all ${isProfileOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                            >
                                <Users className="w-6 h-6" />
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                                        <div className="px-4 py-3 border-b border-white/5 mb-1 bg-white/[0.02]">
                                            <p className="text-sm font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
                                            <p className="text-xs text-foreground/40 mt-0.5 truncate">{admin?.email || 'admin@yathra.com'}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors flex items-center gap-3"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Registered Buses" value={stats.buses} icon={BusIcon} color="#3b82f6" trend="Active Fleet" />
                                <StatCard title="Active Routes" value={stats.routes} icon={MapIcon} color="#f59e0b" trend="Service Lines" />
                                <StatCard title="Active Depos" value={stats.depos} icon={MapPin} color="#8b5cf6" trend="Regional Hubs" />
                                <StatCard title="Conductors" value={stats.conductors} icon={Users} color="#10b981" trend="Staff Members" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="glass p-6">
                                    <h3 className="text-lg font-bold mb-4">Quick Overview</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                            <span className="text-foreground/60">System Status</span>
                                            <span className="flex items-center gap-2 text-green-400 font-medium">
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                Online
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                            <span className="text-foreground/60">Last Update</span>
                                            <span className="text-foreground/40">{new Date().toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bus-add' && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{editingId ? 'Edit Bus' : 'Register New Bus'}</h2>
                                <button onClick={() => setActiveTab('bus-list')} className="text-sm text-primary hover:underline">View All Buses</button>
                            </div>
                            <div className="glass p-8">
                                <form onSubmit={handleBusSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Bus ID</label>
                                            <input required value={busForm.busId} onChange={e => setBusForm({ ...busForm, busId: e.target.value })} placeholder="KA-01-1234" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Bus Number</label>
                                            <input required value={busForm.busNumber} onChange={e => setBusForm({ ...busForm, busNumber: e.target.value })} placeholder="KSRTC-123" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Service Route Name (e.g. Kozhikode - Palakkad)</label>
                                        <input required value={busForm.routeName} onChange={e => setBusForm({ ...busForm, routeName: e.target.value })} placeholder="Kozhikode - Palakkad" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div className="space-y-3 relative">
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Base Routes (Select Locations)</label>

                                        {/* Selected Routes Tags */}
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {busForm.route.map(id => {
                                                const route = routes.find(r => r._id === id);
                                                return (
                                                    <div key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg text-xs font-medium text-primary">
                                                        {route?.name || 'Unknown'}
                                                        <button
                                                            type="button"
                                                            onClick={() => setBusForm({ ...busForm, route: busForm.route.filter(rid => rid !== id) })}
                                                            className="hover:text-white transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            {busForm.route.length === 0 && (
                                                <p className="text-xs text-foreground/30 italic">No routes selected</p>
                                            )}
                                        </div>

                                        {/* Searchable Dropdown */}
                                        <div className="relative">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                                <input
                                                    type="text"
                                                    placeholder="Search and select routes..."
                                                    value={routeSearch}
                                                    onFocus={() => setShowRouteDropdown(true)}
                                                    onChange={e => {
                                                        setRouteSearch(e.target.value);
                                                        setShowRouteDropdown(true);
                                                    }}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                />
                                            </div>

                                            <AnimatePresence>
                                                {showRouteDropdown && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setShowRouteDropdown(false)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-full mt-2 left-0 right-0 z-40 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto custom-scrollbar ring-1 ring-white/5"
                                                        >
                                                            {routes.filter(r => r.name.toLowerCase().includes(routeSearch.toLowerCase())).length === 0 ? (
                                                                <div className="p-4 text-center text-sm text-foreground/40 italic">No matching routes found</div>
                                                            ) : routes.filter(r => r.name.toLowerCase().includes(routeSearch.toLowerCase())).map(r => (
                                                                <button
                                                                    key={r._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = [...busForm.route];
                                                                        if (current.includes(r._id)) {
                                                                            setBusForm({ ...busForm, route: current.filter(id => id !== r._id) });
                                                                        } else {
                                                                            setBusForm({ ...busForm, route: [...current, r._id] });
                                                                        }
                                                                    }}
                                                                    className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0 ${busForm.route.includes(r._id) ? 'bg-primary/20 text-primary' : 'text-foreground/60'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold">{r.name}</span>
                                                                        <span className="text-[10px] opacity-40 uppercase tracking-tighter">{r.depoName}</span>
                                                                    </div>
                                                                    {busForm.route.includes(r._id) && <Check className="w-4 h-4" />}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <p className="text-[10px] text-foreground/40 italic">Type to search and select one or more routes</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Associated Depo</label>
                                        <select
                                            required
                                            value={busForm.depo}
                                            onChange={e => setBusForm({ ...busForm, depo: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        >
                                            <option value="" disabled className="bg-background">Select Depo...</option>
                                            {depos.map(d => (
                                                <option key={d._id} value={d.name} className="bg-background">{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => {
                                            setEditingId(null);
                                            setBusForm({ busId: '', busNumber: '', routeName: '', depo: '', route: [] });
                                            setRouteSearch('');
                                            setShowRouteDropdown(false);
                                            setActiveTab('bus-list');
                                        }} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                                        <button disabled={submitting} className="flex-[2] bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Update Bus Details" : "Register Bus"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bus-list' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 lg:-mx-8 lg:px-8 py-4 -mt-4 lg:-mt-8 mb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                                <div>
                                    <h2 className="text-2xl font-bold">Bus Fleet</h2>
                                    <p className="text-xs text-foreground/40 mt-1">Manage and track your bus fleet</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                        <input
                                            type="text"
                                            placeholder="Search buses..."
                                            value={listSearchQuery}
                                            onChange={(e) => setListSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs"
                                        />
                                    </div>
                                    <button onClick={() => setActiveTab('bus-add')} className="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap text-xs font-bold">
                                        <Plus className="w-4 h-4" />
                                        Register Bus
                                    </button>
                                </div>
                            </div>
                            <div className="glass overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Bus Details</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Route Info</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Depo</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                                            ) : buses.filter(bus =>
                                                bus.busNumber.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                                                bus.busId.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                                                bus.routeName.toLowerCase().includes(listSearchQuery.toLowerCase())
                                            ).map(bus => (
                                                <tr key={bus._id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><BusIcon className="w-5 h-5" /></div>
                                                            <div>
                                                                <p className="font-bold text-sm uppercase">{bus.busNumber}</p>
                                                                <p className="text-[10px] text-foreground/40 font-mono">ID: {bus.busId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-primary">{bus.routeName}</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {Array.isArray(bus.route) ? bus.route.map((r: any) => (
                                                                <p key={r._id} className="text-[10px] text-foreground/40 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/5">
                                                                    <MapPin className="w-2.5 h-2.5" />
                                                                    {r.name}
                                                                </p>
                                                            )) : bus.route ? (
                                                                <p className="text-[10px] text-foreground/40 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/5">
                                                                    <MapPin className="w-2.5 h-2.5" />
                                                                    {(bus.route as any).name || 'Unknown'}
                                                                </p>
                                                            ) : (
                                                                <p className="text-[10px] text-foreground/40 italic">No Base Location</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-xs bg-white/5 px-2 py-1 rounded-lg border border-white/10 uppercase tracking-tight">{bus.depo}</span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => {
                                                                setEditingId(bus._id);
                                                                setBusForm({
                                                                    busId: bus.busId,
                                                                    busNumber: bus.busNumber,
                                                                    routeName: bus.routeName,
                                                                    depo: bus.depo,
                                                                    route: Array.isArray(bus.route) ? bus.route.map((r: any) => r._id) : (bus.route?._id ? [bus.route._id] : [])
                                                                });
                                                                setActiveTab('bus-add');
                                                            }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-colors border border-white/5"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => {
                                                                handleConfirmDelete(
                                                                    'Delete Bus?',
                                                                    `Are you sure you want to delete bus ${bus.busNumber}? This action cannot be undone.`,
                                                                    async () => {
                                                                        await fetch(`/api/bus?id=${bus._id}`, { method: 'DELETE' });
                                                                        refreshData();
                                                                    }
                                                                );
                                                            }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors border border-white/5"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'route-add' && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{editingId ? 'Edit Route' : 'Add New Route'}</h2>
                                <button onClick={() => setActiveTab('route-list')} className="text-sm text-primary hover:underline">View All Routes</button>
                            </div>
                            <div className="glass p-8">
                                <form onSubmit={handleRouteSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Route Point Name</label>
                                        <div className="flex gap-4">
                                            <input required value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="West Hill" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
                                            <button type="button" onClick={searchRouteLocation} className="px-6 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary transition-colors flex items-center gap-2">
                                                <Search className="w-4 h-4" />
                                                Locate
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Map Coordinates</label>
                                            <div className="flex gap-4 text-[10px] font-mono text-foreground/40">
                                                <span>LAT: {routeForm.lat.toFixed(6)}</span>
                                                <span>LNG: {routeForm.lng.toFixed(6)}</span>
                                            </div>
                                        </div>
                                        <div className="h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                                            <MapPicker lat={routeForm.lat} lng={routeForm.lng} onChange={(lat, lng) => setRouteForm({ ...routeForm, lat, lng, address: '' })} />
                                        </div>
                                        {routeForm.address && (
                                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1 animate-in fade-in zoom-in-95 duration-300">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Found Address</p>
                                                <p className="text-xs text-foreground/80 leading-relaxed">{routeForm.address}</p>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-foreground/40 text-center italic mt-2">Set the primary location point for this route</p>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => { setEditingId(null); setRouteForm({ name: '', lat: 10.8505, lng: 76.2711, address: '' }); setActiveTab('route-list'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                                        <button disabled={submitting} className="flex-[2] bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Update Route" : "Save Route"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'route-list' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 lg:-mx-8 lg:px-8 py-4 -mt-4 lg:-mt-8 mb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                                <div>
                                    <h2 className="text-2xl font-bold">Manage Routes</h2>
                                    <p className="text-xs text-foreground/40 mt-1">Manage service points and waypoints</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                        <input
                                            type="text"
                                            placeholder="Search routes..."
                                            value={listSearchQuery}
                                            onChange={(e) => setListSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs"
                                        />
                                    </div>
                                    <button onClick={() => setActiveTab('route-add')} className="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap text-xs font-bold">
                                        <Plus className="w-4 h-4" />
                                        Add Route
                                    </button>
                                </div>
                            </div>
                            <div className="glass overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Route Name</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Coordinates</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr><td colSpan={3} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                                            ) : (
                                                routes.filter(route =>
                                                    route.name.toLowerCase().includes(listSearchQuery.toLowerCase())
                                                ).map(route => (
                                                    <tr key={route._id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-4 whitespace-nowrap">
                                                            <p className="font-bold text-sm">{route.name}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="space-y-1 font-mono text-[10px] text-foreground/40">
                                                                <p>LAT: {route.location?.lat.toFixed(6)}</p>
                                                                <p>LNG: {route.location?.lng.toFixed(6)}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => {
                                                                    setEditingId(route._id);
                                                                    setRouteForm({
                                                                        name: route.name,
                                                                        lat: route.location?.lat || 10.8505,
                                                                        lng: route.location?.lng || 76.2711,
                                                                        address: ''
                                                                    });
                                                                    setActiveTab('route-add');
                                                                }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-colors border border-white/5"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => {
                                                                    handleConfirmDelete(
                                                                        'Delete Route?',
                                                                        `Are you sure you want to delete the route "${route.name}"? This action cannot be undone.`,
                                                                        async () => {
                                                                            await fetch(`/api/route?id=${route._id}`, { method: 'DELETE' });
                                                                            refreshData();
                                                                        }
                                                                    );
                                                                }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors border border-white/5"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'depo-add' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{editingId ? 'Edit Depo' : 'Register New Depo'}</h2>
                                <button onClick={() => setActiveTab('depo-list')} className="text-sm text-primary hover:underline">View All Depos</button>
                            </div>
                            <div className="glass p-8">
                                <form onSubmit={handleDepoSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Depo Name</label>
                                        <div className="flex gap-4">
                                            <input required value={depoForm.name} onChange={e => setDepoForm({ ...depoForm, name: e.target.value })} placeholder="Malappuram" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
                                            <button type="button" onClick={searchDepoLocation} className="px-6 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary transition-colors flex items-center gap-2">
                                                <Search className="w-4 h-4" />
                                                Locate
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Map Coordinates</label>
                                            <div className="flex gap-4 text-[10px] font-mono text-foreground/40">
                                                <span>LAT: {depoForm.lat.toFixed(6)}</span>
                                                <span>LNG: {depoForm.lng.toFixed(6)}</span>
                                            </div>
                                        </div>
                                        <div className="h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                                            <MapPicker lat={depoForm.lat} lng={depoForm.lng} onChange={(lat, lng) => setDepoForm({ ...depoForm, lat, lng, address: '' })} />
                                        </div>
                                        {depoForm.address && (
                                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1 animate-in fade-in zoom-in-95 duration-300">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Found Address</p>
                                                <p className="text-xs text-foreground/80 leading-relaxed">{depoForm.address}</p>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-foreground/40 text-center italic mt-2">Drag the marker or click on the map to set the precise location</p>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => { setEditingId(null); setDepoForm({ name: '', lat: 10.8505, lng: 76.2711, address: '' }); setActiveTab('depo-list'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                                        <button disabled={submitting} className="flex-[2] bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Update Depo" : "Save Depo"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'allocation-add' && (
                        <div className="max-w-xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="glass p-8 space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                                <div className="relative">
                                    <h2 className="text-3xl font-bold text-gradient">Staff Allocation</h2>
                                    <p className="text-sm text-foreground/50 mt-1">Assign conductors to buses by date</p>
                                </div>

                                <form onSubmit={handleAllocationSubmit} className="space-y-6 relative">
                                    <div className="space-y-4">
                                        {/* Date Selection */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/40 uppercase ml-1 tracking-wider">Allocation Date</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    required
                                                    value={allocationForm.date}
                                                    onChange={e => setAllocationForm({ ...allocationForm, date: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Bus Selection */}
                                        <div className="space-y-1 relative">
                                            <label className="text-xs font-bold text-foreground/40 uppercase ml-1 tracking-wider">Select Bus (Search by ID)</label>
                                            <div className="relative">
                                                <BusIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                                <input
                                                    type="text"
                                                    placeholder="Search Bus ID or Route..."
                                                    value={busSearch}
                                                    onChange={(e) => {
                                                        setBusSearch(e.target.value);
                                                        setShowBusDropdown(true);
                                                    }}
                                                    onFocus={() => setShowBusDropdown(true)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {showBusDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute z-[100] w-full mt-2 bg-[#121212] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar ring-1 ring-white/10"
                                                    >
                                                        {buses.filter(b => b.busId.toLowerCase().includes(busSearch.toLowerCase()) || b.routeName.toLowerCase().includes(busSearch.toLowerCase())).length > 0 ? (
                                                            buses.filter(b => b.busId.toLowerCase().includes(busSearch.toLowerCase()) || b.routeName.toLowerCase().includes(busSearch.toLowerCase())).map(bus => (
                                                                <button
                                                                    key={bus._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAllocationForm({ ...allocationForm, busId: bus._id });
                                                                        setBusSearch(bus.busId);
                                                                        setShowBusDropdown(false);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-primary">{bus.busId}</span>
                                                                        <span className="text-[10px] text-foreground/40">{bus.routeName}</span>
                                                                    </div>
                                                                    {allocationForm.busId === bus._id && <Check className="w-4 h-4 text-primary" />}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-foreground/40">No buses found</div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Conductor Selection */}
                                        <div className="space-y-1 relative">
                                            <label className="text-xs font-bold text-foreground/40 uppercase ml-1 tracking-wider">Select Conductor (Search by ID)</label>
                                            <div className="relative">
                                                <Users className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/30" />
                                                <input
                                                    type="text"
                                                    placeholder="Search Staff ID or Name..."
                                                    value={conductorSearch}
                                                    onChange={(e) => {
                                                        setConductorSearch(e.target.value);
                                                        setShowConductorDropdown(true);
                                                    }}
                                                    onFocus={() => setShowConductorDropdown(true)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {showConductorDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute z-[100] w-full mt-2 bg-[#121212] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar ring-1 ring-white/10"
                                                    >
                                                        {conductors.filter(c => c.conductorId?.toLowerCase().includes(conductorSearch.toLowerCase()) || c.name.toLowerCase().includes(conductorSearch.toLowerCase())).length > 0 ? (
                                                            conductors.filter(c => c.conductorId?.toLowerCase().includes(conductorSearch.toLowerCase()) || c.name.toLowerCase().includes(conductorSearch.toLowerCase())).map(cond => (
                                                                <button
                                                                    key={cond._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAllocationForm({ ...allocationForm, conductorId: cond._id });
                                                                        setConductorSearch(cond.conductorId);
                                                                        setShowConductorDropdown(false);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-primary">{cond.conductorId}</span>
                                                                        <span className="text-[10px] text-foreground/40">{cond.name}</span>
                                                                    </div>
                                                                    {allocationForm.conductorId === cond._id && <Check className="w-4 h-4 text-primary" />}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-foreground/40">No conductors found</div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {message && (
                                        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.includes('success') || message.includes('Allocation successful') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${message.includes('success') || message.includes('Allocation successful') ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                            {message}
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => { setAllocationForm({ busId: '', conductorId: '', date: new Date().toISOString().split('T')[0] }); setBusSearch(''); setConductorSearch(''); setActiveTab('allocation-list'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                                        <button disabled={submitting} className="flex-[2] bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Allocation"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'allocation-list' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 lg:-mx-8 lg:px-8 py-4 -mt-4 lg:-mt-8 mb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                                <div>
                                    <h2 className="text-2xl font-bold">Staff Allocations</h2>
                                    <p className="text-xs text-foreground/40 mt-1">Daily conductor assignments</p>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                            <input
                                                type="text"
                                                placeholder="Search allocations..."
                                                value={listSearchQuery}
                                                onChange={(e) => setListSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs"
                                            />
                                        </div>
                                        <div className="relative w-full sm:w-auto">
                                            <input
                                                type="date"
                                                value={allocationDateFilter}
                                                onChange={(e) => setAllocationDateFilter(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs text-foreground/80 [color-scheme:dark]"
                                            />
                                            {allocationDateFilter && (
                                                <button
                                                    onClick={() => setAllocationDateFilter('')}
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 hover:text-white"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={() => setActiveTab('allocation-add')} className="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap text-xs font-bold">
                                            <Plus className="w-4 h-4" />
                                            New Allocation
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="glass overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Bus ID</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Conductor</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Allocation Date</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                                            ) : allocations.filter(a => {
                                                const matchesSearch = a.busId?.busId.toLowerCase().includes(listSearchQuery.toLowerCase()) || (a.conductorId?.name || '').toLowerCase().includes(listSearchQuery.toLowerCase());
                                                const matchesDate = !allocationDateFilter || new Date(a.date).toISOString().split('T')[0] === allocationDateFilter;
                                                return matchesSearch && matchesDate;
                                            }).length === 0 ? (
                                                <tr><td colSpan={4} className="p-12 text-center text-foreground/40 text-xs">No allocations found.</td></tr>
                                            ) : allocations.filter(a => {
                                                const matchesSearch = a.busId?.busId.toLowerCase().includes(listSearchQuery.toLowerCase()) || (a.conductorId?.name || '').toLowerCase().includes(listSearchQuery.toLowerCase());
                                                const matchesDate = !allocationDateFilter || new Date(a.date).toISOString().split('T')[0] === allocationDateFilter;
                                                return matchesSearch && matchesDate;
                                            }).map(allocation => (
                                                <tr key={allocation._id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold"><BusIcon className="w-5 h-5" /></div>
                                                            <p className="font-bold text-sm tracking-tight">{allocation.busId?.busId || 'N/A'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold"><Users className="w-5 h-5" /></div>
                                                            <div>
                                                                <p className="font-bold text-sm tracking-tight">{allocation.conductorId?.conductorId || 'N/A'}</p>
                                                                <p className="text-[10px] text-foreground/40 uppercase">{allocation.conductorId?.name || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono text-xs font-bold text-primary">
                                                        {new Date(allocation.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => {
                                                                handleConfirmDelete(
                                                                    'Remove Allocation?',
                                                                    `Are you sure you want to remove this assignment?`,
                                                                    async () => {
                                                                        await fetch(`/api/allocation?id=${allocation._id}`, { method: 'DELETE' });
                                                                        refreshData();
                                                                    }
                                                                );
                                                            }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500 transition-all border border-white/5"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'depo-list' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 lg:-mx-8 lg:px-8 py-4 -mt-4 lg:-mt-8 mb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                                <div>
                                    <h2 className="text-2xl font-bold">Manage Depos</h2>
                                    <p className="text-xs text-foreground/40 mt-1">Central hubs and stations</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                        <input
                                            type="text"
                                            placeholder="Search depos..."
                                            value={listSearchQuery}
                                            onChange={(e) => setListSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs"
                                        />
                                    </div>
                                    <button onClick={() => setActiveTab('depo-add')} className="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap text-xs font-bold">
                                        <Plus className="w-4 h-4" />
                                        Register Depo
                                    </button>
                                </div>
                            </div>

                            <div className="glass overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Depo Name</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Coordinates</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr><td colSpan={3} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                                            ) : (
                                                depos.filter(depo =>
                                                    depo.name.toLowerCase().includes(listSearchQuery.toLowerCase())
                                                ).map(depo => (
                                                    <tr key={depo._id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">{depo.name[0]}</div>
                                                                <p className="font-bold text-sm">{depo.name}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="space-y-1 font-mono text-[10px] text-foreground/40">
                                                                <p>LAT: {depo.location.lat.toFixed(6)}</p>
                                                                <p>LNG: {depo.location.lng.toFixed(6)}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => {
                                                                    setEditingId(depo._id);
                                                                    setDepoForm({ name: depo.name, lat: depo.location.lat, lng: depo.location.lng, address: '' });
                                                                    setActiveTab('depo-add');
                                                                }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-colors border border-white/5"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => {
                                                                    handleConfirmDelete(
                                                                        'Delete Depo?',
                                                                        `Are you sure you want to delete the depo "${depo.name}"? All associated data might be affected.`,
                                                                        async () => {
                                                                            await fetch(`/api/depo?id=${depo._id}`, { method: 'DELETE' });
                                                                            refreshData();
                                                                        }
                                                                    );
                                                                }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors border border-white/5"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'conductors' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 px-4 lg:-mx-8 lg:px-8 py-4 -mt-4 lg:-mt-8 mb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                                <div>
                                    <h2 className="text-2xl font-bold">Registered Staff</h2>
                                    <p className="text-xs text-foreground/40 mt-1">Manage conductors and personnel</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                        <input
                                            type="text"
                                            placeholder="Search staff..."
                                            value={listSearchQuery}
                                            onChange={(e) => setListSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs"
                                        />
                                    </div>
                                    <button onClick={refreshData} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-primary transition-all border border-white/10">
                                        <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="glass overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">ID</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Conductor</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Contact Details</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider">Assigned Depo</th>
                                                <th className="p-4 text-xs font-bold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                                            ) : (
                                                conductors.filter(c =>
                                                    c.name.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                                                    c.conductorId.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                                                    c.phone.toLowerCase().includes(listSearchQuery.toLowerCase())
                                                ).map(conductor => (
                                                    <tr key={conductor._id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-4">
                                                            <span className="text-sm font-bold text-primary font-mono">{conductor.conductorId || 'N/A'}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold uppercase">{conductor.name[0]}</div>
                                                                <p className="font-bold text-sm uppercase">{conductor.name}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-xs">{conductor.email}</p>
                                                            <p className="text-[10px] text-foreground/40">{conductor.phone}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-xs bg-white/5 px-2 py-1 rounded-lg border border-white/10 uppercase tracking-tight">{conductor.depo}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {/* Edit modal or similar could be added if needed, but for now just delete */}
                                                                <button onClick={() => {
                                                                    handleConfirmDelete(
                                                                        'Remove Staff?',
                                                                        `Are you sure you want to remove ${conductor.name} from the system?`,
                                                                        async () => {
                                                                            await fetch(`/api/conductor?id=${conductor._id}`, { method: 'DELETE' });
                                                                            refreshData();
                                                                        }
                                                                    );
                                                                }} className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500 transition-all border border-white/5"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                loading={loading}
            />
        </main >
    );
}
