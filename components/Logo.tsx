'use client';

import { Bus } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    iconSize?: number;
    textSize?: string;
}

export default function Logo({ className = "", iconSize = 24, textSize = "text-2xl" }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-2.5 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center"
            >
                <Bus size={iconSize} className="text-white" strokeWidth={2.5} />
            </motion.div>
            <span
                className={`${textSize} tracking-tight text-gradient italic`}
                style={{ fontFamily: 'var(--font-logo)' }}
            >
                Yathra
            </span>
        </div>
    );
}
