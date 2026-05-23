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
  Sparkles,
  ShoppingBag,
  Award,
  Truck,
  Sun,
  Moon,
  LogOut,
  Chrome,
  ShieldCheck,
  Check,
  Heart,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login, logout } = useAppContext();
  const navigate = useNavigate();

  // Color scheme theme toggle: Atelier Cream Light / Charcoal Dark
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('luxury_auth_theme') === 'dark';
  });

  // Current view: 'login' | 'signup' | 'forgot'
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Custom states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rotating brand pillars for luxury sidebar
  const [activeSlide, setActiveSlide] = useState(0);
  const brandPillars = [
    {
      icon: <Sparkles className="h-5 w-5 text-[#A38A5F]" />,
      title: "Curation & Provenance",
      desc: "Every exceptional garment in our catalog undergoes rigorous evaluation, detailing, and certification parameters."
    },
    {
      icon: <ShoppingBag className="h-5 w-5 text-[#A38A5F]" />,
      title: "Discerning Surplus",
      desc: "Acquire historically relevant cold-weather layering pieces and tactical menswear curated for the collector."
    },
    {
      icon: <Truck className="h-5 w-5 text-[#A38A5F]" />,
      title: "Carbon-Neutral Delivery",
      desc: "Insured courier shipping, elegantly packed in our signature heavy-gauge organic canvas presentation sacks."
    }
  ];

  // Rotate brand slides
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % brandPillars.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  // Set page theme effects
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Load remembered inputs
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

  // Helper: Log login event tracking internally 
  const trackLoginFirestore = async (userId: string, email: string, name: string) => {
    try {
      const loginLogRef = doc(db, 'users', userId);
      await updateDoc(loginLogRef, {
        lastLoginAt: Date.now()
      });
    } catch (e) {
      // Gracefully handle if users schema has custom permissions or is a brand new user
      console.warn("Audit update registered:", e);
    }
  };

  // Firebase Google Single-Sign-On Entry Point
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
      const nameVal = authUser.displayName || 'Distinguished Guest';
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
      toast.success(`Welcome, ${finalProfile.name}. Authentication verified.`, { icon: '✨' });
      navigate('/');
    } catch (err: any) {
      console.error("SSO Connection Attempt Blocked:", err);
      if (err.code === 'auth/popup-blocked') {
        toast.error('The security browser popup was blocked. Please enable popups or tap "Open in New Tab" in the top bar to sign in.');
      } else {
        toast.error(err.message || 'Error occurred during Google Single Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login Submission 
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please specify both registered credentials.');
      return;
    }

    setLoading(true);
    try {
      // Remember me logic
      if (rememberMe) {
        localStorage.setItem('evia_remember_email', email);
      } else {
        localStorage.removeItem('evia_remember_email');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;

      // Sync Firestore profile
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let syncProfile;
      if (userDocSnap.exists()) {
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
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
          lastLoginAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(userDocRef, defaultProfile);
        syncProfile = { id: authUser.uid, ...defaultProfile };
      }

      login(syncProfile as any);
      await trackLoginFirestore(authUser.uid, email, syncProfile.name);
      
      toast.success(`Access authorized. Welcome back, ${syncProfile.name}!`);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        toast.error('Invalid catalog credentials. Please check your spelling and password match.');
      } else {
        toast.error(err.message || 'Signature match verify sequence failed. Check login inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Signup Submission
  const handleEmailSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please fill in your authentic full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('A clean, valid email container is requested.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Passkey must register a baseline of at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password strings must align strictly.');
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

      // Set inside Firestore collection 'users'
      await setDoc(doc(db, 'users', authUser.uid), profilePayload);

      // Create local context session state
      login({ id: authUser.uid, ...profilePayload } as any);
      
      toast.success('Registry initialized successfully. Your collector portfolio is activated!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email holds an existing collector registration. Try logging in.');
      } else {
        toast.error(err.message || 'Registration failure. Validate server link context.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Trigger
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please submit a verified email format.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Provenance reset transmission delivered to your email inbox.', { duration: 6000 });
      setView('login');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Password request rejected.');
    } finally {
      setLoading(false);
    }
  };

  // Instant Sign out helper if verified
  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success('Cabinet session successfully terminated.');
    } catch (err) {
      toast.error('Failed to log out.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row overflow-hidden transition-colors duration-500 font-sans ${
      isDark ? 'bg-[#151412] text-[#F5F2EC]' : 'bg-[#FAF8F5] text-[#2E2C28]'
    }`}>
      
      {/* Aesthetic Top Fixed Row with Theme & Back Hooks */}
      <div className="absolute top-6 left-6 right-6 z-40 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className={`h-9 px-4 rounded-full flex items-center gap-2 border text-xs font-medium uppercase tracking-widest transition-all hover:scale-105 cursor-pointer ${
            isDark 
              ? 'bg-[#1F1D19] border-[#2C2925] text-[#FAF8F5] hover:bg-[#2C2925]' 
              : 'bg-white border-[#E6DEC9] text-[#2E2C28] hover:bg-[#FAF8F5] shadow-xs'
          }`}
        >
          <ArrowLeft size={13} className="text-[#A38A5F]" />
          <span>Surplus Catalog</span>
        </button>

        <button
          onClick={toggleTheme}
          className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark 
              ? 'bg-[#1F1D19] border-[#2C2925] text-amber-400 hover:text-amber-300' 
              : 'bg-white border-[#E6DEC9] text-[#2D2A26] hover:text-[#2E2C28] shadow-xs'
          }`}
          title="Toggle Layout Hue"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* LEFT COLUMN: RETRO EDITORIAL PROVENANCE SLIDESHOW */}
      <div className={`hidden lg:flex lg:w-[44%] relative flex-col justify-between p-16 border-r transition-all duration-500 ${
        isDark ? 'bg-[#1E1B17] border-[#2C2925]' : 'bg-[#FAF5ED] border-[#E8DFCE]'
      }`}>
        {/* Visual Premium Grid BG overlay */}
        <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none opacity-[0.35]`} 
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #A38A5F 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF5ED]/30 to-transparent pointer-events-none" />

        {/* Minimal branding */}
        <div className="relative z-10 text-left">
          <Link to="/" className="font-serif text-3xl font-bold tracking-tight inline-flex items-center gap-1 focus:outline-none hover:opacity-85 transition-opacity">
            evia<span className="text-[#A38A5F]">.</span>surplus
          </Link>
          <p className="text-[9.5px] uppercase tracking-[0.3em] text-[#A38A5F] font-bold mt-1">ATELIER ESTABLISHED 2026</p>
        </div>

        {/* Brand Slideshow */}
        <div className="relative z-10 max-w-sm my-auto space-y-8">
          <span className="text-[10px] uppercase tracking-[0.25em] font-black text-[#A38A5F] bg-[#A38A5F]/10 px-3 py-1 rounded-full">
            Archive Authenticity
          </span>
          
          <div className="h-44 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="space-y-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${
                    isDark ? 'bg-[#292520] border-[#3B352E]' : 'bg-white border-[#E8DFCE]'
                  }`}>
                    {brandPillars[activeSlide].icon}
                  </div>
                  <h3 className="font-serif text-xl font-bold tracking-normal">
                    {brandPillars[activeSlide].title}
                  </h3>
                </div>
                <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-[#C9C3B8]' : 'text-[#615C54]'}`}>
                  {brandPillars[activeSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Luxury slide dots */}
          <div className="flex gap-3 pt-2">
            {brandPillars.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx 
                    ? 'w-10 bg-[#A38A5F]' 
                    : 'w-2.5 bg-[#A38A5F]/20 hover:bg-[#A38A5F]/55'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Vintage military coordinates footer stamp */}
        <div className="relative z-10 text-[9px] uppercase tracking-widest text-[#A38A5F]/75 space-y-1 font-mono text-left">
          <p>© 2026 EVIA SURPLUS INC. ALL CONTRABAND SECURED.</p>
          <p>EST: 45.4215° N, 75.6972° W · QUALITY INSURED IN CANADA</p>
        </div>
      </div>

      {/* RIGHT COLUMN: HIGH-POLITURE ATELIER LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-28 lg:px-20 relative">
        {/* Graphic grid backlines */}
        <div className="absolute inset-0 bg-[radial-gradient(#A38A5F_0.8px,transparent_0.8px)] [background-size:24px_24px] pointer-events-none opacity-[0.04]" />

        {/* Dynamic State: Authenticated Session Showcase instead of empty UI */}
        {user ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-8 rounded-3xl border text-center relative z-10 transition-all ${
              isDark 
                ? 'bg-[#1E1B17] border-[#2C2925] shadow-2xl shadow-black/40' 
                : 'bg-white border-[#E8DFCE] shadow-[0_25px_60px_-15px_rgba(163,138,95,0.12)]'
            }`}
          >
            <div className="mx-auto w-20 h-20 rounded-2xl bg-[#FAF5ED] border-2 border-[#E6DEC9] dark:bg-[#292520] dark:border-[#3B352E] flex items-center justify-center relative mb-5">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <UserIcon size={32} className="text-[#A38A5F]" />
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1E1B17]">
                <ShieldCheck size={14} />
              </div>
            </div>

            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#A38A5F] block mb-1">Active Portfolio Session</span>
            <h2 className="font-serif text-2xl font-bold mb-1">{user.fullName || user.name || 'Collector Guest'}</h2>
            <p className="text-xs font-mono text-[#A38A5F] mb-6">{user.email?.toLowerCase()}</p>

            <div className="space-y-3.5">
              <button 
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <span>Continue Shopping Surplus</span>
                <ArrowRight size={13} />
              </button>

              <button 
                onClick={handleLogout}
                className={`w-full py-3.5 rounded-xl text-xs uppercase tracking-widest font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  isDark 
                    ? 'border-[#2C2925] text-red-400 hover:bg-[#2C2925]/30' 
                    : 'border-red-100 text-red-650 bg-red-50/20 hover:bg-red-50 hover:border-red-200'
                }`}
              >
                <LogOut size={13} />
                <span>Sign Out Account</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full max-w-md z-10">
            {/* Header branding on mobile view */}
            <div className="lg:hidden text-center mb-8">
              <span className="font-serif text-3xl font-black tracking-tight text-[#2E2C28] dark:text-[#FAF8F5]">
                evia<span className="text-[#A38A5F]">.</span>surplus
              </span>
              <p className="text-[9.5px] uppercase tracking-[0.25em] text-[#A38A5F] font-bold mt-1">Provenance & Atelier Grade</p>
            </div>

            {/* Central Glassmorphic Portal Box */}
            <div className={`p-8 rounded-[2rem] border transition-all ${
              isDark 
                ? 'bg-[#1E1B17]/95 border-[#2C2925] shadow-2xl shadow-black/50' 
                : 'bg-white/95 border-[#EAE3D5] shadow-[0_20px_55px_-12px_rgba(163,138,95,0.18)]'
            }`}>
              
              {/* Form Title & Context Switcher instructions */}
              <div className="mb-6 text-center">
                <h2 className="font-serif text-2xl font-bold tracking-tight">
                  {view === 'login' && "Sign In Portal"}
                  {view === 'signup' && "Register Portfolio"}
                  {view === 'forgot' && "Vault Reset Access"}
                </h2>
                <p className="text-xs text-[#A38A5F] mt-1.5 font-light leading-relaxed">
                  {view === 'login' && "Enter your signature credentials for secure warehouse checkout."}
                  {view === 'signup' && "Initialize a new surplus portfolio with certified provenance archiving."}
                  {view === 'forgot' && "Provide your email coordinates to deploy a secure key-reset pipeline."}
                </p>
              </div>

              {/* QUICK GMAIL SSO LINK (Disabled during Forgot pass view to maintain clear UX) */}
              {view !== 'forgot' && (
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className={`w-full h-11 flex items-center justify-center gap-3 border text-xs font-bold uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-3xs ${
                      isDark 
                        ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] hover:bg-[#201E1A]' 
                        : 'bg-white border-[#E8DFCE] text-[#2E2C28] hover:bg-[#FAF8F5] hover:border-[#BEAA84]'
                    }`}
                  >
                    <Chrome size={15} className="text-red-500" />
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex py-4 items-center">
                    <div className={`flex-grow border-t ${isDark ? 'border-[#2C2925]' : 'border-[#E6DEC9]'}`}></div>
                    <span className="flex-shrink mx-3 text-[9px] uppercase tracking-[0.2em] text-[#A38A5F] font-bold">
                      Or standard registry
                    </span>
                    <div className={`flex-grow border-t ${isDark ? 'border-[#2C2925]' : 'border-[#E6DEC9]'}`}></div>
                  </div>
                </div>
              )}

              {/* REAL EMAIL/PASSWORD LOGIN PANEL */}
              {view === 'login' && (
                <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Email Coordinates</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type="email"
                        required
                        placeholder="collector@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs font-mono outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block">Security Passphrase</label>
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')} 
                        className="text-[9px] uppercase tracking-wider text-[#A38A5F] hover:underline font-bold transition-all cursor-pointer"
                      >
                        Reset passkey?
                      </button>
                    </div>
                    
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-9 pr-10 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F] hover:text-[#2E2C28] dark:hover:text-[#FAF8F5] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* REMEMBER ME & CONTROLS */}
                  <div className="flex items-center justify-between py-1 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#E8DFCE] text-[#A38A5F] focus:ring-[#A38A5F]"
                      />
                      <span className="text-[10px] uppercase tracking-wider text-[#A38A5F] font-bold">Remember parameters</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 cursor-pointer shadow-md shadow-[#A38A5F]/10"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Secure Entrance Sign-In</span>
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-[#A38A5F]/85 pt-3">
                    Don&apos;t have a portfolio yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setView('signup'); setPassword(''); setConfirmPassword(''); }}
                      className="font-bold underline text-[#2E2C28] dark:text-[#FAF8F5] hover:text-[#A38A5F] cursor-pointer"
                    >
                      Initialize registry
                    </button>
                  </p>
                </form>
              )}

              {/* REAL EMAIL/PASSWORD SIGNUP PANEL */}
              {view === 'signup' && (
                <form onSubmit={handleEmailSignupSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Authentic Full Name</label>
                    <div className="relative">
                      <UserIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Email Container Address</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type="email"
                        required
                        placeholder="collector@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs font-mono outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Secure Registry Password</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-9 pr-10 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F] hover:text-[#2E2C28] dark:hover:text-[#FAF8F5] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1">Confirm Security Password</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-9 pr-10 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F] hover:text-[#2E2C28] dark:hover:text-[#FAF8F5] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 cursor-pointer shadow-md shadow-[#A38A5F]/10"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Registry Initialization</span>
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-[#A38A5F]/85 pt-3">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="font-bold underline text-[#2E2C28] dark:text-[#FAF8F5] hover:text-[#A38A5F] cursor-pointer"
                    >
                      Sign in portal
                    </button>
                  </p>
                </form>
              )}

              {/* PASSWORD FORGOT TRANSIT FORM */}
              {view === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left font-mono">
                    <label className="text-[9.5px] uppercase tracking-wider text-[#A38A5F] font-bold block ml-1 font-sans">Account Email Coordinates</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
                      <input
                        type="email"
                        required
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-9 pr-4 py-3 border rounded-xl text-xs outline-none focus:border-[#A38A5F] transition-all ${
                          isDark 
                            ? 'bg-[#151412] border-[#2C2925] text-[#FAF8F5] focus:bg-[#201E1A]' 
                            : 'bg-[#FAF8F5] border-[#E8DFCE] text-[#2E2C28] focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#A38A5F] hover:bg-[#8F764C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 cursor-pointer shadow-md shadow-[#A38A5F]/10"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Dispatch Passkey Reset</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-[9.5px] font-bold block mx-auto text-[#A38A5F] hover:text-[#2E2C28] dark:hover:text-[#FAF8F5] uppercase tracking-widest mt-3 transition-all cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
