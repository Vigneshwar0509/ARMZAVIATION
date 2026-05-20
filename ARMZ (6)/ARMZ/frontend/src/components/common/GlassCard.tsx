import React from "react";
import { cn } from "@/src/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  hoverEffect = true,
  ...props 
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2 } : {}}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "glass-card p-6",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
