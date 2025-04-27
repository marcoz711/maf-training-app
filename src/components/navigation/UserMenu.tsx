"use client";

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types/auth';

interface UserMenuProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

const UserMenu = ({ user, isOpen, onClose, onSignOut }: UserMenuProps) => {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => onClose()}
        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none"
      >
        <span className="mr-2">{user.email}</span>
        <svg className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            <Link
              href="/profile"
              className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                pathname === '/profile' ? 'bg-gray-100' : ''
              }`}
              onClick={onClose}
            >
              Profile
            </Link>
            <Link
              href="/profile/maf-questionnaire"
              className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                pathname === '/profile/maf-questionnaire' ? 'bg-gray-100' : ''
              }`}
              onClick={onClose}
            >
              MAF Settings
            </Link>
            <button
              onClick={onSignOut}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 