'use client';

import { useState } from 'react';
import { MapPin, History, User } from 'lucide-react';
import TrackTab from '@/components/Passenger/TrackTab';
import AccountTab from '@/components/Passenger/AccountTab';
import HistoryTab from '@/components/Passenger/HistoryTab';

export default function PassengerDashboard() {
  const [activeTab, setActiveTab] = useState<'track' | 'history' | 'account'>('track');

  return (
    <main className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 px-4">
        {activeTab === 'track' && <TrackTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-md mx-auto glass rounded-2xl p-2 flex justify-between items-center px-4">
          <button
            onClick={() => setActiveTab('track')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all ${activeTab === 'track' ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:text-foreground/80'}`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Track</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all ${activeTab === 'history' ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:text-foreground/80'}`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">History</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all ${activeTab === 'account' ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:text-foreground/80'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Account</span>
          </button>
        </div>
      </div>
    </main>
  );
}
