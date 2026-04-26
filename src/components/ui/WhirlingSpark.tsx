
import React from 'react';
import { motion } from 'framer-motion';

export const WhirlingSpark = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`relative flex items-center justify-center w-6 h-6 perspective-500 ${className}`}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: 360 }}
                transition={{
                    duration: 3,
                    ease: "linear",
                    repeat: Infinity
                }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front Side */}
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-orange-500 absolute inset-0 backface-visible"
                    style={{ backfaceVisibility: 'visible' }}
                >
                    <path
                        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                {/* Back Side (for 3D feel, slightly darker/different opacity) */}
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-orange-600 absolute inset-0"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'visible' }}
                >
                    <path
                        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </motion.div>
        </div>
    );
};
