"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  onClick?: () => void;
  className?: string;
  isMobile?: boolean;
}

const NavItem = ({ href, label, onClick, className = '', isMobile = false }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  const baseClasses = isMobile 
    ? 'block px-3 py-2 rounded-md text-base font-medium'
    : 'px-3 py-2 rounded-md text-sm font-medium';
  
  const activeClasses = isActive 
    ? 'bg-gray-900 text-white' 
    : 'text-gray-300 hover:bg-gray-700 hover:text-white';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={onClick}
    >
      {label}
    </Link>
  );
};

export default NavItem; 