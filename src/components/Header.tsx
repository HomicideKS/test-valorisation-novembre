import React from 'react';
import { Calculator, Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onProfileClick: () => void;
  showProfile: boolean;
}

export function Header({ onProfileClick, showProfile }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl">
              <Calculator className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                Outil de Valorisation d'Entreprise
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Calculez la juste valeur avec EPS, OCF, ou FCF
              </p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link
              to={location.pathname === '/profile' ? '/' : '/profile'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {profile?.username || 'Profil'}
              </span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title={`Passer au thème ${theme === 'light' ? 'sombre' : 'clair'}`}
            >
              <ThemeIcon className="h-5 w-5" />
            </button>

            <button
              onClick={signOut}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              title="Se déconnecter"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}