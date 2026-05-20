import React from "react";
import { cn } from "@/src/lib/utils";
import { motion, HTMLMotionProps, useReducedMotion } from "motion/react";

interface SectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  title?: string;
  subtitle?: string;
  centered?: boolean;
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  className, 
  containerClassName,
  title,
  subtitle,
  centered = false,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: [0.23, 1, 0.32, 1] }}
      className={cn("py-20 px-4 md:px-8", className)}
      {...props}
    >
      <div className={cn("max-w-7xl mx-auto", containerClassName)}>
        {(title || subtitle) && (
          <div className={cn("mb-12", centered && "text-center")}>
            {title && (
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </motion.section>
  );
};
