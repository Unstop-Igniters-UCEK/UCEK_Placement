import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import Grainient from '../components/Grainient';
import { CustomSelect } from '../components/CustomSelect';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, X, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginUser, signupUser, setAuthModalOpen, setAuthModalMode } = useApp();

  // Auth panel open mode ('login' | 'signup' | null)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  // Password visibility states
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('4th Year');
  const [selectedRole, setSelectedRole] = useState<UserRole>('mentee');
  const [adminPasscode, setAdminPasscode] = useState('');
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

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (authMode === 'login') {
      try {
        await loginUser(cleanEmail, password, selectedRole);
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed. Check your credentials.');
      }
    } else if (authMode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your Full Name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (selectedRole === 'admin' && !adminPasscode.trim()) {
        setErrorMsg('Please enter the secret Admin Security Passcode.');
        return;
      }
      try {
        await signupUser({
          name: fullName,
          email: cleanEmail,
          password,
          role: selectedRole,
          branch,
          year,
          domain: 'Software Engineering',
          adminSecurityCode: selectedRole === 'admin' ? adminPasscode : undefined
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed.');
      }
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
                  className="text-xs px-8 py-3.5 rounded-full font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/25 hover:border-white/40 shadow-lg hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-[0.97]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <UserPlus className="w-4 h-4 text-white" />
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
                    {authMode === 'login'
                      ? selectedRole === 'admin' ? 'Admin Sign In' : 'Student Sign In'
                      : selectedRole === 'admin' ? 'Create Admin Account' : 'Create Student Account'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    {authMode === 'login'
                      ? 'Enter your institutional credentials below to access your portal.'
                      : 'Register your account profile to access placement preparation tools.'}
                  </p>
                </div>

                {/* Role Selector Bar (Changes form role, does NOT auto-login) */}
                <div className="pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('mentee')}
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
                      onClick={() => handleRoleSelect('admin')}
                      className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Admin
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
                        placeholder={selectedRole === 'admin' ? 'Administrator Name' : 'e.g. Anand Nair'}
                        className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                        required
                      />
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@gmail.com or official email"
                      className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                      required
                    />
                  </div>

                  {/* Branch & Year if Signup */}
                  {authMode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-300">Branch</label>
                        <CustomSelect
                          value={branch}
                          onChange={setBranch}
                          options={['CSE', 'ECE', 'EEE', 'IT', 'Mechanical']}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-300">Year / Designation</label>
                        <CustomSelect
                          value={year}
                          onChange={setYear}
                          options={
                            selectedRole === 'admin'
                              ? ['Faculty Admin', 'Placement Cell Officer']
                              : ['1st Year', '2nd Year', '3rd Year', '4th Year']
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Admin Passcode Input */}
                  {authMode === 'signup' && selectedRole === 'admin' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-zinc-300">Admin Security Passcode</label>
                      <div className="relative">
                        <input
                          type={showAdminPasscode ? "text" : "password"}
                          value={adminPasscode}
                          onChange={e => setAdminPasscode(e.target.value)}
                          placeholder="Enter secret faculty passcode"
                          className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                          title={showAdminPasscode ? "Hide passcode" : "Show passcode"}
                          aria-label={showAdminPasscode ? "Hide passcode" : "Show passcode"}
                          tabIndex={-1}
                        >
                          {showAdminPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-zinc-300">Password</label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalMode('forgot');
                            setAuthModalOpen(true);
                          }}
                          className="text-[11px] text-zinc-400 font-semibold hover:text-white hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 text-xs font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform cursor-pointer mt-2"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {authMode === 'login' ? `Sign In as ${selectedRole === 'admin' ? 'Admin' : 'Student'}` : `Register ${selectedRole === 'admin' ? 'Admin' : 'Student'} Account`}
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
