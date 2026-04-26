
import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, useSpring } from "framer-motion";
import { MascotSmiley } from "./MascotSmiley";

export const ScrollMascotWrapper = () => {
    const { scrollYProgress } = useScroll();

    // Transform scroll progress to positions
    // 0% -> Initial Hero Position (Fixed relative to viewport technically, but visually usually better to just be absolute in hero)
    // But for a "traveller", sticky is easiest.

    // Let's hide the hero mascot and use this one globally?
    // Or match the hero mascot's position initially.

    // Simplified Logic:
    // Visible after Hero? Or always visible?
    // User asked: "Mascot to be travel with me till i scroll on that page... and lands onto some point"

    // We'll make it fixed position bottom-right or mid-right.

    const yRange = useTransform(scrollYProgress, [0, 0.9], [0, 0]); // Always 0 relative to viewport? 
    // Maybe we want it to move from top-right (hero) to bottom-right (waitlist).

    // X Position:
    // Hero (0): 70% width
    // Middle (0.5): 80% width (drifting)
    // Landing (1): 50% width (Center of waitlist)

    // We need window width to calculate % properly, but can use percentages in CSS.
    const x = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], ["65%", "80%", "80%", "50%"]);
    const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], ["20%", "50%", "80%", "85%"]);
    const scale = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [1, 0.6, 0.6, 1.2]);
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

    const springConfig = { damping: 15, stiffness: 100 };
    const xSpring = useSpring(x, springConfig);
    const ySpring = useSpring(y, springConfig);

    return (
        <motion.div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 40,
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    left: xSpring,
                    top: ySpring,
                    scale: scale,
                    rotate: rotate,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                <MascotSmiley />
            </motion.div>
        </motion.div>
    );
};
