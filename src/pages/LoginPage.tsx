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
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
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

  // Current sub-view: 'portal' | 'forgot'
  const [view, setView] = useState<'portal' | 'forgot'>('portal');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loading, setLoading] = useState(false);

  // SSO errors and assistant options
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);

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
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please specify your valid email coordinates before proceeding.');
      return;
    }

    setLoading(true);
    setSsoError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 
      prompt: 'select_account',
      login_hint: email.trim()
    });
    
    try {
      if (mode === 'redirect') {
        await signInWithRedirect(auth, provider);
        return; 
      }

      const result = await signInWithPopup(auth, provider);
      
      // Strict equality check for requested email vs authenticated email
      if (email.trim().toLowerCase() !== result.user.email?.toLowerCase()) {
        await signOut(auth);
        throw new Error(`Restricted Access: You requested access for ${email}, but authenticated as ${result.user.email}. Please ensure you select the correct Google account matching the specified coordinates.`);
      }

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
    
    // Auto-remember email if successful
    if (rememberMe) {
      localStorage.setItem('evia_remember_email', authUser.email);
    }

    const isAdminEmail = (emailAddr?: string | null) => {
      if (!emailAddr) return false;
      const adminList = [
        'admin@evia.gmail.com',
        'admin@evia.com',
        'webz3321@gmail.com',
        'tks@admin.gmail.com'
      ];
      return adminList.includes(emailAddr.toLowerCase().trim());
    };

    const finalEmail = (authUser.email || '').toLowerCase();
    const finalName = authUser.displayName || name.trim() || 'Collector Member';
    const avatarVal = authUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;
    const assignedRole = isAdminEmail(finalEmail) ? 'admin' : 'user';
    
    let finalProfile;
    
    if (userDocSnap.exists()) {
      const stored = userDocSnap.data();
      finalProfile = {
        id: authUser.uid,
        name: stored.name || finalName,
        email: stored.email || finalEmail,
        role: assignedRole || stored.role || 'user',
        avatarUrl: stored.avatarUrl || avatarVal,
        phone: stored.phone || ''
      };

      // Update basic details on every login
      await updateDoc(userDocRef, {
        lastLoginAt: Date.now(),
        avatarUrl: avatarVal,
        role: finalProfile.role // Sync role based on email list
      });
    } else {
      const freshProfile = {
        name: finalName,
        email: finalEmail,
        role: assignedRole,
        avatarUrl: avatarVal,
        phone: '',
        lastLoginAt: Date.now(),
        createdAt: Date.now()
      };
      await setDoc(userDocRef, freshProfile);
      finalProfile = { id: authUser.uid, ...freshProfile };
    }
    
    login(finalProfile as any);
    toast.success(`Welcome back, ${finalProfile.name}.`, { icon: '✨' });
    navigate(finalProfile.role === 'admin' ? '/admin.evia.3321' : '/');
  };

  const handleAuthError = (err: any) => {
    console.error("Authentication error protocol:", err);
    const errCode = err.code || '';
    const errMessage = err.message || '';
    
    if (errCode === 'auth/popup-blocked') {
      setSsoError('popup-blocked');
      toast.error('The pop-up window was blocked. Trying to sign in with redirect might work better.');
    } else if (errCode === 'auth/operation-not-allowed' && errMessage.includes('SMS')) {
      setSsoError('sms-region-blocked');
      setShowHelper(true);
      toast.error('SMS Region Blocked: Please enable your country (India) in Firebase Console > Authentication > Settings > SMS Region Policy.', { duration: 15000 });
    } else if (errCode === 'auth/billing-not-enabled' || (errMessage && errMessage.includes('billing-not-enabled'))) {
      setSsoError('billing-not-enabled');
      setShowHelper(true);
      toast.error('SMS services require billing enabled on your Firebase project (Blaze Plan).', { duration: 15000 });
    } else if (
      errCode === 'auth/unauthorized-domain' || 
      errCode === 'auth/unauthorized-client' ||
      errCode === 'auth/app-not-authorized' ||
      errMessage.includes('unauthorized-domain') || 
      errMessage.includes('unauthorized_client') ||
      errMessage.includes('unauthorized_domain') ||
      errMessage.includes('app-not-authorized')
    ) {
      setSsoError('unauthorized-domain');
      setShowHelper(true);
      toast.error(`Domain Authorization Required. Add ${window.location.hostname} to your Firebase authorized domains list.`, { duration: 12000 });
    } else {
      setSsoError(errCode || errMessage || 'Authentication failed');
      setShowHelper(true);
      toast.error(errMessage || 'Error occurred during Authentication sequence.');
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

      <div id="recaptcha-container" className="fixed bottom-4 right-4 z-[9999]"></div>

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
              key={view}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
            {/* Entry Portal */}
            <div className="space-y-8">
              {view === 'portal' && (
                <div className="space-y-8 py-2">
                  <div className="text-center space-y-3 mb-6">
                    <div className="w-16 h-16 bg-[#A38A5F]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#A38A5F]/20">
                      <ShieldCheck size={28} className="text-[#A38A5F]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A38A5F]">Passport Identity Check</p>
                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">{`Specify email to continue via Google`}</p>
                  </div>

                  <div className="space-y-5">
                    {/* Optional Name for first-time profile creation hint */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A38A5F] ml-1 opacity-70">Identity Name (New Accounts)</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full h-15 px-6 border rounded-2.5xl text-[11px] font-bold tracking-[0.1em] outline-none transition-all ${
                          isDark ? 'bg-black/40 border-white/5 text-white focus:border-[#A38A5F]' : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-[#A38A5F]'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A38A5F] ml-1 opacity-70">Email Coordinates</label>
                      <input
                        type="email"
                        required
                        placeholder="your.email@address.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full h-15 px-6 border rounded-2.5xl text-[11px] font-bold tracking-[0.1em] outline-none transition-all font-mono ${
                          isDark ? 'bg-black/40 border-white/5 text-white focus:border-[#A38A5F]' : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-[#A38A5F]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-1 select-none">
                      <label className="flex items-center gap-2 cursor-pointer text-stone-400 hover:text-[#A38A5F] transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-stone-300 text-[#A38A5F] focus:ring-[#A38A5F] accent-[#A38A5F]"
                        />
                        <span>Remember Identity</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGoogleAuth('popup')}
                      disabled={loading}
                      className="w-full h-18 bg-[#ff4b2b] hover:bg-[#ff3b1b] text-white font-black rounded-3xl shadow-[0_20px_40px_-5px_rgba(255,75,43,0.2)] transition-all flex items-center justify-center gap-4 uppercase text-[11px] tracking-[0.3em] cursor-pointer group active:scale-[0.98] mt-4"
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
                  </div>
                </div>
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
