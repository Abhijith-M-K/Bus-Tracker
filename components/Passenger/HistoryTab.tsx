'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket as TicketIcon, Upload, Calendar, MapPin, Loader2, ArrowRight, User } from 'lucide-react';
import toast from 'react-hot-toast';
import TicketUploadModal from './TicketUploadModal';

export default function HistoryTab() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchTickets = async () => {
        try {
            const passengerData = localStorage.getItem('passengerData');
            const passengerId = passengerData ? JSON.parse(passengerData).id : null;

            if (!passengerId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/passenger/profile?passengerId=${passengerId}`);
            const data = await res.json();
            if (data.success && data.tickets) {
                setTickets(data.tickets);
            }
        } catch (err) {
            console.error('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-full pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md pt-8 mx-auto space-y-6"
        >
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Travel History</h1>
                    <p className="text-foreground/60 text-sm">Your upcoming and past journeys</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all"
                >
                    <Upload className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4 pb-8">
                {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-12 pb-12 text-center glass rounded-2xl p-6">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <TicketIcon className="w-8 h-8 text-foreground/30" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">No Tickets Found</h3>
                        <p className="text-foreground/50 text-sm mb-6 max-w-[250px]">
                            You haven't uploaded any travel tickets yet. Upload a ticket to keep track of your journeys.
                        </p>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            Upload Ticket
                        </button>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={ticket._id}
                            className="glass p-5 rounded-2xl border-l-4 border-l-primary space-y-4 relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg leading-tight uppercase tracking-wide">{ticket.ticketNo}</h4>
                                    <p className="text-[10px] font-bold text-primary tracking-widest uppercase">PNR: {ticket.pnr}</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
                                        <Calendar className="w-3 h-3 text-primary" />
                                        {new Date(ticket.travelDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex-1 space-y-1">
                                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold">From</p>
                                    <p className="font-semibold text-sm truncate">{ticket.pickup}</p>
                                    {ticket.startTime && <p className="text-[10px] text-primary/70 font-bold">{ticket.startTime}</p>}
                                </div>
                                <div className="flex flex-col items-center justify-center px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mb-1" />
                                    <div className="w-px h-10 bg-gradient-to-b from-primary to-foreground/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1" />
                                    <ArrowRight className="w-4 h-4 text-foreground/30 absolute opacity-20" />
                                </div>
                                <div className="flex-1 space-y-1 text-right">
                                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold">To</p>
                                    <p className="font-semibold text-sm truncate">{ticket.dropoff}</p>
                                    {ticket.endTime && <p className="text-[10px] text-primary/70 font-bold tracking-tight">{ticket.endTime}</p>}
                                </div>
                            </div>

                            {ticket.busId && (
                                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                            <TicketIcon className="w-3 h-3 text-primary" />
                                        </div>
                                        <p className="text-xs text-foreground/70 font-medium">Bus ID: {ticket.busId}</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            <TicketUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => {
                    setIsUploadModalOpen(false);
                    setLoading(true);
                    fetchTickets();
                }}
            />
        </motion.div>
    );
}
