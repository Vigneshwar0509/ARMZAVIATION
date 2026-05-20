import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center glass-card border-dashed border-2 border-slate-200 bg-white/30"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="p-6 rounded-3xl bg-purple-50 text-purple-600 mb-8 shadow-inner"
      >
        <Icon className="h-12 w-12" />
      </motion.div>
      <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-lg text-slate-500 max-w-md mb-10 leading-relaxed font-medium">
        {description}
      </p>
      {actionLabel && (
        actionPath ? (
          <Link to={actionPath}>
            <Button size="lg" className="px-10">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button onClick={onAction} size="lg" className="px-10">
            {actionLabel}
          </Button>
        )
      )}
    </motion.div>
  );
};

export default EmptyState;
