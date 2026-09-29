import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import Grainient from '../components/Grainient';
import { CustomSelect } from '../components/CustomSelect';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, X, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { sendOtpApi, verifyOtpResetApi, getRegistrationStatusApi } from '../lib/api';

export const LandingPage: React.FC = React.memo(() => {
  const { loginUser, signupUser } = useApp();

  // Auth panel open mode ('login' | 'signup' | 'forgot' | null)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | null>(null);

  // Student self-registration authoritative state and restriction modal
  const [studentSelfRegistrationEnabled, setStudentSelfRegistrationEnabled] = useState<boolean>(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState<boolean>(false);

  // Password visibility states
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('mentee');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password OTP state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch authoritative registration setting from backend
  const checkRegistrationStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await getRegistrationStatusApi();
      const enabled = Boolean(res?.student_self_registration_enabled);
      setStudentSelfRegistrationEnabled(enabled);
      return enabled;
    } catch {
      setStudentSelfRegistrationEnabled(false);
      return false;
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkRegistrationStatus();
  }, [checkRegistrationStatus]);

  // Check direct URL route entry points (e.g. /register, /signup, ?mode=signup, #signup)
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    const isDirectSignup =
      path.includes('/register') ||
      path.includes('/signup') ||
      search.includes('signup') ||
      search.includes('register') ||
      hash.includes('signup') ||
      hash.includes('register');

    if (isDirectSignup) {
      checkRegistrationStatus().then(enabled => {
        if (!enabled) {
          setSelectedRole('mentee');
          setShowRestrictionModal(true);
        } else {
          setSelectedRole('mentee');
          setAuthMode('signup');
        }
      });
    }
  }, [checkRegistrationStatus]);

  const handleOpenLogin = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthMode('login');
  };

  const handleOpenSignup = async (targetRole: UserRole = 'mentee') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const enabled = await checkRegistrationStatus();

    if (targetRole !== 'admin' && !enabled) {
      setSelectedRole('mentee');
      setShowRestrictionModal(true);
      return;
    }

    setSelectedRole(targetRole);
    setAuthMode('signup');
  };

  const handleSwitchToSignup = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const enabled = await checkRegistrationStatus();

    if (selectedRole !== 'admin' && !enabled) {
      setSelectedRole('mentee');
      setShowRestrictionModal(true);
      return;
    }

    setAuthMode('signup');
  };

  const handleCloseRestrictionModal = () => {
    setShowRestrictionModal(false);
    setSelectedRole('mentee');
    setAuthMode('login');
    setErrorMsg(null);
  };

  const handleOpenForgot = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsResetSuccess(false);
    setOtpStep('email');
    setForgotEmail(email.trim());
    setOtpCode('');
    setNewPassword('');
    setAuthMode('forgot');
  };

  const handleCloseAuth = () => {
    setAuthMode(null);
    setShowRestrictionModal(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsResetSuccess(false);
    setOtpStep('email');
  };

  const handleRoleSelect = async (role: UserRole) => {
    setErrorMsg(null);
    setYear('');

    // If in signup mode and switching to Student role, check setting
    if (authMode === 'signup' && role !== 'admin') {
      const enabled = await checkRegistrationStatus();
      if (!enabled) {
        setSelectedRole('mentee');
        setShowRestrictionModal(true);
        return;
      }
    }

    setSelectedRole(role);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await sendOtpApi(forgotEmail);
      setOtpStep('verify');
      setSuccessMsg(res.message || 'Verification code sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!otpCode.trim() || otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyOtpResetApi(forgotEmail, otpCode, newPassword);
      setIsResetSuccess(true);
      setErrorMsg(null);
      setSuccessMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
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
      if (selectedRole !== 'admin') {
        const enabled = await checkRegistrationStatus();
        if (!enabled) {
          setShowRestrictionModal(true);
          return;
        }
      }
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
      if (!branch) {
        setErrorMsg('Please select your Branch.');
        return;
      }
      if (!year) {
        setErrorMsg(selectedRole === 'admin' ? 'Please select your Designation.' : 'Please select your Year.');
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
        const msg = String(err.message || '');
        if (
          msg.includes('exclusive to students') ||
          msg.includes('temporarily unavailable') ||
          msg.includes('self-registration is currently disabled')
        ) {
          setShowRestrictionModal(true);
        } else {
          setErrorMsg(err.message || 'Registration failed.');
        }
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

        <div className={`w-full transition-all duration-300 ease-out ${authMode ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center' : 'max-w-4xl mx-auto text-center'
          }`}>

          {/* HERO CONTENT BLOCK */}
          <motion.div
            layout
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className={`w-full ${authMode ? 'lg:col-span-7 text-left space-y-5 pr-0 lg:pr-4' : 'text-center space-y-6'
              } pointer-events-auto`}
          >
            {/* Main Display Heading (INDEPENDENT SYNE FONT STYLING) */}
            <h1
              className={`font-extrabold tracking-tight text-white leading-[1.1] sm:leading-[1.08] flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-y-2 drop-shadow-md ${authMode
                  ? 'text-2xl sm:text-4xl lg:text-5xl justify-start text-left'
                  : 'text-3xl xs:text-4xl sm:text-6xl lg:text-7xl justify-center text-center'
                }`}
              style={{ fontFamily: "'Syne', -apple-system, sans-serif" }}
            >
              <span className="inline-block max-w-full sm:whitespace-nowrap">
                Placements?
              </span>

              <span className="inline-block max-w-full sm:whitespace-nowrap">
                We got you!
              </span>
            </h1>

            {/* Subheadings & Description */}
            <div className="space-y-4">
              <h2 className={`font-bold text-white uppercase tracking-wider font-mono opacity-95 drop-shadow-sm ${authMode ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'
                }`}>
                Campus Placement Suite
              </h2>

              <h3 className={`font-semibold text-zinc-200 font-sans drop-shadow-sm ${authMode ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                }`}>
                University College of Engineering Kariavattom
              </h3>

              <p
                className={`text-xs sm:text-sm font-light text-white leading-relaxed drop-shadow-md ${authMode ? 'max-w-lg' : 'max-w-2xl mx-auto'
                  }`}
                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
              >
                The official placement preparation platform for UCEK students. Build a solid path to successful placement. Verify ATS compliance, Complete mock placement tests, Practice Interviews, and much more.
              </p>
            </div>

            {/* Hero CTA Buttons - Hidden when Auth Panel is Open */}
            {!authMode && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
                <button
                  onClick={handleOpenLogin}
                  className="btn-primary text-xs px-8 py-3.5 rounded-sm font-bold shadow-md hover:scale-105 active:scale-[0.97] transition-all duration-150 cursor-pointer"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <LogIn className="w-4 h-4 text-[var(--btn-primary-text)]" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={handleOpenSignup}
                  className="text-xs px-8 py-3.5 rounded-full font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/25 hover:border-white/40 shadow-lg hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] active:scale-[0.97] transition-all duration-150 cursor-pointer flex items-center gap-2"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* INTEGRATED AUTH PANEL (5-cols out of 12) */}
          <AnimatePresence>
            {authMode && (
              <motion.div
                key="auth-panel"
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                className="lg:col-span-5 w-full backdrop-blur-2xl bg-black/85 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left relative z-20 pointer-events-auto"
              >
                {/* Close Button (X) */}
                <button
                  onClick={handleCloseAuth}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  title="Close Auth Form"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Form Header */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                    {authMode === 'login'
                      ? selectedRole === 'admin' ? 'Admin Sign In' : 'Student Sign In'
                      : authMode === 'signup'
                      ? selectedRole === 'admin' ? 'Create Admin Account' : 'Create Student Account'
                      : 'Reset Password'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    {authMode === 'login'
                      ? 'Enter your institutional credentials below to access your portal.'
                      : authMode === 'signup'
                      ? 'Register your account profile to access placement preparation tools.'
                      : 'Enter your institutional email to receive a verification OTP code.'}
                  </p>
                </div>

                {/* Role Selector Bar (Changes form role, does NOT auto-login) */}
                {authMode !== 'forgot' && (
                  <div className="pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleSelect('mentee')}
                        className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center cursor-pointer active:scale-[0.98] ${selectedRole === 'mentee'
                            ? 'bg-white text-black border-white font-bold shadow-md'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                          }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleSelect('admin')}
                        className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center cursor-pointer active:scale-[0.98] ${selectedRole === 'admin'
                            ? 'bg-white text-black border-white font-bold shadow-md'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                          }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                <AnimatePresence>
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{successMsg}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Banner */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* UNIFIED AUTH FORM / FORGOT PASSWORD */}
                <AnimatePresence mode="wait">
                  {authMode === 'forgot' ? (
                    <motion.div
                      key="forgot-view"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="space-y-4 pt-1 font-sans"
                    >
                      {isResetSuccess ? (
                        <div className="text-center py-4 space-y-4">
                          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-white font-sans">Password Reset Successful!</h4>
                            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                              Your password has been updated in Supabase. You can now sign in with your new password.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg(null);
                              setSuccessMsg(null);
                              setAuthMode('login');
                            }}
                            className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2 active:scale-[0.98] transition-transform duration-100"
                          >
                            <LogIn className="w-4 h-4 text-black" />
                            <span>Return to Sign In</span>
                          </button>
                        </div>
                      ) : otpStep === 'email' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-300">Registered Email Address</label>
                            <input
                              type="email"
                              className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                              placeholder="e.g. student@gmail.com"
                              value={forgotEmail}
                              onChange={e => setForgotEmail(e.target.value)}
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform duration-150 disabled:opacity-50"
                          >
                            <KeyRound className="w-4 h-4 text-black" />
                            <span>{isSubmitting ? 'Sending Code...' : 'Send Verification Code'}</span>
                          </button>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setErrorMsg(null);
                                setSuccessMsg(null);
                                setAuthMode('login');
                              }}
                              className="text-xs text-zinc-400 hover:text-white font-medium hover:underline cursor-pointer"
                            >
                              ← Back to Sign In
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOtpReset} className="space-y-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-300">6-Digit Verification Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/20 text-white font-mono font-bold tracking-[0.3em] text-center text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                              placeholder="123456"
                              value={otpCode}
                              onChange={e => setOtpCode(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-300">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                                placeholder="Min 6 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                                title={showNewPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                              >
                                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform duration-150 disabled:opacity-50"
                          >
                            <KeyRound className="w-4 h-4 text-black" />
                            <span>{isSubmitting ? 'Resetting Password...' : 'Verify OTP & Reset Password'}</span>
                          </button>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setErrorMsg(null);
                                setSuccessMsg(null);
                                setAuthMode('login');
                              }}
                              className="text-xs text-zinc-400 hover:text-white font-medium hover:underline cursor-pointer"
                            >
                              ← Back to Sign In
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  ) : authMode === 'signup' && selectedRole !== 'admin' && !studentSelfRegistrationEnabled ? (
                    <motion.div
                      key="student-signup-restricted"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="space-y-4 pt-1 font-sans"
                    >
                      <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans pt-1">
                        <p>
                          Impulse is currently exclusive to students of the{' '}
                          <strong className="text-white font-semibold">
                            University College of Engineering Kariavattom (UCEK)
                          </strong>.
                        </p>
                        <p className="text-zinc-400">
                          Student self-registration is temporarily unavailable. If you are a UCEK student, please contact an admin or faculty member to have your account onboarded.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key={authMode}
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="space-y-4 pt-1 font-sans"
                    >
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
                            placeholder="Select branch..."
                            options={['CSE', 'ECE', 'IT']}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-zinc-300">
                            {selectedRole === 'admin' ? 'Designation' : 'Year'}
                          </label>
                          <CustomSelect
                            value={year}
                            onChange={setYear}
                            placeholder={selectedRole === 'admin' ? 'Select designation...' : 'Select year...'}
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
                            onClick={handleOpenForgot}
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
                      className="btn-primary w-full py-3 text-xs font-bold rounded-full shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform duration-150 cursor-pointer mt-2"
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
                            onClick={handleSwitchToSignup}
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
                  </motion.form>
                )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── RESTRICTION POPUP MODAL ── */}
      <AnimatePresence>
        {showRestrictionModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={handleCloseRestrictionModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-md backdrop-blur-2xl bg-black/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-left font-sans pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Subtle ambient orange accent in the corner */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/12 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button (X) at Top-Right */}
              <button
                type="button"
                onClick={handleCloseRestrictionModal}
                className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="space-y-1.5 pr-8">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-orange-400 font-mono">
                    UCEK Exclusive Access
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                  Account Registration Notice
                </h3>
              </div>

              {/* Message */}
              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans pt-1">
                <p>
                  Impulse is currently exclusive to students of the{' '}
                  <strong className="text-white font-semibold">
                    University College of Engineering Kariavattom (UCEK)
                  </strong>.
                </p>
                <p className="text-zinc-400">
                  Student self-registration is temporarily unavailable. If you are a UCEK student, please contact an admin or faculty member to have your account onboarded.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default LandingPage;
