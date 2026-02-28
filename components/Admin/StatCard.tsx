import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: string;
    color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass p-6 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20`} style={{ backgroundColor: color }} />

            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground/40 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold">{value}</h3>
                    {trend && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-2xl`} style={{ backgroundColor: `${color}15`, color: color }}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
