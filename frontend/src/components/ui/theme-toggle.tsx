import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * ThemeToggle – small sliding toggle with sun/moon icon.
 * No text labels; visually represents current theme.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch – only render when mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-6 w-12 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
    >
      {/* sliding knob */}
      <span
        className={`absolute left-0 inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
      >
        {isDark ? (
          <Moon size={14} className="text-yellow-300" />
        ) : (
          <Sun size={14} className="text-yellow-500" />
        )}
      </span>
    </button>
  );
};
