import { useEffect, useState, memo } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/src/components/layout/Navbar";
import Footer from "@/src/components/layout/Footer";
import Ticker from "@/src/sections/Ticker";
import { motion } from "motion/react";

export default memo(function MainLayout() {
  const [enableBackgroundMotion, setEnableBackgroundMotion] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const updateEnabled = () => setEnableBackgroundMotion(!reduceMotionQuery.matches && !coarsePointerQuery.matches);

    updateEnabled();
    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener("change", updateEnabled);
    } else {
      reduceMotionQuery.addListener(updateEnabled);
    }
    if (coarsePointerQuery.addEventListener) {
      coarsePointerQuery.addEventListener("change", updateEnabled);
    } else {
      coarsePointerQuery.addListener(updateEnabled);
    }

    return () => {
      if (reduceMotionQuery.removeEventListener) {
        reduceMotionQuery.removeEventListener("change", updateEnabled);
      } else {
        reduceMotionQuery.removeListener(updateEnabled);
      }
      if (coarsePointerQuery.removeEventListener) {
        coarsePointerQuery.removeEventListener("change", updateEnabled);
      } else {
        coarsePointerQuery.removeListener(updateEnabled);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-slate-50/30">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {enableBackgroundMotion ? (
          <>
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.4, 0.3],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -right-[10%] w-[50%] sm:w-[60%] h-[50%] sm:h-[60%] bg-purple-200/20 rounded-full blur-[80px] sm:blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-[10%] -left-[10%] w-[40%] sm:w-[50%] h-[40%] sm:h-[50%] bg-indigo-200/20 rounded-full blur-[80px] sm:blur-[120px]" 
            />
          </>
        ) : (
          <>
            <div className="absolute -top-[10%] -right-[10%] w-[50%] sm:w-[60%] h-[50%] sm:h-[60%] bg-purple-200/20 rounded-full blur-[80px] sm:blur-[120px]" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[40%] sm:w-[50%] h-[40%] sm:h-[50%] bg-indigo-200/20 rounded-full blur-[80px] sm:blur-[120px]" />
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Ticker />
        <Navbar />
        <main className="grow relative">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
});

