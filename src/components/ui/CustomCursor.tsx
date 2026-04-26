
import React, { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

export const CustomCursor = () => {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = 'auto';
        };
    }, []);

    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[99999] drop-shadow-xl"
            style={{
                translateX: cursorX,
                translateY: cursorY,
            }}
            animate={{
                scale: isClicking ? 0.9 : 1,
            }}
            transition={{ duration: 0.1 }}
        >
            {/* Premium Arrow SVG */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform -translate-x-[2px] -translate-y-[2px]" // Fine-tune tip alignment
            >
                <path
                    d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                    fill="white"
                    stroke="#0f172a" // Dark border for contrast
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    className="opacity-95"
                />
            </svg>
        </motion.div>
    );
};
