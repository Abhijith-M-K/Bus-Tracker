'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileText, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TicketData {
    pnr: string;
    ticketNo: string;
    pickup: string;
    dropoff: string;
    travelDate: string;
    startTime: string;
    endTime: string;
    busId: string;
}

export default function TicketUploadModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [extractedData, setExtractedData] = useState<TicketData | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Please upload a PDF file');
                return;
            }
            setFile(selectedFile);
            handleExtraction(selectedFile);
        }
    };

    const handleExtraction = async (selectedFile: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('ticket', selectedFile);

            const res = await fetch('/api/passenger/ticket/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Ticket parsed successfully');
                setExtractedData(data.data);
            } else {
                toast.error(data.error || 'Failed to parse ticket');
                setExtractedData({
                    pnr: '',
                    ticketNo: '',
                    pickup: '',
                    dropoff: '',
                    travelDate: new Date().toISOString().split('T')[0],
                    startTime: '',
                    endTime: '',
                    busId: ''
                });
            }
        } catch (err) {
            toast.error('An error occurred during extraction');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Handle Save Triggered');
        if (!extractedData) {
            console.error('No extracted data found');
            return;
        }

        setSaving(true);
        try {
            // Manual validation
            const requiredFields = ['pnr', 'ticketNo', 'pickup', 'dropoff', 'travelDate'];
            const missing = requiredFields.filter(field => !extractedData[field as keyof TicketData]);

            if (missing.length > 0) {
                toast.error(`Please fill in: ${missing.join(', ')}`);
                setSaving(false);
                return;
            }

            const passengerDataStr = localStorage.getItem('passengerData');
            let passengerId = null;

            if (passengerDataStr) {
                try {
                    const passengerData = JSON.parse(passengerDataStr);
                    passengerId = passengerData?.id;
                    console.log('Session found for passenger:', passengerId);
                } catch (parseErr) {
                    console.error('Failed to parse passenger data', parseErr);
                }
            }

            if (!passengerId) {
                console.warn('No passengerId found in session');
                toast.error('User session not found. Please log in again.');
                setSaving(false);
                return;
            }

            const payload = { ...extractedData, passengerId };
            console.log('Sending save request to API with payload:', payload);

            const res = await fetch('/api/passenger/ticket/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            console.log('API Response received, status:', res.status);
            const data = await res.json();
            if (data.success) {
                toast.success('Ticket saved successfully');
                onSuccess();
                // Reset states
                setFile(null);
                setExtractedData(null);
            } else {
                console.error('Save failed:', data.error);
                toast.error(data.error || 'Failed to save ticket');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('An error occurred while saving the ticket');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setExtractedData(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4 sm:items-center sm:p-0 pt-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="relative w-full max-w-lg glass rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
                            <h3 className="text-lg font-bold">Upload Ticket</h3>
                            <button
                                onClick={handleClose}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {!file && !uploading && !extractedData && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="application/pdf"
                                        className="hidden"
                                    />
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud className="w-8 h-8" />
                                    </div>
                                    <p className="font-semibold text-foreground mb-1">Select PDF Ticket</p>
                                    <p className="text-xs text-foreground/50 text-center max-w-[200px]">
                                        Upload your e-ticket to automatically extract travel details.
                                    </p>
                                </div>
                            )}

                            {uploading && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
                                        <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
                                    </div>
                                    <p className="font-medium animate-pulse text-foreground/80">Scanning Ticket...</p>
                                </div>
                            )}

                            {extractedData && !uploading && (
                                <form onSubmit={handleSave} noValidate className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="p-4 bg-primary/10 rounded-xl flex items-start gap-4 mb-4">
                                        <FileText className="w-6 h-6 text-primary shrink-0" />
                                        <p className="text-sm font-medium text-primary/80">
                                            We've extracted the following details. Please review and correct them if needed before saving.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">PNR</label>
                                            <input
                                                type="text"
                                                value={extractedData.pnr}
                                                onChange={(e) => setExtractedData({ ...extractedData, pnr: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Ticket No</label>
                                            <input
                                                type="text"
                                                value={extractedData.ticketNo}
                                                onChange={(e) => setExtractedData({ ...extractedData, ticketNo: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Date of Travel</label>
                                        <input
                                            type="date"
                                            value={extractedData.travelDate}
                                            onChange={(e) => setExtractedData({ ...extractedData, travelDate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Pickup</label>
                                            <input
                                                type="text"
                                                value={extractedData.pickup}
                                                onChange={(e) => setExtractedData({ ...extractedData, pickup: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Drop-off</label>
                                            <input
                                                type="text"
                                                value={extractedData.dropoff}
                                                onChange={(e) => setExtractedData({ ...extractedData, dropoff: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={extractedData.startTime}
                                                onChange={(e) => setExtractedData({ ...extractedData, startTime: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">End Time</label>
                                            <input
                                                type="time"
                                                value={extractedData.endTime}
                                                onChange={(e) => setExtractedData({ ...extractedData, endTime: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Bus ID</label>
                                        <input
                                            type="text"
                                            value={extractedData.busId}
                                            onChange={(e) => setExtractedData({ ...extractedData, busId: e.target.value })}
                                            placeholder="Enter Bus ID from SMS"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>



                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-primary/20"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Save Ticket
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
