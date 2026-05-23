import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppContext } from '../context';
import { auth, db } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome, 
  ShieldCheck, 
  LogOut, 
  ArrowLeft,
  Sun,
  Moon,
  LockKeyhole
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login, logout } = useAppContext();
  const navigate = useNavigate();

  // Color scheme theme toggle
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('luxury_auth_theme') === 'dark';
  });

  // Current sub-view: 'login' | 'signup' | 'forgot'
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Toggle pass visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set page theme effects
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Load remembered email
  useEffect(() => {
    const rememberedMail = localStorage.getItem('evia_remember_email');
    if (rememberedMail) {
      setEmail(rememberedMail);
      setRememberMe(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('luxury_auth_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const trackLoginFirestore = async (userId: string) => {
    try {
      const loginLogRef = doc(db, 'users', userId);
      await updateDoc(loginLogRef, {
        lastLoginAt: Date.now()
      });
    } catch (e) {
      console.warn("Audit update registered:", e);
    }
  };

  // Google Single-Sign-On
  const handleGoogleAuth = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const authUser = result.user;
      
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      const emailVal = authUser.email || '';
      const nameVal = authUser.displayName || 'Collector Guest';
      const avatarVal = authUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameVal)}`;
      
      let finalProfile;
      
      if (userDocSnap.exists()) {
        const stored = userDocSnap.data();
        finalProfile = {
          id: authUser.uid,
          name: stored.name || nameVal,
          email: stored.email || emailVal,
          role: stored.role || 'user',
          avatarUrl: stored.avatarUrl || avatarVal,
          phone: stored.phone || ''
        };
        await updateDoc(userDocRef, {
          lastLoginAt: Date.now(),
          avatarUrl: avatarVal
        });
      } else {
        const freshProfile = {
          name: nameVal,
          email: emailVal.toLowerCase().trim(),
          role: 'user',
          avatarUrl: avatarVal,
          lastLoginAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(userDocRef, freshProfile);
        finalProfile = { id: authUser.uid, ...freshProfile };
      }
      
      login(finalProfile as any);
      toast.success(`Welcome back, ${finalProfile.name}.`, { icon: '✨' });
      navigate('/');
    } catch (err: any) {
      console.error("SSO authentication error:", err);
      if (err.code === 'auth/popup-blocked') {
        toast.error('The pop-up window was blocked by your browser. Please enable pop-ups to continue.');
      } else {
        toast.error(err.message || 'Error occurred during Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all layout fields.');
      return;
    }

    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('evia_remember_email', email);
      } else {
        localStorage.removeItem('evia_remember_email');
      }

      let userCredential;
      let isNewRegistration = false;

      try {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInErr: any) {
        // Auto-register convenience: Create a new account if the user isn't found
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential' ||
          (signInErr.message && signInErr.message.includes('auth/invalid-credential')) ||
          signInErr.code === 'auth/wrong-password'
        ) {
          // Double check if wrong password for existing user
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
            isNewRegistration = true;
          } catch (signUpErr: any) {
            if (signUpErr.code === 'auth/email-already-in-use') {
              throw new Error('This account already exists. Please make sure your password is correct.');
            } else {
              throw signUpErr;
            }
          }
        } else {
          throw signInErr;
        }
      }

      const authUser = userCredential.user;
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let syncProfile;
      if (userDocSnap.exists() && !isNewRegistration) {
        const data = userDocSnap.data();
        syncProfile = {
          id: authUser.uid,
          name: data.name || email.split('@')[0],
          email: data.email || email,
          role: data.role || 'user',
          avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || 'User')}`,
          phone: data.phone || '',
          pincode: data.pincode || '',
          addressLine: data.addressLine || ''
        };
        await updateDoc(userDocRef, { lastLoginAt: Date.now() });
      } else {
        const defaultProfile = {
          name: email.split('@')[0],
          email: email.toLowerCase().trim(),
          role: 'user',
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0])}`,
          lastLoginAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(userDocRef, defaultProfile);
        syncProfile = { id: authUser.uid, ...defaultProfile };
      }

      login(syncProfile as any);
      await trackLoginFirestore(authUser.uid);
      
      toast.success(isNewRegistration ? `Welcome! Your modern shopping account is ready.` : `Welcome back, ${syncProfile.name}!`);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Signature authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up
  const handleEmailSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please specify your first and last name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please specify a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Confirm password does not match.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const authUser = userCredential.user;

      const profilePayload = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'user',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };

      await setDoc(doc(db, 'users', authUser.uid), profilePayload);
      login({ id: authUser.uid, ...profilePayload } as any);
      
      toast.success('Your customer profile is successfully created!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('An account is already linked to this email address.');
      } else {
        toast.error(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please submit a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('A secure password-reset link was dispatched to your inbox.', { duration: 6000 });
      setView('login');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to dispatch password recovery link.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success('Successfully logged out.');
    } catch (err) {
      toast.error('Logout failed.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center py-16 px-4 md:px-8 transition-colors duration-300 font-sans selection:bg-[#9E845A]/30 relative overflow-hidden ${
      isDark ? 'bg-[#12110F] text-[#FAF8F5]' : 'bg-[#FAF8F5] text-[#201E1A]'
    }`}>
      
      {/* Absolute Aesthetic Background Gradients for Luxury Appeal without tech clutter */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#A38A5F]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#A38A5F]/5 blur-[120px] pointer-events-none" />

      {/* Floating Header Actions */}
      <div className="absolute top-6 left-6 right-6 z-40 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className={`h-9 px-4 rounded-full flex items-center gap-2 border text-xs font-semibold tracking-wider transition-all hover:scale-[1.03] active:scale-95 cursor-pointer ${
            isDark 
              ? 'bg-[#1C1A17] border-[#2D2A26] text-[#FAF8F5] hover:bg-[#25221F]' 
              : 'bg-white border-[#ECE6D8] text-[#201E1A] hover:bg-[#FAF8F5] hover:border-[#BEAA84] shadow-xs'
          }`}
        >
          <ArrowLeft size={13} className="text-[#A38A5F]" />
          <span>Back to Store</span>
        </button>

        <button
          onClick={toggleTheme}
          className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all hover:scale-[1.05] active:scale-95 cursor-pointer ${
            isDark 
              ? 'bg-[#1C1A17] border-[#2D2A26] text-amber-400 hover:text-amber-300' 
              : 'bg-white border-[#ECE6D8] text-[#201E1A] hover:text-[#FAF8F5] hover:border-[#BEAA84] shadow-xs'
          }`}
          title="Toggle Color Theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Central Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-3xl font-black tracking-tight inline-flex items-center gap-1 focus:outline-none hover:opacity-85 transition-opacity">
            evia<span className="text-[#A38A5F]">.</span>surplus
          </Link>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#A38A5F] font-bold mt-1.5">Atelier Curations & Surplus</p>
        </div>

        {/* Dynamic Authenticated Session vs Input Portal Box */}
        {user ? (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full p-8 rounded-2xl border text-center transition-all ${
              isDark 
                ? 'bg-[#1C1A17] border-[#2E2C28] shadow-2xl' 
                : 'bg-white border-[#ECE4D5] shadow-[0_24px_50px_-16px_rgba(163,138,95,0.12)]'
            }`}
          >
            <div className="mx-auto w-20 h-20 rounded-full border-2 border-[#E3D9C4] dark:border-[#38332E] flex items-center justify-center relative mb-5 bg-[#FAF8F5] dark:bg-[#12110F] overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={32} className="text-[#A38A5F]" />
              )}
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1C1A17]">
                <ShieldCheck size={12} />
              </div>
            </div>

            <span className="text-[10px] uppercase font-bold tracking-widest text-[#A38A5F] block mb-1">Authenticated Account</span>
            <h2 className="font-serif text-2xl font-bold mb-1">{user.name || 'Member'}</h2>
            <p className="text-xs font-mono text-[#A38A5F] mb-6">{user.email?.toLowerCase()}</p>

            <div className="space-y-3">
              <button 
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <span>Continue Shopping</span>
                <ArrowRight size={13} />
              </button>

              <button 
                onClick={handleLogout}
                className={`w-full py-3.5 rounded-xl text-xs uppercase tracking-widest font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  isDark 
                    ? 'border-[#2E2C28] text-red-400 hover:bg-[#25221F]' 
                    : 'border-red-100 text-red-650 bg-red-50/20 hover:bg-red-50 hover:border-red-200'
                }`}
              >
                <LogOut size={13} />
                <span>Disconnect Account</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full p-8 rounded-3xl border transition-all ${
              isDark 
                ? 'bg-[#1C1A17] border-[#2D2A26] shadow-2xl' 
                : 'bg-white border-[#EAE3D5] shadow-[0_24px_55px_-16px_rgba(163,138,95,0.15)]'
            }`}
          >
            {/* Elegant Tab Switcher for Sign In versus Sign Up, hidden on forgot-password */}
            {view !== 'forgot' && (
              <div className="flex border-b border-[#ECE6D8] dark:border-[#2D2A26] mb-8 pb-1 relative">
                <button
                  type="button"
                  onClick={() => { setView('login'); setShowPassword(false); }}
                  className={`flex-1 pb-3 text-xs uppercase tracking-widest font-extrabold transition-all relative cursor-pointer ${
                    view === 'login' ? 'text-[#201E1A] dark:text-[#FAF8F5]' : 'text-stone-400 hover:text-[#A38A5F]'
                  }`}
                >
                  Sign In
                  {view === 'login' && (
                    <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A38A5F]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setView('signup'); setShowPassword(false); }}
                  className={`flex-1 pb-3 text-xs uppercase tracking-widest font-extrabold transition-all relative cursor-pointer ${
                    view === 'signup' ? 'text-[#201E1A] dark:text-[#FAF8F5]' : 'text-stone-400 hover:text-[#A38A5F]'
                  }`}
                >
                  Create Account
                  {view === 'signup' && (
                    <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A38A5F]" />
                  )}
                </button>
              </div>
            )}

            {/* Quick SSO Section inside card, hidden on recovery view */}
            {view !== 'forgot' && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className={`w-full h-11 flex items-center justify-center gap-3 border text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-3xs ${
                    isDark 
                      ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] hover:bg-[#201E1A]' 
                      : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] hover:bg-white hover:border-[#BEAA84]'
                  }`}
                >
                  <Chrome size={15} className="text-red-500" />
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex py-5 items-center">
                  <div className={`flex-grow border-t ${isDark ? 'border-[#2D2A26]' : 'border-[#ECE6D8]'}`}></div>
                  <span className="flex-shrink mx-3 text-[9px] uppercase tracking-widest text-[#A38A5F] font-extrabold">
                    or use your credentials
                  </span>
                  <div className={`flex-grow border-t ${isDark ? 'border-[#2D2A26]' : 'border-[#ECE6D8]'}`}></div>
                </div>
              </div>
            )}

            {/* Subtitles for Views */}
            {view === 'forgot' && (
              <div className="mb-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full border border-[#ECE6D8] dark:border-[#2D2A26] flex items-center justify-center mb-3 bg-[#FAF8F5] dark:bg-[#12110F] text-[#A38A5F]">
                  <LockKeyhole size={18} />
                </div>
                <h2 className="font-serif text-xl font-bold tracking-tight">Recover Password</h2>
                <p className="text-xs text-[#A38A5F] mt-1.5 leading-relaxed font-light">
                  Provide your email address to receive a secure password recovery link.
                </p>
              </div>
            )}

            {/* Standard Email/Password SIGN IN Form */}
            {view === 'login' && (
              <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Email address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all font-mono ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setView('forgot')} 
                      className="text-[9px] uppercase tracking-wider text-[#A38A5F] hover:underline font-bold transition-all cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-9 pr-10 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F] hover:text-[#201E1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between py-1 px-1 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#ECE6D8] dark:border-[#2D2A26] text-[#A38A5F] focus:ring-[#A38A5F] w-3.5 h-3.5"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-[#A38A5F] font-bold">Remember my email</span>
                  </label>
                  <span className="text-[8px] uppercase tracking-wider text-[#A38A5F]/60 font-semibold italic">Auto Account Protection Active</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 cursor-pointer shadow-md shadow-[#A38A5F]/15 active:scale-98"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Securely Sign In</span>
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Email/Password SIGN UP form */}
            {view === 'signup' && (
              <form onSubmit={handleEmailSignupSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all font-mono ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Create Password</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-9 pr-10 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/80 hover:text-[#201E1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password string"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-9 pr-10 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/80 hover:text-[#201E1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 cursor-pointer shadow-md shadow-[#A38A5F]/15 active:scale-98"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Generate Profile</span>
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* PASSWORD RESET SUB-VIEW */}
            {view === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Account Email Coordinates</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]/70" />
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all font-mono ${
                        isDark 
                          ? 'bg-[#12110F] border-[#2D2A26] text-[#FAF8F5] focus:bg-[#1C1A17]' 
                          : 'bg-[#FAF8F5] border-[#ECE6D8] text-[#201E1A] focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 cursor-pointer shadow-md shadow-[#A38A5F]/15 active:scale-98"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Request Recovery Link</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-[9.5px] font-bold block mx-auto text-[#A38A5F] hover:text-[#201E1A] dark:hover:text-[#FAF8F5] uppercase tracking-widest mt-4 transition-all cursor-pointer"
                >
                  ← Return to Sign In
                </button>
              </form>
            )}

          </motion.div>
        )}

        {/* Brand Copyright Stamp */}
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#A38A5F]/70 mt-8 text-center font-mono">
          © 2026 EVIA SURPLUS CO. · All transactions secured with active TLS/AES protocols
        </p>

      </div>
    </div>
  );
}
