'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

export default function Home() {
  const [busId, setBusId] = useState('');
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (busId) router.push(`/view/${busId}`);
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 space-y-8"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo iconSize={32} textSize="text-4xl" className="mb-2" />
          <p className="text-foreground/60">
            Real-time bus location finder
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 ml-1">
              Find your Bus
            </label>
            <div className="relative">
              <input
                type="text"
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                placeholder="Enter Bus ID (e.g. KA-01)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-foreground/40" />
            </div>
          </div>

          <button
            onClick={handleTrack}
            disabled={!busId}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            <MapPin className="w-5 h-5" />
            Track Live Location
          </button>
        </div>

        <div className="pt-6 text-center text-xs text-foreground/30">
          Powered by Real-time GPS Tracking
        </div>
      </motion.div>
    </main>
  );
}
