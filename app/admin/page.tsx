'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Bus, Phone, MapPin, Loader2, CheckCircle, Edit2, Trash2, X, Save } from 'lucide-react';

export default function AdminDashboard() {
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        busId: '',
        busNumber: '',
        routeName: '',
        conductorName: '',
        mobileNo: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchBuses();
    }, []);

    const fetchBuses = async () => {
        try {
            const res = await fetch('/api/bus');
            const data = await res.json();
            if (data.success) setBuses(data.buses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...form, _id: editingId } : form;

            const res = await fetch('/api/bus', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Bus updated successfully!' : 'Bus added successfully!');
                setForm({ busId: '', busNumber: '', routeName: '', conductorName: '', mobileNo: '' });
                setEditingId(null);
                fetchBuses();
            } else {
                setMessage(data.error);
            }
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (bus: any) => {
        setEditingId(bus._id);
        setForm({
            busId: bus.busId,
            busNumber: bus.busNumber,
            routeName: bus.routeName,
            conductorName: bus.conductorName,
            mobileNo: bus.mobileNo
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bus?')) return;

        try {
            const res = await fetch(`/api/bus?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchBuses();
            } else {
                alert(data.error);
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ busId: '', busNumber: '', routeName: '', conductorName: '', mobileNo: '' });
    };

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between glass p-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
                        <p className="text-foreground/50">Manage your fleet and conductors</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Component */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="glass p-6 space-y-6 sticky top-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {editingId ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />}
                                    {editingId ? 'Edit Bus' : 'Add New Bus'}
                                </h2>
                                {editingId && (
                                    <button onClick={cancelEdit} className="p-1 hover:bg-white/10 rounded-lg text-foreground/50">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Bus ID (Unique)</label>
                                    <input
                                        required
                                        value={form.busId}
                                        onChange={(e) => setForm({ ...form, busId: e.target.value })}
                                        placeholder="KA-01-1234"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Bus Number</label>
                                    <input
                                        required
                                        value={form.busNumber}
                                        onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
                                        placeholder="Route 242"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Route Name</label>
                                    <input
                                        required
                                        value={form.routeName}
                                        onChange={(e) => setForm({ ...form, routeName: e.target.value })}
                                        placeholder="Central - Airport"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Conductor Name</label>
                                    <input
                                        required
                                        value={form.conductorName}
                                        onChange={(e) => setForm({ ...form, conductorName: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground/40 uppercase">Mobile Number</label>
                                    <input
                                        required
                                        value={form.mobileNo}
                                        onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                                        placeholder="9876543210"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                {message && (
                                    <p className={`text-sm p-3 rounded-lg ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {message}
                                    </p>
                                )}

                                <button
                                    disabled={submitting}
                                    className={`w-full ${editingId ? 'bg-accent' : 'bg-primary'} hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2`}
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <> <Save className="w-5 h-5" /> Update Bus </> : 'Register Bus')}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Bus List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold">Registered Fleet</h2>
                        {loading ? (
                            <div className="glass p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : buses.length === 0 ? (
                            <div className="glass p-12 text-center text-foreground/40">No buses registered yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {buses.map((bus) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={bus._id}
                                            className="glass p-5 space-y-4 border-l-4 border-l-accent relative group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-accent uppercase tracking-tighter">ID: {bus.busId}</span>
                                                    <h3 className="text-lg font-bold mt-1 uppercase">{bus.busNumber}</h3>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(bus)}
                                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(bus._id)}
                                                        className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-foreground/70">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    {bus.routeName}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-foreground/70">
                                                    <Users className="w-4 h-4 text-primary" />
                                                    {bus.conductorName}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-foreground/70">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                    {bus.mobileNo}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
