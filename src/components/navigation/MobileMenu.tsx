"use client";

import { useRef, useEffect } from 'react';
import { User } from '@/types/auth';
import NavItem from './NavItem';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  user: User | null;
}

const MobileMenu = ({ isOpen, onClose, onSignOut, user }: MobileMenuProps) => {
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

  if (!isOpen) return null;

  return (
    <div className="md:hidden" ref={menuRef}>
      <div className="px-2 pt-2 pb-3 space-y-1">
        <NavItem href="/" label="Home" onClick={onClose} isMobile />
        <NavItem href="/connect/fitnesssyncer" label="Connect Data" onClick={onClose} isMobile />
        
        {user && (
          <>
            <NavItem href="/profile" label="Profile" onClick={onClose} isMobile />
            <NavItem href="/profile/maf-questionnaire" label="MAF Settings" onClick={onClose} isMobile />
            <button
              onClick={onSignOut}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Sign Out
            </button>
          </>
        )}
        
        {!user && (
          <NavItem href="/login" label="Sign In" onClick={onClose} isMobile />
        )}
      </div>
    </div>
  );
};

export default MobileMenu; 