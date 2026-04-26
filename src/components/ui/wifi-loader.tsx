import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FUN_TERMS = [
  "Drafting magic",
  "Cooking up ideas",
  "Sprinkling some dust",
  "Consulting the muses",
  "Polishing pixels",
  "Weaving words",
  "Scaling virality",
  "Analyzing trends",
  "Crafting greatness"
];

interface WifiLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const WifiLoader: React.FC<WifiLoaderProps> = ({
  text,
  size = 'md',
  fullScreen = false
}) => {
  const [termIndex, setTermIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTermIndex((prev) => (prev + 1) % FUN_TERMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const containerClasses = fullScreen
    ? "fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999] m-0 p-0"
    : "inline-flex flex-col items-center justify-center p-8";

  const displayOutput = text && text.toLowerCase() !== 'loading' && text.toLowerCase() !== 'drafting'
    ? text
    : FUN_TERMS[termIndex];

  return (
    <div className={containerClasses} style={fullScreen ? { margin: 0, padding: 0 } : {}}>
      <div className="flex flex-col items-center gap-12">
        <div className="loadingspinner" style={{
          transform: size === 'sm' ? 'scale(0.6)' : size === 'lg' ? 'scale(1.2)' : 'scale(1)'
        }}>
          <div id="square1"></div>
          <div id="square2"></div>
          <div id="square3"></div>
          <div id="square4"></div>
          <div id="square5"></div>
        </div>

        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayOutput}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.5, ease: "anticipate" }}
              className="text-white/80 font-display font-medium text-sm tracking-wide text-center"
            >
              {displayOutput}...
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .loadingspinner {
          --square: 20px;
          --offset: 25px;
          --duration: 2.4s;
          --delay: 0.2s;
          --timing-function: ease-in-out;
          --in-duration: 0.4s;
          --in-delay: 0.1s;
          --in-timing-function: ease-out;
          --color: #A855F7;
          width: calc( 3 * var(--offset) + var(--square));
          height: calc( 2 * var(--offset) + var(--square));
          padding: 0px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }

        .loadingspinner div {
          display: inline-block;
          background: var(--color);
          border: none;
          border-radius: 4px;
          width: var(--square);
          height: var(--square);
          position: absolute;
          padding: 0px;
          margin: 0px;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);
        }

        .loadingspinner #square1 {
          left: calc( 0 * var(--offset) );
          top: calc( 0 * var(--offset) );
          animation: square1 var(--duration) var(--delay) var(--timing-function) infinite,
                       squarefadein var(--in-duration) calc(1 * var(--in-delay)) var(--in-timing-function) both;
        }

        .loadingspinner #square2 {
          left: calc( 0 * var(--offset) );
          top: calc( 1 * var(--offset) );
          animation: square2 var(--duration) var(--delay) var(--timing-function) infinite,
                      squarefadein var(--in-duration) calc(1 * var(--in-delay)) var(--in-timing-function) both;
        }

        .loadingspinner #square3 {
          left: calc( 1 * var(--offset) );
          top: calc( 1 * var(--offset) );
          animation: square3 var(--duration) var(--delay) var(--timing-function) infinite,
                       squarefadein var(--in-duration) calc(2 * var(--in-delay)) var(--in-timing-function) both;
        }

        .loadingspinner #square4 {
          left: calc( 2 * var(--offset) );
          top: calc( 1 * var(--offset) );
          animation: square4 var(--duration) var(--delay) var(--timing-function) infinite,
                       squarefadein var(--in-duration) calc(3 * var(--in-delay)) var(--in-timing-function) both;
        }

        .loadingspinner #square5 {
          left: calc( 3 * var(--offset) );
          top: calc( 1 * var(--offset) );
          animation: square5 var(--duration) var(--delay) var(--timing-function) infinite,
                       squarefadein var(--in-duration) calc(4 * var(--in-delay)) var(--in-timing-function) both;
        }

        @keyframes square1 {
          0% { left: calc( 0 * var(--offset) ); top: calc( 0 * var(--offset) ); }
          8.333% { left: calc( 0 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          100% { left: calc( 0 * var(--offset) ); top: calc( 1 * var(--offset) ); }
        }

        @keyframes square2 {
          0% { left: calc( 0 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          8.333% { left: calc( 0 * var(--offset) ); top: calc( 2 * var(--offset) ); }
          16.67% { left: calc( 1 * var(--offset) ); top: calc( 2 * var(--offset) ); }
          25.00% { left: calc( 1 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          83.33% { left: calc( 1 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          91.67% { left: calc( 1 * var(--offset) ); top: calc( 0 * var(--offset) ); }
          100% { left: calc( 0 * var(--offset) ); top: calc( 0 * var(--offset) ); }
        }

        @keyframes square3 {
          0%, 100% { left: calc( 1 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          16.67% { left: calc( 1 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          25.00% { left: calc( 1 * var(--offset) ); top: calc( 0 * var(--offset) ); }
          33.33% { left: calc( 2 * var(--offset) ); top: calc( 0 * var(--offset) ); }
          41.67% { left: calc( 2 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          66.67% { left: calc( 2 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          75.00% { left: calc( 2 * var(--offset) ); top: calc( 2 * var(--offset) ); }
          83.33% { left: calc( 1 * var(--offset) ); top: calc( 2 * var(--offset) ); }
          91.67% { left: calc( 1 * var(--offset) ); top: calc( 1 * var(--offset) ); }
        }

        @keyframes square4 {
          0% { left: calc( 2 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          33.33% { left: calc( 2 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          41.67% { left: calc( 2 * var(--offset) ); top: calc( 2 * var(--offset) ); }
          50.00% { left: calc( 3 * var(--offset) ); top: calc( 2 * var(--offset) ); }
          58.33% { left: calc( 3 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          100% { left: calc( 3 * var(--offset) ); top: calc( 1 * var(--offset) ); }
        }

        @keyframes square5 {
          0% { left: calc( 3 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          50.00% { left: calc( 3 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          58.33% { left: calc( 3 * var(--offset) ); top: calc( 0 * var(--offset) ); }
          66.67% { left: calc( 2 * var(--offset) ); top: calc( 0 * var(--offset) ); }
          75.00% { left: calc( 2 * var(--offset) ); top: calc( 1 * var(--offset) ); }
          100% { left: calc( 2 * var(--offset) ); top: calc( 1 * var(--offset) ); }
        }

        @keyframes squarefadein {
          0% { transform: scale(0.75); opacity: 0.0; }
          100% { transform: scale(1.0); opacity: 1.0; }
        }
      `}</style>
    </div>
  );
};
