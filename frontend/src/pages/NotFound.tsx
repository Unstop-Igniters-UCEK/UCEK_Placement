import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import OrangeBlackGradient from '../components/OrangeBlackGradient';

export const NotFound: React.FC = () => {
  useEffect(() => {
    document.title = 'Page Not Found | Impulse';
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full flex items-center justify-center font-sans p-6 relative overflow-hidden">
      {/* Background layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <OrangeBlackGradient />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-6 max-w-md mx-auto bg-black/75 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl"
      >
        {/* 404 Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-xs font-mono text-orange-400">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
          <span>Error 404</span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The page you are looking for doesn't exist, has been moved, or requires authentication.
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-2">
          <button
            onClick={handleGoHome}
            className="btn-primary w-full py-3 px-6 text-xs font-bold rounded-full shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-black" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
