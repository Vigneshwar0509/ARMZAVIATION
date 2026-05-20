import { motion } from "motion/react";
import { Loader2, LucideIcon } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  fullScreen?: boolean;
}

export default function LoadingState({ 
  title = "Loading...", 
  description,
  icon: Icon,
  fullScreen = false
}: LoadingStateProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mb-6"
      >
        {Icon ? (
          <div className="h-16 w-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Icon className="h-8 w-8" />
          </div>
        ) : (
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-4 border-purple-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </motion.div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-md">{description}</p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf2ff]">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton Card Component for job listings, etc.
export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-14 w-14 bg-slate-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-200 rounded-full w-2/3" />
          <div className="h-4 bg-slate-200 rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-slate-200 rounded-lg w-20" />
        <div className="h-8 bg-slate-200 rounded-lg w-24" />
        <div className="h-8 bg-slate-200 rounded-lg w-16" />
      </div>
      <div className="h-10 bg-slate-200 rounded-xl w-full" />
    </div>
  );
}

// Skeleton List for tables/lists
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-5 flex items-center space-x-4 animate-pulse">
          <div className="h-12 w-12 bg-slate-200 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded-full w-1/3" />
            <div className="h-3 bg-slate-200 rounded-full w-1/4" />
          </div>
          <div className="h-8 w-24 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}
