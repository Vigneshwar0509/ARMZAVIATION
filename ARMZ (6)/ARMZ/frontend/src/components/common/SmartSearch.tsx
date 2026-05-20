import React, { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/src/components/ui/Button";

interface SmartSearchProps {
  onSearch: (query: string, filters: any) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ 
  onSearch, 
  placeholder = "Search jobs, companies, or roles...",
  className 
}) => {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    location: "all",
    experience: "all"
  });

  const handleSearch = () => {
    onSearch(query, filters);
  };

  return (
    <div className={cn("relative w-full max-w-4xl mx-auto z-40", className)}>
      <div className="relative group">
        <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full group-hover:bg-purple-500/20 transition-all duration-500" />
        
        <div className="relative flex items-center bg-white/80 backdrop-blur-2xl border border-white/50 shadow-premium rounded-3xl p-2 transition-all duration-500 focus-within:border-purple-400 focus-within:shadow-premium-hover">
          <div className="pl-4 text-slate-400">
            <Search size={20} />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={placeholder}
            aria-label="Search jobs, companies, or roles"
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-medium placeholder:text-slate-400"
          />

          <div className="flex items-center gap-2 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="search-filters"
              className={cn(
                "rounded-full hover:bg-slate-100 transition-transform duration-300",
                isExpanded && "rotate-180"
              )}
            >
              <Filter size={18} className="mr-2" />
              <span className="text-sm font-semibold">Filters</span>
              <ChevronDown size={14} className="ml-1" />
            </Button>
            
            <Button
              type="button"
              onClick={handleSearch}
              className="rounded-2xl px-8"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="search-filters"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 bg-white/90 backdrop-blur-2xl border border-white/50 shadow-premium-hover rounded-3xl sm:rounded-4xl p-5 sm:p-8 mt-2 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Full-time", "Contract", "Freelance"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters({ ...filters, type: type.toLowerCase() })}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
                        filters.type === type.toLowerCase() 
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-200" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Location</label>
                <select 
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-400"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  aria-label="Filter by location"
                >
                  <option value="all">All Locations</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Experience</label>
                <select 
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-400"
                  value={filters.experience}
                  onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                  aria-label="Filter by experience level"
                >
                  <option value="all">Any Experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <button 
                onClick={() => setFilters({ type: "all", location: "all", experience: "all" })}
                className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors"
              >
                Reset all filters
              </button>
              <Button onClick={() => setIsExpanded(false)} variant="secondary" size="sm" className="rounded-xl">
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
