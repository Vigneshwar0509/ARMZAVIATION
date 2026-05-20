import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  subtitle?: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, subtitle, className, side = "right" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const variants = {
    initial: { opacity: 0, scale: 0.95, x: side === "right" ? -10 : side === "left" ? 10 : 0, y: side === "bottom" ? -10 : side === "top" ? 10 : 0 },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
    exit: { opacity: 0, scale: 0.95, x: side === "right" ? -10 : side === "left" ? 10 : 0, y: side === "bottom" ? -10 : side === "top" ? 10 : 0 },
  };

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute z-50 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-2xl pointer-events-none min-w-[120px]",
              sideClasses[side],
              className
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{content}</p>
            {subtitle && (
              <p className="text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">{subtitle}</p>
            )}
            {/* Arrow */}
            <div className={cn(
              "absolute w-2 h-2 bg-slate-900 rotate-45",
              side === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
              side === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
              side === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
              side === "right" && "left-[-4px] top-1/2 -translate-y-1/2",
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
