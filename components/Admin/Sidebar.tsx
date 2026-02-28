import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Bus as BusIcon,
    MapPin,
    Users,
    Menu,
    X,
    Plus,
    Map as MapIcon
} from 'lucide-react';
import Logo from '../Logo';

interface SidebarProps {
    activeTab: 'dashboard' | 'bus-list' | 'bus-add' | 'route-list' | 'route-add' | 'depo-list' | 'depo-add' | 'conductors' | 'allocation-add' | 'allocation-list';
    setActiveTab: (tab: 'dashboard' | 'bus-list' | 'bus-add' | 'route-list' | 'route-add' | 'depo-list' | 'depo-add' | 'conductors' | 'allocation-add' | 'allocation-list') => void;
    handleLogout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }: SidebarProps) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'route-add', label: 'Add Route', icon: Plus },
        { id: 'route-list', label: 'Route List', icon: MapIcon },
        { id: 'bus-add', label: 'Add Bus', icon: Plus },
        { id: 'bus-list', label: 'Bus Fleet', icon: BusIcon },
        { id: 'depo-add', label: 'Add Depo', icon: MapPin },
        { id: 'depo-list', label: 'Depo List', icon: MapIcon },
        { id: 'conductors', label: 'Conductor List', icon: Users },
        { id: 'allocation-add', label: 'Staff Allocation', icon: Plus },
        { id: 'allocation-list', label: 'Allocation List', icon: MapIcon },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <motion.aside
                className={`fixed lg:static inset-y-0 left-0 w-64 glass rounded-none lg:rounded-2xl m-0 lg:m-4 flex flex-col z-50 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 flex items-center justify-between">
                    <Logo />
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id as any);
                                if (window.innerWidth < 1024) setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-foreground/60 hover:bg-white/5'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </motion.aside>
        </>
    );
};

export default Sidebar;
