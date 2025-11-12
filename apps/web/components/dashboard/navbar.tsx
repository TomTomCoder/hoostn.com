'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

interface NavbarProps {
  userEmail: string;
  userName?: string | null;
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Page Title / Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-anthracite">
            {userName ? `Welcome, ${userName.split(' ')[0]}` : 'Dashboard'}
          </h1>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
              {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-anthracite">
                {userName || 'User'}
              </p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <svg
              className={clsx(
                'w-4 h-4 text-gray-500 transition-transform',
                isMenuOpen && 'transform rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <a
                href="/dashboard/profile"
                className="block px-4 py-2 text-sm text-gray-anthracite hover:bg-gray-50"
              >
                Profile
              </a>
              <a
                href="/dashboard/settings"
                className="block px-4 py-2 text-sm text-gray-anthracite hover:bg-gray-50"
              >
                Settings
              </a>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
