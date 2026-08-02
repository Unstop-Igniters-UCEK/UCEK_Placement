import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { X, LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    signupUser,
    switchDemoRole
  } = useApp();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [allowExternal, setAllowExternal] = useState(false);
  const [signupYear, setSignupYear] = useState('4th Year');
  const [signupBranch, setSignupBranch] = useState('CSE');
  const [signupDomain, setSignupDomain] = useState('Software Engineering');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Error / Success state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your college email.');
      return;
    }
    if (!loginEmail.endsWith('@ucek.ac.in') && !allowExternal) {
      setErrorMsg('Email must end with @ucek.ac.in (or check external demo toggle)');
      return;
    }
    loginUser(loginEmail);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signupName.trim() || signupName.length < 2) {
      setErrorMsg('Full Name must be at least 2 characters.');
      return;
    }
    if (!signupEmail.endsWith('@ucek.ac.in') && !allowExternal) {
      setErrorMsg('Official email must end with @ucek.ac.in');
      return;
    }
    if (signupPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    signupUser({
      name: signupName,
      email: signupEmail,
      role: 'mentee',
      year: signupYear,
      branch: signupBranch,
      domain: signupDomain,
      isExternal: allowExternal
    });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your registered email.');
      return;
    }
    setForgotSent(true);
    setSuccessMsg(`Password reset instructions sent to ${forgotEmail}`);
  };

  const handleDemoClick = (role: UserRole) => {
    switchDemoRole(role);
    setAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 font-sans">
      <div className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#09090b] text-xs font-sans">
              {authModalMode === 'login' && 'Student Sign In'}
              {authModalMode === 'signup' && 'Register Account'}
              {authModalMode === 'forgot' && 'Reset Password'}
            </span>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1 rounded-full text-zinc-400 hover:text-[#09090b] hover:bg-zinc-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-white">
          <button
            onClick={() => {
              setErrorMsg(null);
              setAuthModalMode('login');
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              authModalMode === 'login' ? 'border-[#09090b] text-[#09090b] font-bold' : 'border-transparent text-zinc-400 hover:text-[#09090b]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setErrorMsg(null);
              setAuthModalMode('signup');
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              authModalMode === 'signup' ? 'border-[#09090b] text-[#09090b] font-bold' : 'border-transparent text-zinc-400 hover:text-[#09090b]'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setErrorMsg(null);
              setAuthModalMode('forgot');
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              authModalMode === 'forgot' ? 'border-[#09090b] text-[#09090b] font-bold' : 'border-transparent text-zinc-400 hover:text-[#09090b]'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Quick Demo Login Section - PERSONA BUTTONS ONLY (LABEL REMOVED) */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleDemoClick('mentee')}
              className="px-2 py-1.5 rounded-full bg-[#09090b] hover:bg-zinc-800 text-white text-[10px] font-bold text-center transition-all cursor-pointer"
            >
              Mentee
            </button>
            <button
              onClick={() => handleDemoClick('mentor')}
              className="px-2 py-1.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-[#09090b] text-center transition-all cursor-pointer"
            >
              Mentor
            </button>
            <button
              onClick={() => handleDemoClick('admin')}
              className="px-2 py-1.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-[#09090b] text-center transition-all cursor-pointer"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-4">
          {errorMsg && (
            <div className="mb-3 p-2.5 rounded-2xl bg-zinc-100 border border-zinc-300 flex items-center gap-2 text-xs text-[#09090b]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#09090b]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-2.5 rounded-2xl bg-zinc-100 border border-zinc-300 flex items-center gap-2 text-xs text-[#09090b]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#09090b]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-600">College Email (@ucek.ac.in)</label>
                <input
                  type="email"
                  className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none focus:border-[#09090b] transition-all font-sans"
                  placeholder="anand.nair@ucek.ac.in"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-600">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setAuthModalMode('forgot');
                    }}
                    className="text-[10px] text-zinc-500 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none focus:border-[#09090b] transition-all font-sans"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs mt-1 rounded-full">
                <LogIn className="w-3.5 h-3.5 text-black" />
                <span>Sign In to Portal</span>
              </button>
            </form>
          )}

          {/* TAB 2: SIGNUP */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-600">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                  placeholder="Anand Nair"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-600">Official Email</label>
                  <label className="flex items-center gap-1 text-[10px] text-zinc-500 cursor-pointer font-sans">
                    <input
                      type="checkbox"
                      checked={allowExternal}
                      onChange={e => setAllowExternal(e.target.checked)}
                      className="accent-[#09090b]"
                    />
                    External Demo
                  </label>
                </div>
                <input
                  type="email"
                  className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                  placeholder={allowExternal ? 'student@gmail.com' : 'anand.nair@ucek.ac.in'}
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600">Year</label>
                  <select
                    className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                    value={signupYear}
                    onChange={e => setSignupYear(e.target.value)}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600">Branch</label>
                  <select
                    className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                    value={signupBranch}
                    onChange={e => setSignupBranch(e.target.value)}
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="EEE">EEE</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Biotech">Biotech</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-600">Domain Interest</label>
                <select
                  className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                  value={signupDomain}
                  onChange={e => setSignupDomain(e.target.value)}
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Core Electronics & Embedded">Core Electronics & Embedded</option>
                  <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-600">Password</label>
                <input
                  type="password"
                  className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                  placeholder="Min 8 characters"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs rounded-full">
                <UserPlus className="w-3.5 h-3.5 text-black" />
                <span>Create Account</span>
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {authModalMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              {!forgotSent ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-600">Registered Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-white text-xs text-[#09090b] px-3.5 py-2 rounded-full border border-zinc-200 outline-none font-sans"
                      placeholder="anand.nair@ucek.ac.in"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full py-2.5 text-xs rounded-full">
                    <KeyRound className="w-3.5 h-3.5 text-black" />
                    <span>Send Reset Link</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-4 space-y-1">
                  <p className="text-xs text-zinc-600 font-medium">
                    Instructions sent to your email address.
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
