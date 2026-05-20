import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Plane } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-lg">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative inline-block"
        >
          <Plane className="h-24 w-24 text-purple-600 mx-auto animate-bounce" />
          <h1 className="text-9xl font-bold text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">404</h1>
        </motion.div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-slate-900">Flight Diverted!</h2>
          <p className="text-slate-500 text-lg">
            The page <code className="bg-slate-100 px-2 py-1 rounded text-purple-600 font-mono text-sm">{location.pathname}</code> has been cleared for takeoff to a different destination or doesn't exist.
          </p>
        </div>

        <Link 
          to="/" 
          className="premium-button-primary inline-flex items-center space-x-2 px-8 py-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Hangar (Home)</span>
        </Link>
      </div>
    </div>
  );
}
