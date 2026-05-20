import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/src/store/uiStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:text-purple-600 transition-colors inline-flex items-center justify-center dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-purple-300"
      aria-label="Toggle color theme"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
