import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface PreloaderProps {
  onDone: () => void;
}

const J_PATH = "M74 22 V 96 C 74 134 55 156 27 156 C 18 156 10 153 4 148";

export function Preloader({ onDone }: PreloaderProps) {
  const reduce = Boolean(useReducedMotion());
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (reduce) {
      const fadeTimer = setTimeout(() => setFading(true), 150);
      const doneTimer = setTimeout(onDone, 600);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(doneTimer);
      };
    }
    const fadeTimer = setTimeout(() => setFading(true), 1950);
    const doneTimer = setTimeout(onDone, 2400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [reduce, onDone]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#302f2c]"
      initial={{ opacity: 1 }}
      animate={{ opacity: reduce ? [1, 1, 0] : [1, 1, 0] }}
      transition={
        reduce
          ? { duration: 0.6, times: [0, 0.5, 1] }
          : { duration: 0.5, delay: 1.95, ease: "easeIn" }
      }
      style={{ pointerEvents: fading ? "none" : "auto" }}
    >
      <div className="relative flex flex-col items-center">
        <motion.svg
          viewBox="0 0 100 170"
          className="h-20 w-14 sm:h-24 sm:w-16"
          initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.path
            d={J_PATH}
            fill="none"
            stroke="#b8ddd2"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 1.05, delay: 0.15, ease: [0.39, 0.09, 0.46, 0.25] }
            }
          />
        </motion.svg>

        <motion.div
          className="absolute left-1/2 top-[calc(50%+52px)] h-[3px] rounded-full bg-[#b8ddd2] sm:top-[calc(50%+64px)]"
          initial={{ left: "50%", width: "0px", height: "3px" }}
          animate={
            reduce
              ? { left: ["50%", "50%"], width: ["0px", "56px"], height: ["3px", "0px"] }
              : {
                  left: ["50%", "0%", "0%"],
                  width: ["0px", "100vw", "100vw"],
                  height: ["3px", "3px", "0px"],
                }
          }
          transition={
            reduce
              ? { duration: 0.5, times: [0, 0.6, 1] }
              : { duration: 1.3, delay: 0.95, times: [0, 0.5, 1], ease: [0.72, 0.1, 0.72, 0.96] }
          }
          style={{ transform: "translateX(0)" }}
        />
      </div>
    </motion.div>
  );
}
