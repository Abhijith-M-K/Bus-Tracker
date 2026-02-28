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
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2 ${className}`}
        >
            <Bus
                size={iconSize}
                className="text-blue-500"
                fill="none"
                strokeWidth={2.5}
            />
            <span
                className={`${textSize} font-bold text-zinc-100`}
                style={{ fontFamily: 'var(--font-logo)' }}
            >
                Yathra
            </span>
        </motion.div>
    );
}
