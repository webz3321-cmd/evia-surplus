import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppContext } from '../context';
import { auth, db, firebaseConfigExport } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

  // SSO errors and assistant options
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);

  // Auto-prefix phone entry when switching to signup
  useEffect(() => {
    if (view === 'signup' && !email.startsWith('+91')) {
      setEmail('+91');
    }
  }, [view]);

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
  const handleGoogleAuth = async (mode: 'popup' | 'redirect' = 'popup') => {
    // If user is in signup view, ensure they filled the name and phone fields first
    if (view === 'signup') {
      if (!name.trim() || !email.trim()) {
        toast.error('Identity required. Please capture your Name and Contact (+91) before proceeding.', {
          icon: '⚠️',
          duration: 5000
        });
        return;
      }
      if (!email.startsWith('+91')) {
        toast.error('Identity signature must start with +91 (India).');
        return;
      }
    }

    setLoading(true);
    setSsoError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      if (mode === 'redirect') {
        await signInWithRedirect(auth, provider);
        return; // Redirect happens here
      }

      const result = await signInWithPopup(auth, provider);
      await processAuthResult(result.user);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      if (mode === 'popup') setLoading(false);
    }
  };

  const processAuthResult = async (authUser: any) => {
    const userDocRef = doc(db, 'users', authUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    // In signup view, we prioritize the manually entered name/phone
    const finalEmail = authUser.email || (view === 'signup' ? `${email.replace(/\s+/g, '')}@phone.evia` : '');
    const finalName = (view === 'signup' && name.trim()) ? name.trim() : (authUser.displayName || 'Collector Member');
    const finalPhone = (view === 'signup' && email.trim()) ? email.trim() : '';
    const avatarVal = authUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;
    
    let finalProfile;
    
    if (userDocSnap.exists()) {
      const stored = userDocSnap.data();
      finalProfile = {
        id: authUser.uid,
        name: (view === 'signup' && name.trim()) ? name.trim() : (stored.name || finalName),
        email: stored.email || finalEmail,
        role: stored.role || 'user',
        avatarUrl: stored.avatarUrl || avatarVal,
        phone: (view === 'signup' && email.trim()) ? email.trim() : (stored.phone || finalPhone)
      };
      await updateDoc(userDocRef, {
        lastLoginAt: Date.now(),
        avatarUrl: avatarVal,
        ...(view === 'signup' ? { name: finalName, phone: finalPhone } : {})
      });
    } else {
      // In this version, we automatically create the account even in login view 
      // if it doesn't exist, as per the user's latest request.
      const freshProfile = {
        name: finalName,
        email: finalEmail.toLowerCase().trim(),
        role: 'user',
        avatarUrl: avatarVal,
        phone: finalPhone,
        lastLoginAt: Date.now(),
        createdAt: Date.now()
      };
      await setDoc(userDocRef, freshProfile);
      finalProfile = { id: authUser.uid, ...freshProfile };
    }
    
    login(finalProfile as any);
    toast.success(view === 'signup' ? `Identity Established: ${finalProfile.name}` : `Welcome back, ${finalProfile.name}.`, { icon: '✨' });
    navigate('/');
  };

  const handleAuthError = (err: any) => {
    console.error("SSO authentication error:", err);
    const errCode = err.code || '';
    const errMessage = err.message || '';
    
    if (errCode === 'auth/popup-blocked') {
      setSsoError('popup-blocked');
      toast.error('The pop-up window was blocked. Trying to sign in with redirect might work better.');
    } else if (
      errCode === 'auth/unauthorized-domain' || 
      errCode === 'auth/unauthorized-client' ||
      errMessage.includes('unauthorized-domain') || 
      errMessage.includes('unauthorized_client') ||
      errMessage.includes('unauthorized_domain')
    ) {
      setSsoError('unauthorized-domain');
      setShowHelper(true);
      toast.error(`Domain Authorization Required. This domain needs to be added to your Firebase project's authorized list.`, { duration: 10000 });
    } else {
      setSsoError(errCode || errMessage || 'Google authentication failed');
      setShowHelper(true);
      toast.error(errMessage || 'Error occurred during Google Sign-In.');
    }
  };

  // Handle Redirect Result
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          await processAuthResult(result.user);
          setLoading(false);
        }
      } catch (err: any) {
        handleAuthError(err);
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

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

      // Hardcoded Admin Bypass for specified credentials
      const isAdminCredentials = email.trim().toLowerCase() === 'admin@evia.gmail.com' && (password === 'evia3321');
      const adminAuthPassword = 'evia3321';

      let userCredential;
      let isNewRegistration = false;

      try {
        if (isAdminCredentials) {
          try {
            userCredential = await signInWithEmailAndPassword(auth, email.trim(), adminAuthPassword);
          } catch (e: any) {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, email.trim(), adminAuthPassword);
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                // Return to original sign-in error (password mismatch)
                throw e;
              }
              throw createErr;
            }
          }
        } else {
          userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        }
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential' ||
          (signInErr.message && signInErr.message.includes('auth/invalid-credential'))
        ) {
          toast.error('Identity record not found. Please "Create Account" first.', {
            icon: '🚫',
            duration: 5000
          });
          setView('signup');
          setLoading(false);
          return;
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
        const roleVal = isAdminCredentials ? 'admin' : (data.role || 'user');
        
        syncProfile = {
          id: authUser.uid,
          name: data.name || (isAdminCredentials ? 'Evia Master Admin' : email.split('@')[0]),
          email: data.email || email,
          role: roleVal,
          avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || 'User')}`,
          phone: data.phone || '',
          pincode: data.pincode || '',
          addressLine: data.addressLine || ''
        };
        
        if (roleVal !== data.role) {
          await updateDoc(userDocRef, { role: roleVal, lastLoginAt: Date.now() });
        } else {
          await updateDoc(userDocRef, { lastLoginAt: Date.now() });
        }
      } else {
        const roleVal = isAdminCredentials ? 'admin' : 'user';
        const defaultProfile = {
          name: isAdminCredentials ? 'Evia Master Admin' : email.split('@')[0],
          email: email.toLowerCase().trim(),
          role: roleVal,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(isAdminCredentials ? 'Admin' : email.split('@')[0])}`,
          lastLoginAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(userDocRef, defaultProfile);
        syncProfile = { id: authUser.uid, ...defaultProfile };
      }

      login(syncProfile as any);
      await trackLoginFirestore(authUser.uid);
      
      toast.success(isNewRegistration ? `Welcome! Your modern shopping account is ready.` : `Welcome back, ${syncProfile.name}!`);
      navigate(syncProfile.role === 'admin' ? '/admin.evia.3321' : '/');
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
      toast.error('Please specify your full identity name.');
      return;
    }
    if (!email.trim() || !email.startsWith('+91')) {
      toast.error('Please specify an Indian contact number starting with +91.');
      return;
    }
    
    // In this revised model, Initialize Profile essentially triggers the final verification via Google
    handleGoogleAuth('popup');
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

  // Rapid Sandbox Login (Primary Bypasser for Preview Environment)
  const handleRapidLogin = async (role: 'admin' | 'user') => {
    setLoading(true);
    const targetEmail = role === 'admin' ? 'admin@preview.com' : 'demo@preview.com';
    const targetPass = 'sandbox123';
    
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, targetEmail, targetPass);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.message.includes('invalid-credential')) {
          userCredential = await createUserWithEmailAndPassword(auth, targetEmail, targetPass);
        } else {
          throw e;
        }
      }

      const authUser = userCredential.user;
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let syncProfile;
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        syncProfile = {
          id: authUser.uid,
          name: data.name,
          email: data.email,
          role: data.role || role,
          avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
        };
        if (data.role !== role) {
          await updateDoc(userDocRef, { role: role, lastLoginAt: Date.now() });
          syncProfile.role = role;
        } else {
          await updateDoc(userDocRef, { lastLoginAt: Date.now() });
        }
      } else {
        const defaultProfile = {
          name: role === 'admin' ? 'Evia Administrator' : 'Demo Collector',
          email: targetEmail,
          role: role,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(role === 'admin' ? 'Admin' : 'Demo')}`,
          lastLoginAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(userDocRef, defaultProfile);
        syncProfile = { id: authUser.uid, ...defaultProfile };
      }

      login(syncProfile as any);
      toast.success(`Sandbox Access Granted: Logged in as ${role === 'admin' ? 'Administrator' : 'Collector'}.`, { duration: 4000 });
      navigate(role === 'admin' ? '/admin.evia.3321' : '/');
    } catch (err: any) {
      console.error("Rapid login failed:", err);
      toast.error('Sandbox authentication failed. Please use manual email entry.');
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Sandbox domain copied to clipboard!', { icon: '📋' });
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center py-16 px-4 md:px-8 transition-all duration-700 font-sans selection:bg-[#A38A5F]/40 relative overflow-hidden ${
      isDark ? 'bg-[#0A0A0A] text-[#FAF8F5]' : 'bg-[#FDFBF9] text-[#1A1A1A]'
    }`}>
      
      {/* Dynamic Atmospheric Background - Premium Glassmorphism Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden scale-110">
        <motion.div 
          animate={{ 
            x: [0, 80, 0], 
            y: [0, -120, 0],
            rotate: [0, 20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -right-[5%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#A38A5F]/15 to-transparent blur-[140px] opacity-70" 
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0], 
            y: [0, 150, 0],
            rotate: [0, -20, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#9333ea]/5 to-transparent blur-[120px] opacity-40" 
        />
      </div>

      {/* Floating Header Actions - Minimalist Glass Elements */}
      <div className="absolute top-8 left-8 right-8 z-40 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('/')}
          className={`h-11 px-6 rounded-full flex items-center gap-3 border text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer pointer-events-auto backdrop-blur-xl ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
              : 'bg-white/80 border-stone-200 text-stone-900 hover:bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
          }`}
        >
          <ArrowLeft size={14} className="text-[#A38A5F]" />
          <span>Shop Index</span>
        </button>

        <button
          onClick={toggleTheme}
          className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all hover:scale-[1.1] active:scale-90 cursor-pointer pointer-events-auto backdrop-blur-xl ${
            isDark 
              ? 'bg-white/5 border-white/10 text-amber-300 hover:text-amber-200 shadow-glow shadow-amber-500/20' 
              : 'bg-white/80 border-stone-200 text-stone-800 hover:border-[#BEAA84] shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
          }`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-[460px] z-10 flex flex-col items-center">
        
        {/* Central Luxury Branding */}
        <div className="text-center mb-12 select-none group">
          <Link to="/" className="font-serif text-4xl sm:text-5xl font-black tracking-tight inline-flex items-center gap-1 focus:outline-none transition-transform group-hover:scale-105 duration-500">
            evia<span className="text-[#A38A5F] group-hover:animate-pulse">.</span>surplus
          </Link>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-[1px] w-6 bg-gradient-to-l from-[#A38A5F]/40 to-transparent"></span>
            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-[#A38A5F]/80">Authenticated Laboratory</p>
            <span className="h-[1px] w-6 bg-gradient-to-r from-[#A38A5F]/40 to-transparent"></span>
          </div>
        </div>

        {/* Unified Authentication Portal Box */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className={`w-full p-10 sm:p-12 rounded-[40px] border backdrop-blur-3xl transition-shadow relative ${
            isDark 
              ? 'bg-[#121110]/85 border-white/5 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.9)]' 
              : 'bg-white/95 border-stone-200 shadow-[0_60px_100px_-20px_rgba(163,138,95,0.18)]'
          }`}
        >
          {/* Internal Glow Effect */}
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
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
          <>
            {/* Premium Interaction Switcher */}
            {view !== 'forgot' && (
              <div className="flex border-b border-stone-100 dark:border-white/5 mb-10 pb-0.5 relative select-none">
                <button
                  type="button"
                  onClick={() => { setView('login'); setShowPassword(false); }}
                  className={`flex-1 pb-4 text-[10px] uppercase tracking-[0.3em] font-black transition-all relative cursor-pointer ${
                    view === 'login' ? 'text-foreground' : 'text-stone-400 hover:text-[#A38A5F]'
                  }`}
                >
                  Login
                  {view === 'login' && (
                    <motion.div layoutId="activeAuthIndicator" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#A38A5F] shadow-[0_0_10px_rgba(163,138,95,0.4)] rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setView('signup'); setShowPassword(false); }}
                  className={`flex-1 pb-4 text-[10px] uppercase tracking-[0.3em] font-black transition-all relative cursor-pointer ${
                    view === 'signup' ? 'text-foreground' : 'text-stone-400 hover:text-[#A38A5F]'
                  }`}
                >
                  Create Account
                  {view === 'signup' && (
                    <motion.div layoutId="activeAuthIndicator" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#A38A5F] shadow-[0_0_10px_rgba(163,138,95,0.4)] rounded-full" />
                  )}
                </button>
              </div>
            )}

            {/* Primary Entry Forms */}
            <div className="space-y-6">
              {view === 'login' && (
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-2 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A38A5F]">Authorized Access Only</p>
                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">{`Identity coordinates required for entry`}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuth('popup')}
                    disabled={loading}
                    className="w-full h-18 bg-[#ff4b2b] hover:bg-[#ff3b1b] text-white font-black rounded-3xl shadow-[0_20px_40px_-5px_rgba(255,75,43,0.2)] transition-all flex items-center justify-center gap-4 uppercase text-[11px] tracking-[0.3em] cursor-pointer group active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Chrome size={20} />
                        <span>Continue via Google</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setView('signup')}
                      className="text-[9px] font-black uppercase tracking-[0.25em] text-[#A38A5F] hover:underline"
                    >
                      Missing Profile? Create Account
                    </button>
                  </div>

                  {/* Domain Auth Helper */}
                  {showHelper && ssoError === 'unauthorized-domain' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-left space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <ShieldCheck size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Fix Authorization Error</p>
                          <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                            Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold text-[#A38A5F]">Firebase Console</a>. 
                            Go to <span className="font-bold">Authentication</span> &gt; <span className="font-bold">Settings</span> &gt; <span className="font-bold">Authorized domains</span> and add these:
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                          <code className="text-[8px] font-mono opacity-70 truncate mr-2">{window.location.hostname}</code>
                          <button 
                            onClick={() => handleCopyToClipboard(window.location.hostname)}
                            className="text-[9px] font-black uppercase tracking-tighter text-[#A38A5F] hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {view === 'signup' && (
                <form onSubmit={handleEmailSignupSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A38A5F] ml-1 opacity-70">Identity Name</label>
                     <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full h-15 px-6 border rounded-2.5xl text-[11px] font-bold tracking-[0.1em] outline-none transition-all ${
                        isDark ? 'bg-black/40 border-white/5 text-white focus:border-[#A38A5F]' : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-[#A38A5F]'
                      }`}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A38A5F] ml-1 opacity-70">Indian Contact Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={email} // Using email state as proxy for phone entry
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('+91')) {
                          setEmail(val);
                        } else if (val.length < 3) {
                          setEmail('+91');
                        }
                      }}
                      className={`w-full h-15 px-6 border rounded-2.5xl text-[11px] font-bold tracking-[0.1em] outline-none transition-all font-mono ${
                        isDark ? 'bg-black/40 border-white/5 text-white focus:border-[#A38A5F]' : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-[#A38A5F]'
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-18 bg-[#ff4b2b] hover:bg-[#ff3b1b] text-white font-black rounded-3xl shadow-[0_20px_40px_-5px_rgba(255,75,43,0.2)] transition-all flex items-center justify-center gap-4 uppercase text-[11px] tracking-[0.3em] cursor-pointer group active:scale-[0.98] mt-4"
                    >
                      {loading ? (
                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Chrome size={20} />
                          <span>Initialize Identity</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Domain Auth Helper */}
                  {showHelper && ssoError === 'unauthorized-domain' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-left space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <ShieldCheck size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Fix Authorization Error</p>
                          <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                            Add this domain to <span className="font-bold">Authorized domains</span> in <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold text-[#A38A5F]">Firebase Console</a>:
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                        <code className="text-[8px] font-mono opacity-70 truncate mr-2">{window.location.hostname}</code>
                        <button 
                          onClick={() => handleCopyToClipboard(window.location.hostname)}
                          className="text-[9px] font-black uppercase tracking-tighter text-[#A38A5F] hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </motion.div>
                  )}
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A38A5F] ml-1 opacity-70">Register Coordinates</label>
                     <input
                      type="email"
                      required
                      placeholder="Enter your security email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full h-15 px-6 border rounded-2.5xl text-[11px] font-bold tracking-[0.1em] outline-none transition-all font-mono ${
                        isDark ? 'bg-black/40 border-white/5 text-white focus:border-[#A38A5F]' : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-[#A38A5F]'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black font-black rounded-[24px] shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.3em] disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="h-6 w-6 border-2 border-[#A38A5F] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Dispatch Recovery Link</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#A38A5F] hover:underline font-mono"
                  >
                    <ArrowLeft size={12} />
                    <span>Back to Portal</span>
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Brand Aesthetic Footer */}
      <div className="mt-16 flex flex-col items-center gap-3 opacity-30 select-none">
         <div className="h-12 w-[1px] bg-gradient-to-b from-[#A38A5F] to-transparent"></div>
         <p className="text-[9px] text-[#A38A5F] font-black uppercase tracking-[0.6em] text-center">
           EVIA SURPLUS STUDIO · ALL RIGHTS RESERVED
         </p>
         <div className="flex items-center gap-4 text-[8px] font-mono uppercase tracking-[0.2em] text-[#A38A5F]">
           <span>Secured by AES-256</span>
           <span className="h-1 w-1 rounded-full bg-[#A38A5F]"></span>
           <span>Global Inventory Nodes</span>
         </div>
      </div>
      </div>
    </div>
  );
}
