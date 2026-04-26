import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TEXTS = [
    "Pondering",
    "Thinking",
    "Working",
    "Writing",
    "Drafting",
    "Refining",
    "Brainstorming"
];

interface AIPonderingProps {
    className?: string;
}

export const AIPondering: React.FC<AIPonderingProps> = ({ className }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % STATUS_TEXTS.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={cn("flex items-center gap-2 text-[#71717A] dark:text-[#A1A1AA]", className)}>
            <div className="flex items-center justify-center">
                <div className="matrix-loader" />
            </div>

            <style>{`
                .matrix-loader {
                    width: 22px;
                    height: 18px;
                    background: 
                        linear-gradient(#0000 calc(1*100%/6), currentColor 0 calc(3*100%/6), #0000 0),
                        linear-gradient(#0000 calc(2*100%/6), currentColor 0 calc(4*100%/6), #0000 0),
                        linear-gradient(#0000 calc(3*100%/6), currentColor 0 calc(5*100%/6), #0000 0);
                    background-size: 5px 400%;
                    background-repeat: no-repeat;
                    animation: matrix 1s infinite linear;
                    opacity: 0.7;
                }

                @keyframes matrix {
                    0% {
                        background-position: 0% 100%, 50% 100%, 100% 100%
                    }
                    100% {
                        background-position: 0% 0%, 50% 0%, 100% 0%
                    }
                }
            `}</style>

            <div className="flex items-center gap-1 overflow-hidden min-w-[80px]">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={STATUS_TEXTS[index]}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium"
                    >
                        {STATUS_TEXTS[index]}
                    </motion.span>
                </AnimatePresence>
                <span className="text-sm font-medium">...</span>
            </div>

            <ChevronRight className="w-4 h-4 opacity-40" />
        </div>
    );
};
