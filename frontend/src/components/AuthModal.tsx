import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { CustomSelect } from './CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

import { sendOtpApi, verifyOtpResetApi } from '../lib/api';

export const AuthModal: React.FC = React.memo(() => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    signupUser
  } = useApp();

  // Selected Role state for form
  const [selectedRole, setSelectedRole] = useState<UserRole>('mentee');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupYear, setSignupYear] = useState('4th Year');
  const [signupBranch, setSignupBranch] = useState('CSE');
  const [signupDomain, setSignupDomain] = useState('Software Engineering');
  const [signupPassword, setSignupPassword] = useState('');
  const [adminSecurityCode, setAdminSecurityCode] = useState('');

  // Forgot password OTP state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // Error / Success state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetState = () => {
    setIsResetSuccess(false);
    setOtpStep('email');
    setOtpCode('');
    setNewPassword('');
    setAdminSecurityCode('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const finalEmail = loginEmail.trim();

    if (!finalEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    try {
      await loginUser(finalEmail, loginPassword, selectedRole);
      setAuthModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check your credentials.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const finalEmail = signupEmail.trim();

    if (!signupName.trim() || signupName.length < 2) {
      setErrorMsg('Full Name must be at least 2 characters.');
      return;
    }
    if (!finalEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (selectedRole === 'admin' && !adminSecurityCode.trim()) {
      setErrorMsg('Please enter the secret Admin Security Passcode.');
      return;
    }

    try {
      await signupUser({
        name: signupName,
        email: finalEmail,
        password: signupPassword,
        role: selectedRole,
        year: signupYear,
        branch: signupBranch,
        domain: signupDomain,
        adminSecurityCode: selectedRole === 'admin' ? adminSecurityCode : undefined
      });
      setAuthModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    try {
      const res = await sendOtpApi(forgotEmail);
      setOtpStep('verify');
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code.');
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
    try {
      await verifyOtpResetApi(forgotEmail, otpCode, newPassword);
      setIsResetSuccess(true);
      setErrorMsg(null);
      setSuccessMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-sans"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'center' }}
            className="relative w-full max-w-sm bg-[#0d0d12]/95 border border-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden text-white font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                {authModalMode === 'forgot' ? (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-white">
                    {authModalMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-white font-sans tracking-tight">
                    {authModalMode === 'login' && 'Sign In to Portal'}
                    {authModalMode === 'signup' && 'Create Your Account'}
                    {authModalMode === 'forgot' && 'Reset Password'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    {authModalMode === 'login' && 'Enter your portal credentials'}
                    {authModalMode === 'signup' && 'Join placement & mentorship suite'}
                    {authModalMode === 'forgot' && 'Enter your email to receive a password reset link'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  handleResetState();
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation (Hidden in Forgot Password Mode) */}
            {authModalMode !== 'forgot' && (
              <div className="flex border-b border-white/10 bg-white/[0.02] p-1 gap-1">
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthModalMode('login');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    authModalMode === 'login'
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthModalMode('signup');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    authModalMode === 'signup'
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Role Toggle Selector (Hidden in Forgot Password Mode) */}
            {authModalMode !== 'forgot' && (
              <div className="bg-white/[0.02] border-b border-white/10 px-4 py-2.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('mentee')}
                    className={`px-2 py-1.5 rounded-full text-[10px] font-bold text-center transition-all cursor-pointer ${
                      selectedRole === 'mentee'
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`px-2 py-1.5 rounded-full text-[10px] font-bold text-center transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}

            {/* Body Form */}
            <div className="p-5">
              {errorMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* TAB 1: LOGIN */}
              {authModalMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 font-sans">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-white/5 text-xs text-white px-4 py-2.5 rounded-full border border-white/15 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans placeholder-zinc-500"
                      placeholder="student@gmail.com or official email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-zinc-300">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          setAuthModalMode('forgot');
                        }}
                        className="text-[10px] text-zinc-400 font-semibold hover:text-white hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        className="w-full bg-white/5 text-xs text-white pl-4 pr-10 py-2.5 rounded-full border border-white/15 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans placeholder-zinc-500"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                        title={showLoginPassword ? "Hide password" : "Show password"}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3 text-xs font-bold mt-1 rounded-full shadow-lg cursor-pointer">
                    <LogIn className="w-3.5 h-3.5 text-black" />
                    <span>Sign In as {selectedRole === 'admin' ? 'Admin' : 'Student'}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: SIGNUP */}
              {authModalMode === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-3 font-sans">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 text-xs text-white px-4 py-2.5 rounded-full border border-white/15 outline-none focus:border-white transition-all font-sans placeholder-zinc-500"
                      placeholder={selectedRole === 'admin' ? 'Administrator Name' : 'Anand Nair'}
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-white/5 text-xs text-white px-4 py-2.5 rounded-full border border-white/15 outline-none focus:border-white transition-all font-sans placeholder-zinc-500"
                      placeholder="student@gmail.com or official email"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Year / Designation</label>
                      <CustomSelect
                        value={signupYear}
                        onChange={setSignupYear}
                        options={
                          selectedRole === 'admin'
                            ? ['Faculty Admin', 'Placement Cell Officer']
                            : ['1st Year', '2nd Year', '3rd Year', '4th Year']
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Branch</label>
                      <CustomSelect
                        value={signupBranch}
                        onChange={setSignupBranch}
                        options={['CSE', 'ECE', 'IT', 'EEE', 'Mechanical', 'Biotech']}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Domain Interest</label>
                    <CustomSelect
                      value={signupDomain}
                      onChange={setSignupDomain}
                      options={[
                        'Software Engineering',
                        'Data Science & AI',
                        'Core Electronics & Embedded',
                        'UI/UX & Product Design',
                        'Cloud & DevOps'
                      ]}
                    />
                  </div>

                  {selectedRole === 'admin' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Admin Security Passcode</label>
                      <div className="relative">
                        <input
                          type={showAdminCode ? "text" : "password"}
                          className="w-full bg-white/5 text-xs text-white pl-4 pr-10 py-2.5 rounded-full border border-white/15 outline-none focus:border-white transition-all font-sans placeholder-zinc-500"
                          placeholder="Enter secret faculty passcode"
                          value={adminSecurityCode}
                          onChange={e => setAdminSecurityCode(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminCode(!showAdminCode)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                          title={showAdminCode ? "Hide passcode" : "Show passcode"}
                          aria-label={showAdminCode ? "Hide passcode" : "Show passcode"}
                          tabIndex={-1}
                        >
                          {showAdminCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Password</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        className="w-full bg-white/5 text-xs text-white pl-4 pr-10 py-2.5 rounded-full border border-white/15 outline-none focus:border-white transition-all font-sans placeholder-zinc-500"
                        placeholder="Min 8 characters"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                        title={showSignupPassword ? "Hide password" : "Show password"}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3 text-xs font-bold rounded-full mt-1 cursor-pointer">
                    <UserPlus className="w-3.5 h-3.5 text-black" />
                    <span>Register {selectedRole === 'admin' ? 'Admin' : 'Student'} Account</span>
                  </button>
                </form>
              )}

              {/* TAB 3: DEDICATED FORGOT PASSWORD */}
              {authModalMode === 'forgot' && (
                <div className="space-y-4 font-sans">
                  {isResetSuccess ? (
                    <div className="text-center py-3 space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white font-sans">Password Reset Successful!</h4>
                        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                          Your password has been updated in Supabase. Click below to return to the landing page and sign in with your new password.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalOpen(false);
                          handleResetState();
                        }}
                        className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2"
                      >
                        <LogIn className="w-4 h-4 text-black" />
                        <span>Return to Landing Page & Sign In</span>
                      </button>
                    </div>
                  ) : otpStep === 'email' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Registered Email Address</label>
                        <input
                          type="email"
                          className="w-full bg-white/5 text-xs text-white px-4 py-3 rounded-full border border-white/15 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans placeholder-zinc-500"
                          placeholder="e.g. student@gmail.com"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          required
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg">
                        <KeyRound className="w-4 h-4 text-black" />
                        <span>Send Verification Code</span>
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalMode('login');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-xs text-zinc-400 hover:text-white font-medium hover:underline cursor-pointer"
                        >
                          ← Back to Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtpReset} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">6-Digit Verification Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          className="w-full bg-white/5 text-sm font-mono font-bold tracking-[0.4em] text-center text-white px-4 py-3 rounded-full border border-white/20 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          placeholder="123456"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="w-full bg-white/5 text-xs text-white pl-4 pr-10 py-3 rounded-full border border-white/15 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans placeholder-zinc-500"
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
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg">
                        <KeyRound className="w-4 h-4 text-black" />
                        <span>Reset Password & Sign In</span>
                      </button>

                      <div className="pt-1 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep('email');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-xs text-zinc-400 hover:text-white font-medium hover:underline cursor-pointer"
                        >
                          Change Email Address
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default AuthModal;
