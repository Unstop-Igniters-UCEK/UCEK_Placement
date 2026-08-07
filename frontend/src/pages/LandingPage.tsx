import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import Grainient from '../components/Grainient';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, X, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginUser, signupUser, switchDemoRole } = useApp();

  // Auth panel open mode ('login' | 'signup' | null)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  // Form state
  const [email, setEmail] = useState('admin@ucek.edu');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('4th Year');
  const [selectedRole, setSelectedRole] = useState<UserRole>('mentee');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenLogin = () => {
    setErrorMsg(null);
    setAuthMode('login');
  };

  const handleOpenSignup = () => {
    setErrorMsg(null);
    setAuthMode('signup');
  };

  const handleCloseAuth = () => {
    setAuthMode(null);
    setErrorMsg(null);
  };

  const handleDemoRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    switchDemoRole(role);
    if (role === 'mentee') {
      setEmail('anand@ucek.ac.in');
    } else if (role === 'mentor') {
      setEmail('devika@google.com');
    } else {
      setEmail('admin@ucek.ac.in');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (authMode === 'login') {
      if (!email.trim()) {
        setErrorMsg('Please enter your college email.');
        return;
      }
      loginUser(email);
    } else if (authMode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your Full Name.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      signupUser({
        name: fullName,
        email,
        role: selectedRole,
        branch,
        year,
        domain: 'Software Engineering'
      });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full flex items-center justify-center font-sans overflow-hidden py-6 sm:py-12">
      
      {/* Installed ReactBits Grainient Component - EXACT USER PARAMETERS */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-auto">
        <Grainient
          color1="#000000"
          color2="#000000"
          color3="#f97316"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      {/* Main Container Layout */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6">
        
        <div className={`w-full transition-all duration-700 ${
          authMode ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center' : 'max-w-4xl mx-auto text-center'
        }`}>
          
          {/* HERO CONTENT BLOCK */}
          <motion.div
            layout
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${
              authMode ? 'lg:col-span-7 text-left space-y-5 pr-0 lg:pr-4' : 'text-center space-y-6'
            } pointer-events-auto`}
          >
            {/* Back to Home Button when Auth is Open */}
            {authMode && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleCloseAuth}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all cursor-pointer mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-white" />
                <span>Back to Overview</span>
              </motion.button>
            )}

            {/* Main Display Heading (INDEPENDENT SYNE FONT STYLING) */}
            <h1 
              className={`font-extrabold tracking-tight text-white leading-[1.08] flex flex-wrap items-center gap-x-3 gap-y-2 drop-shadow-md ${
                authMode 
                  ? 'text-3xl sm:text-4xl lg:text-5xl justify-start text-left' 
                  : 'text-5xl sm:text-6xl lg:text-7xl justify-center text-center'
              }`}
              style={{ fontFamily: "'Syne', -apple-system, sans-serif" }}
            >
              <motion.span
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
                className="inline-block whitespace-nowrap"
              >
                Placements?
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.12 }}
                className="inline-block whitespace-nowrap"
              >
                We got you!
              </motion.span>
            </h1>

            {/* Subheadings & Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.18 }}
              className="space-y-4"
            >
              <h2 className={`font-bold text-white uppercase tracking-wider font-mono opacity-95 drop-shadow-sm ${
                authMode ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'
              }`}>
                Campus Placement Suite
              </h2>

              <h3 className={`font-semibold text-zinc-200 font-sans drop-shadow-sm ${
                authMode ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}>
                University College of Engineering Kariavattom
              </h3>

              <p 
                className={`text-xs sm:text-sm font-light text-white leading-relaxed drop-shadow-md ${
                  authMode ? 'max-w-lg' : 'max-w-2xl mx-auto'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
              >
                The official placement preparation engine for UCEK engineering students. Verify ATS compliance, complete mock placement drives, and connect with senior alumni.
              </p>
            </motion.div>

            {/* Hero CTA Buttons - Hidden when Auth Panel is Open */}
            {!authMode && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.24 }}
                className="pt-2 flex flex-wrap items-center justify-center gap-4 pointer-events-auto"
              >
                <button
                  onClick={handleOpenLogin}
                  className="btn-primary text-xs px-8 py-3.5 rounded-sm font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <LogIn className="w-4 h-4 text-[var(--btn-primary-text)]" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={handleOpenSignup}
                  className="btn-secondary text-xs px-8 py-3.5 rounded-sm font-bold shadow-xs hover:scale-105 transition-transform cursor-pointer"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <UserPlus className="w-4 h-4 text-[var(--btn-sec-text)]" />
                  <span>Create Account</span>
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* INTEGRATED AUTH PANEL (5-cols out of 12) */}
          <AnimatePresence mode="wait">
            {authMode && (
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: 60, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 w-full backdrop-blur-2xl bg-black/85 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left relative z-20 pointer-events-auto"
              >
                {/* Close Button (X) */}
                <button
                  onClick={handleCloseAuth}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Auth Form"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Form Header */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                    {authMode === 'login' ? 'Sign In to Portal' : 'Create Student Account'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    {authMode === 'login'
                      ? 'Enter your institutional credentials or choose a demo persona below.'
                      : 'Register your UCEK student profile to access placement preparation tools.'}
                  </p>
                </div>

                {/* Demo Role Selector Bar - PERSONA BUTTONS ONLY (LABEL REMOVED) */}
                <div className="pt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoRoleSelect('mentee')}
                      className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedRole === 'mentee'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoRoleSelect('mentor')}
                      className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedRole === 'mentor'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Mentor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoRoleSelect('admin')}
                      className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Officer
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* UNIFIED SINGLE AUTH FORM */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-sans">
                  {/* Full Name field if Signup */}
                  {authMode === 'signup' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Anand Nair"
                        className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                        required
                      />
                    </div>
                  )}

                  {/* College Email Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      College Email <span className="text-zinc-500 font-normal">(@ucek.ac.in)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@ucek.ac.in"
                      className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                      required
                    />
                  </div>

                  {/* Branch & Year if Signup */}
                  {authMode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-300">Branch</label>
                        <select
                          value={branch}
                          onChange={e => setBranch(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-[#18181c] border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all font-sans"
                        >
                          <option value="CSE">CSE</option>
                          <option value="ECE">ECE</option>
                          <option value="EEE">EEE</option>
                          <option value="IT">IT</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-300">Year</label>
                        <select
                          value={year}
                          onChange={e => setYear(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-[#18181c] border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all font-sans"
                        >
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                      required
                    />
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 text-xs font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform cursor-pointer mt-2"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {authMode === 'login' ? 'Sign In to Portal' : 'Register Account'}
                  </button>

                  {/* Toggle Link Mode */}
                  <div className="pt-2 text-center text-xs">
                    {authMode === 'login' ? (
                      <p className="text-zinc-400 font-sans">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('signup')}
                          className="text-white font-bold hover:underline cursor-pointer ml-1"
                        >
                          Create one now
                        </button>
                      </p>
                    ) : (
                      <p className="text-zinc-400 font-sans">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="text-white font-bold hover:underline cursor-pointer ml-1"
                        >
                          Sign In here
                        </button>
                      </p>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};
