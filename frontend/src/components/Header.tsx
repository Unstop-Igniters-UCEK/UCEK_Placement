import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

export const Header: React.FC = React.memo(() => {
  const { user } = useApp();

  // When user is logged in, Sidebar handles navigation
  if (user) return null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 w-full bg-transparent font-sans transition-all transform-gpu"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group">
          <img
            src="/new_logo.png"
            alt="Impulse Logo"
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform shrink-0"
          />
          <span
            className="text-xl sm:text-2xl font-normal text-white tracking-tight group-hover:text-orange-400 transition-colors"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
          >
            Impulse
          </span>
        </div>
      </div>
    </motion.header>
  );
});

export default Header;
