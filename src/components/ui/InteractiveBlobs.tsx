
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const InteractiveBlobs = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Precise eye movement calculation
    const calculateEyePos = (intensity: number = 8) => {
        // Normalize based on window center
        const x = (mousePos.x / window.innerWidth - 0.5) * intensity;
        const y = (mousePos.y / window.innerHeight - 0.5) * intensity;
        return { x, y };
    };

    const eyePos = calculateEyePos(10); // Standard eye tracking

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-background pointer-events-none transition-colors duration-300">

            {/* Background Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

            {/* 1. TOP CENTER CIRCLE (The Leader) - Violet/Purple */}
            <motion.div
                className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-b from-violet-500 to-purple-600 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)] z-0"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, type: "spring" }}
            >
                {/* Face Container */}
                <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <div className="flex gap-8">
                        {/* Eyes - Left */}
                        <div className="relative w-4 h-6">
                            <motion.div className="w-4 h-6 bg-slate-950 rounded-full" animate={{ x: eyePos.x, y: eyePos.y }} />
                        </div>
                        {/* Eyes - Right */}
                        <div className="relative w-4 h-6">
                            <motion.div className="w-4 h-6 bg-slate-950 rounded-full" animate={{ x: eyePos.x, y: eyePos.y }} />
                        </div>
                    </div>
                    {/* Smile */}
                    <div className="w-12 h-6 border-b-[4px] border-slate-900/80 rounded-full" />
                </div>
            </motion.div>

            {/* 2. BOTTOM LEFT CIRCLE - Emerald/Teal */}
            <motion.div
                className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_-20px_60px_-15px_rgba(16,185,129,0.3)] z-10"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
            >
                <div className="absolute top-[25%] right-[25%] flex flex-col items-center gap-3">
                    <div className="flex gap-6">
                        <div className="relative w-3 h-5">
                            <motion.div className="w-3 h-5 bg-[#022c22] rounded-full" animate={{ x: eyePos.x, y: eyePos.y }} />
                        </div>
                        <div className="relative w-3 h-5">
                            <motion.div className="w-3 h-5 bg-[#022c22] rounded-full" animate={{ x: eyePos.x, y: eyePos.y }} />
                        </div>
                    </div>
                    <div className="w-10 h-5 border-b-[3px] border-[#022c22] rounded-full" />
                </div>
            </motion.div>

            {/* 3. BOTTOM RIGHT CIRCLE - Indigo/Blue */}
            <motion.div
                className="absolute -bottom-[15%] -right-[5%] w-[450px] h-[450px] rounded-full bg-gradient-to-tl from-indigo-500 to-blue-500 shadow-[0_-20px_60px_-15px_rgba(99,102,241,0.3)] z-10"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.3, type: "spring" }}
            >
                <div className="absolute top-[30%] left-[30%] flex flex-col items-center gap-3">
                    <div className="flex gap-6">
                        {/* High contrast eyes for blue blob */}
                        <div className="relative w-4 h-6">
                            <motion.div className="w-4 h-6 bg-[#0f172a] rounded-full" animate={{ x: eyePos.x, y: eyePos.y }} />
                        </div>
                        <div className="relative w-4 h-6">
                            <motion.div className="w-4 h-6 bg-[#0f172a] rounded-full" animate={{ x: eyePos.x, y: eyePos.y }} />
                        </div>
                    </div>
                    <div className="w-12 h-6 border-b-[3px] border-[#0f172a] rounded-full rotate-[5deg]" />
                </div>
            </motion.div>

        </div>
    );
};
