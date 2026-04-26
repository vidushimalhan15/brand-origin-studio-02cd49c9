import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";

type FacePosition = "bottom-center" | "top-right" | "top-left" | "center";
type Expression = "neutral" | "winking" | "love" | "surprised" | "happy" | "excited" | "cool";

export interface SingleSmileyProps {
    color: string;
    darkColor: string;
    sizeClass: string;
    delay: number;
    position: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
        transform?: string;
    };
    facePosition: FacePosition;
    expressionIndex: number;
    disableAnimation?: boolean;
}

const getFacePositionStyles = (facePosition: FacePosition): React.CSSProperties => {
    switch (facePosition) {
        case "bottom-center":
            return { bottom: '20%', left: '50%', transform: 'translateX(-50%)' };
        case "top-right":
            return { top: '25%', right: '25%' };
        case "top-left":
            return { top: '30%', left: '30%' };
        case "center":
        default:
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
};

export const SingleSmiley = ({ color, darkColor, sizeClass, delay, position, facePosition, expressionIndex, disableAnimation = false }: SingleSmileyProps) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [expression, setExpression] = useState<Expression>("neutral");

    // Each smiley gets a different expression based on its index
    useEffect(() => {
        const allExpressions: Expression[] = ["winking", "love", "surprised", "happy", "excited", "cool"];

        const interval = setInterval(() => {
            // Offset the expression index so each smiley shows different expression
            const expIndex = (expressionIndex + Math.floor(Date.now() / 5000)) % allExpressions.length;
            setExpression(allExpressions[expIndex]);

            // Return to neutral after a short duration
            setTimeout(() => setExpression("neutral"), 2500);
        }, 5000);

        return () => clearInterval(interval);
    }, [expressionIndex]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 12;
            const y = (e.clientY / window.innerHeight - 0.5) * 12;
            setMousePos({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const faceStyles = getFacePositionStyles(facePosition);

    // Render eyes based on expression
    const renderEyes = () => {
        if (expression === "love") {
            return (
                <>
                    <Heart className="w-4 h-4 fill-current animate-pulse" style={{ color: darkColor }} />
                    <Heart className="w-4 h-4 fill-current animate-pulse" style={{ color: darkColor }} />
                </>
            );
        }
        if (expression === "excited") {
            return (
                <>
                    <Star className="w-4 h-4 fill-current animate-spin" style={{ color: darkColor, animationDuration: '2s' }} />
                    <Star className="w-4 h-4 fill-current animate-spin" style={{ color: darkColor, animationDuration: '2s' }} />
                </>
            );
        }
        if (expression === "happy") {
            return (
                <>
                    <div className="w-4 h-2 border-t-2 rounded-full" style={{ borderColor: darkColor }} />
                    <div className="w-4 h-2 border-t-2 rounded-full" style={{ borderColor: darkColor }} />
                </>
            );
        }
        if (expression === "cool") {
            return (
                <div className="flex gap-2 items-center">
                    <div className="w-5 h-3 rounded-b-full rounded-t-sm" style={{ backgroundColor: darkColor }} />
                    <div className="w-5 h-3 rounded-b-full rounded-t-sm" style={{ backgroundColor: darkColor }} />
                </div>
            );
        }
        if (expression === "surprised") {
            return (
                <>
                    <motion.div
                        className="w-4 h-5 rounded-full"
                        style={{ backgroundColor: darkColor }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                    />
                    <motion.div
                        className="w-4 h-5 rounded-full"
                        style={{ backgroundColor: darkColor }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                    />
                </>
            );
        }
        // Neutral or winking
        return (
            <>
                <motion.div
                    className="w-3 h-5 rounded-full"
                    style={{ backgroundColor: darkColor }}
                    animate={{ x: mousePos.x, y: mousePos.y }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                {expression === "winking" ? (
                    <div className="w-4 h-[2px] self-center" style={{ backgroundColor: darkColor }} />
                ) : (
                    <motion.div
                        className="w-3 h-5 rounded-full"
                        style={{ backgroundColor: darkColor }}
                        animate={{ x: mousePos.x, y: mousePos.y }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                )}
            </>
        );
    };

    // Render mouth based on expression
    const renderMouth = () => {
        if (expression === "surprised") {
            return (
                <motion.div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ borderColor: darkColor }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                />
            );
        }
        if (expression === "happy" || expression === "excited" || expression === "love") {
            return (
                <div
                    className="w-12 h-6 rounded-full"
                    style={{ borderBottom: `3px solid ${darkColor}` }}
                />
            );
        }
        // Default smile
        return (
            <div
                className="w-10 h-5 rounded-full"
                style={{ borderBottom: `3px solid ${darkColor}` }}
            />
        );
    };

    return (
        <motion.div
            animate={disableAnimation ? undefined : {
                y: [-5, 5, -5],
            }}
            transition={{
                duration: 4 + delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay * 0.3,
            }}
            className="absolute cursor-pointer"
            style={position}
            onClick={() => setExpression("excited")}
        >
            <div
                className={`${sizeClass} rounded-full relative`}
                style={{
                    backgroundColor: color,
                }}
            >
                {/* Face container - positioned based on facePosition prop */}
                <div className="absolute flex flex-col items-center gap-3" style={faceStyles}>
                    {/* Eyes */}
                    <div className="flex gap-6 items-center">
                        {renderEyes()}
                    </div>

                    {/* Mouth */}
                    {renderMouth()}
                </div>

            </div>
        </motion.div>
    );
};

export const MascotSmiley = ({ size = "lg" }: { size?: "md" | "lg" }) => {
    const containerClass = "relative w-full h-full overflow-visible";
    const smileySize = size === "lg" ? "w-[300px] h-[300px]" : "w-[220px] h-[220px]";

    const smileys = [
        {
            color: "#2DD4A8",
            darkColor: "#1a6b5c",
            position: { bottom: '0%', left: '-5%' },
            facePosition: "top-right" as FacePosition,
            delay: 0
        },    // Green - bottom left, face at top-right
        {
            color: "#A855F7",
            darkColor: "#581c87",
            position: { top: '-10%', right: '5%' },
            facePosition: "bottom-center" as FacePosition,
            delay: 0.5
        },   // Purple - top right, face at bottom
        {
            color: "#60A5FA",
            darkColor: "#1e3a5f",
            position: { bottom: '5%', right: '-10%' },
            facePosition: "top-left" as FacePosition,
            delay: 1
        },       // Blue - bottom right, face at top-left
    ];

    return (
        <div className={containerClass}>
            {smileys.map((smiley, index) => (
                <SingleSmiley
                    key={index}
                    color={smiley.color}
                    darkColor={smiley.darkColor}
                    sizeClass={smileySize}
                    delay={smiley.delay}
                    position={smiley.position}
                    facePosition={smiley.facePosition}
                    expressionIndex={index}
                />
            ))}
        </div>
    );
};
