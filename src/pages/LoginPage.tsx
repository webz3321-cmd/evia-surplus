import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppContext } from '../context';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, ShieldCheck, Check, MessageSquare, AlertCircle, RefreshCw, Smartphone, Key, Inbox, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  // Navigation tabs
  const [authType, setAuthType] = useState<'email' | 'otp' | 'gmail_otp'>('email');
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP state machine
  const [otpStep, setOtpStep] = useState<'phone' | 'email_input' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Simulated Google Identity states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleSelectedEmail, setGoogleSelectedEmail] = useState('');
  const [googleStep, setGoogleStep] = useState<'select' | 'input_name'>('select');

  // References
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login } = useAppContext();

  // Reset states when changing authType
  const handleAuthTypeChange = (type: 'email' | 'otp' | 'gmail_otp') => {
    setAuthType(type);
    setOtpCode(Array(6).fill(''));
    setShowNotification(false);
    setGeneratedOtp('');
    if (type === 'email') {
      setOtpStep('phone');
    } else if (type === 'otp') {
      setOtpStep('phone');
    } else if (type === 'gmail_otp') {
      setOtpStep('email_input');
    }
  };

  // Handle Resend Resets
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep === 'code' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, timer]);

  // Google OAuth triggered flow - prompts Gmail OTP security
  const triggerGoogleLogin = () => {
    setGoogleStep('select');
    setShowGoogleModal(true);
    setName('');
  };

  const handleSelectGoogleAccount = async (selectedGmail: string) => {
    setGoogleSelectedEmail(selectedGmail);
    setEmail(selectedGmail);
    
    // Check if user is signing up (needs a name) or exists
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', selectedGmail.toLowerCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // User exists, move straight to OTP dispatch
        setName(snap.docs[0].data().name || '');
        dispatchGoogleOtp(selectedGmail);
      } else {
        // User does not exist, ask for their full name to complete Google Account Sign Up
        setGoogleStep('input_name');
        setLoading(false);
      }
    } catch (err: any) {
      toast.error('Google profile connection failed. Proceeding manually.');
      setLoading(false);
    }
  };

  const handleGoogleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name to link your Google profile.');
      return;
    }
    dispatchGoogleOtp(googleSelectedEmail);
  };

  const dispatchGoogleOtp = async (targetEmail: string) => {
    setLoading(true);
    setShowGoogleModal(false);

    try {
      // Generate secure 6-digit passcode for immediate sandbox client entry
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setTimer(60);
      
      // Simulate real network delivery
      await new Promise(resolve => setTimeout(resolve, 800));
      
      handleAuthTypeChange('gmail_otp');
      setOtpStep('code');
      setShowNotification(true);
      toast.success(`Google Account connected! Verification OTP dispatched to ${targetEmail}`);
      
      // Auto close popups
      setTimeout(() => {
        setShowNotification(false);
      }, 18000);
    } catch (err: any) {
      toast.error('Error generating Google OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  // Actions for Phone Number Entry & SMS flow
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Simulate/Generate a secure 6-digit OTP code for instant client-side sandbox usage
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setTimer(60);
      
      // Simulate delivery latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setOtpStep('code');
      setShowNotification(true);
      toast.success('Verification code dispatched successfully!');

      // Automatically hide simulated notification banner after 15 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 15000);
    } catch (err: any) {
      toast.error(err.message || 'Error executing phone OTP request.');
    } finally {
      setLoading(false);
    }
  };

  // Actions for Gmail OTP delivery flow
  const handleSendGmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid Gmail address');
      return;
    }

    setLoading(true);

    try {
      // Simulate/Generate a secure 6-digit OTP code for instant client-side mailbox usage
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setTimer(60);
      
      // Simulate delivery latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setOtpStep('code');
      setShowNotification(true);
      toast.success('Gmail security passcode sent!');

      // Automatically hide simulated notification banner after 15 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 15000);
    } catch (err: any) {
      toast.error(err.message || 'Error executing Gmail OTP request.');
    } finally {
      setLoading(false);
    }
  };

  // OTP inputs auto-focus handlers
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // OTP Code Submission Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpCode.join('');
    if (entered.length < 6) {
      toast.error('Please fill all 6 numbers');
      return;
    }

    if (entered !== generatedOtp) {
      toast.error('The verification code entered is incorrect');
      return;
    }

    setLoading(true);
    try {
      let loggedUser;
      
      if (authType === 'otp') {
        const q = query(collection(db, 'users'), where('phone', '==', phone));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          const data = userDoc.data();
          loggedUser = {
            id: userDoc.id,
            name: data.name,
            email: data.email || `${phone}@evia.com`,
            phone: phone,
            role: data.role || 'user'
          };
        } else {
          const generatedId = 'user_otp_' + Math.random().toString(36).substring(2, 9);
          const newUserProfile = {
            name: name || `Guest (${phone.slice(-4)})`,
            email: `${phone}@evia.com`,
            phone: phone,
            role: 'user',
            createdAt: Date.now()
          };
          await setDoc(doc(db, 'users', generatedId), newUserProfile);
          loggedUser = { id: generatedId, ...newUserProfile };
        }
      } else {
        // gmail_otp flow - match or query user in Firestore by email address
        const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          const data = userDoc.data();
          loggedUser = {
            id: userDoc.id,
            name: data.name,
            email: data.email,
            phone: data.phone || phone || '',
            role: data.role || 'user'
          };
        } else {
          const generatedId = 'user_gmail_otp_' + Math.random().toString(36).substring(2, 9);
          const newUserProfile = {
            name: name || `Guest (${email.split('@')[0]})`,
            email: email.toLowerCase().trim(),
            phone: phone || '',
            role: 'user',
            createdAt: Date.now()
          };
          await setDoc(doc(db, 'users', generatedId), newUserProfile);
          loggedUser = { id: generatedId, ...newUserProfile };
        }
      }

      login(loggedUser as any);
      setShowNotification(false);
      toast.success('Successfully logged in via OTP!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed verification process');
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Form Submission Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (email === 'evia@admin.gmail.com' && password === 'admin123') {
        login({ id: 'admin-id', name: 'Admin Staff', email: email, role: 'admin' } as any);
        toast.success('Welcome back, Admin!');
        navigate('/admin');
        return;
      }

      let userCred;
      if (tab === 'login') {
        userCred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        if (userDoc.exists()) {
          const u = userDoc.data();
          login({ id: userCred.user.uid, name: u.name, email: u.email, role: u.role || 'user', phone: u.phone, address: u.address } as any);
        } else {
          login({ id: userCred.user.uid, name: email, email: email, role: 'user' } as any);
        }
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name, phone, email, role: 'user', createdAt: Date.now()
        });
        login({ id: userCred.user.uid, name, email: email, role: 'user', phone } as any);
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const useDemoConfig = () => {
    handleAuthTypeChange('email');
    setEmail('evia@admin.gmail.com');
    setPassword('admin123');
    setTab('login');
    toast.success('Admin credentials loaded');
  };

  return (
    <div className="relative min-h-[90vh] bg-background flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 overflow-hidden select-none">
      
      {/* GOOGLE ACCOUNTS AUTHENTICATOR OVERLAY (EMULATION GATEWAY) */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm bg-background border border-border rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-border/80 text-center relative">
                <button 
                  onClick={() => setShowGoogleModal(false)}
                  className="absolute right-5 top-5 text-muted-foreground hover:text-foreground transition-all text-sm p-1"
                >
                  ✕
                </button>
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-foreground">
                    <Chrome size={20} className="text-red-500" />
                  </div>
                </div>
                <h3 className="font-display text-xl text-foreground font-semibold">Sign in with Google</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">To continue to Evia Studio</p>
              </div>

              {/* Body */}
              <div className="p-6">
                {googleStep === 'select' ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground font-light text-center mb-4">
                      Select any account to retrieve from Google credentials directory:
                    </p>
                    
                    {[
                      { name: 'webz3321@gmail.com', desc: 'Active Workspace Profile' },
                      { name: 'guest.evia@gmail.com', desc: 'Serene Collector' },
                    ].map((acc) => (
                      <button
                        key={acc.name}
                        onClick={() => handleSelectGoogleAccount(acc.name)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface hover:bg-secondary border border-border/60 hover:border-foreground/45 transition-all text-left group"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{acc.name}</p>
                          <p className="text-[9px] text-muted-foreground font-light">{acc.desc}</p>
                        </div>
                        <ArrowRight size={13} className="text-muted-foreground group-hover:text-foreground transition-all" />
                      </button>
                    ))}

                    <div className="pt-2">
                      <div className="relative flex py-3 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-3 text-[9px] text-muted-foreground uppercase tracking-wider">or sign in as another</span>
                        <div className="flex-grow border-t border-border"></div>
                      </div>
                      
                      <input
                        type="email"
                        placeholder="Enter another gmail address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                      />
                      <button
                        onClick={() => {
                          if (!email || !email.includes('@')) {
                            toast.error('Please enter a valid Gmail address');
                            return;
                          }
                          handleSelectGoogleAccount(email);
                        }}
                        className="w-full mt-2.5 bg-foreground text-background py-2.5 rounded-full text-[10px] uppercase tracking-widest font-semibold hover:opacity-90"
                      >
                        Link Custom Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleGoogleNameSubmit} className="space-y-4">
                    <p className="text-xs text-muted-foreground font-light text-center leading-relaxed">
                      This appears to be your first time visiting us via Google Account <strong className="text-foreground">{googleSelectedEmail}</strong>. Provide your name to construct your profile:
                    </p>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Your Full Name</label>
                      <div className="relative">
                        <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="Your real name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground py-3 rounded-full text-[10px] uppercase tracking-widest font-bold tracking-wider hover:opacity-95"
                    >
                      Process Verification code →
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIMULATED PUSH NOTIFICATIONS */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 bg-black/92 text-white backdrop-blur-md px-4 py-4 rounded-2xl shadow-2xl border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className={`${authType === 'gmail_otp' ? 'bg-red-500' : 'bg-purple-600'} rounded-full p-2 shrink-0`}>
                {authType === 'gmail_otp' ? (
                  <Inbox className="h-4 w-4 text-white" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                    {authType === 'gmail_otp' ? 'GMAIL • NOW' : 'MESSAGES • NOW'}
                  </span>
                  <button 
                    onClick={() => setShowNotification(false)}
                    className="text-muted-foreground hover:text-white transition-colors text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="font-semibold text-xs text-white mt-1">
                  {authType === 'gmail_otp' ? 'Evia Security Team' : 'evia.studio'}
                </h4>
                <p className="text-[11px] text-zinc-300 font-light mt-0.5 leading-snug">
                  {authType === 'gmail_otp' ? (
                    <>
                      Your secure Google verification passcode is <strong className="text-red-300 tracking-wider font-mono text-xs">{generatedOtp}</strong>. Complete your login validation within 5 minutes.
                    </>
                  ) : (
                    <>
                      Your verification state code is <strong className="text-purple-300 tracking-wider font-mono text-xs">{generatedOtp}</strong>. Do not hand this code to anyone.
                    </>
                  )}
                </p>
                <button 
                  onClick={() => {
                    const parsedOtp = generatedOtp.split('');
                    setOtpCode(parsedOtp);
                    toast.success('Verification code auto-filled!');
                    setShowNotification(false);
                  }}
                  className="mt-2 text-[9px] font-semibold text-accent uppercase tracking-widest hover:underline hover:opacity-90 transition-all block"
                >
                  Auto-fill code verification →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-md"
      >
        {/* Editorial Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-4xl tracking-tight text-foreground hover:opacity-90 transition-opacity justify-center inline-flex items-center">
            evia<span className="text-accent">.</span>
          </Link>
          <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            The quiet sanctuary for things worth keeping
          </p>
        </div>

        {/* Auth Method Selector Toggle */}
        <div className="flex justify-center mb-6 bg-surface p-1 rounded-full border border-border/85 mx-auto max-w-[340px]">
          <button
            onClick={() => handleAuthTypeChange('email')}
            className={`flex-1 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest transition-all ${
              authType === 'email'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email
          </button>
          
          <button
            onClick={() => handleAuthTypeChange('otp')}
            className={`flex-1 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest transition-all ${
              authType === 'otp'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Phone OTP
          </button>

          <button
            onClick={() => handleAuthTypeChange('gmail_otp')}
            className={`flex-1 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest transition-all ${
              authType === 'gmail_otp'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gmail OTP
          </button>
        </div>

        {/* Auth Panel Card CONTAINER */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          
          {/* BRANDED INTERACTIVE SOCIAL COMPONENT FOR GOOGLE */}
          {otpStep !== 'code' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={triggerGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-background border border-border hover:border-foreground/45 transition-all text-xs font-semibold uppercase tracking-wider text-foreground rounded-full shadow-sm hover:bg-secondary"
              >
                <Chrome size={15} className="text-red-500 shrink-0" />
                <span>Continue with Google Account</span>
              </button>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-3 text-[9px] text-muted-foreground uppercase tracking-widest">or carry out manual input</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {authType === 'email' ? (
              <motion.div
                key="email-block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Sub Tab Buttons for Email */}
                <div className="flex border-b border-border/60 mb-6">
                  <button
                    onClick={() => { setTab('login'); setPassword(''); }}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all ${
                      tab === 'login' 
                        ? 'border-foreground text-foreground' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setTab('signup'); setPassword(''); }}
                    className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all ${
                      tab === 'signup' 
                        ? 'border-foreground text-foreground' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {tab === 'signup' && (
                      <motion.div
                        key="fields-signup"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Full Name</label>
                          <div className="relative">
                            <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              required
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Phone Number</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="tel"
                              required
                              placeholder="+91 98765 43210"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Password</label>
                      {tab === 'login' && (
                        <button 
                          type="button" 
                          onClick={() => alert("Password recovery: please contact assistance at support@evia-studio.com")}
                          className="text-[9px] uppercase tracking-wider text-accent hover:underline underline-offset-2"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  {password.length > 0 && password.length < 6 && (
                    <p className="text-[9px] text-orange-600 font-medium tracking-wide flex items-center gap-1">
                      <AlertCircle size={10} /> Password should correspond to at least 6 characters
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (tab === 'signup' && (!name || !phone)) || !email || password.length < 6}
                    className="w-full mt-2 bg-primary hover:opacity-95 text-primary-foreground font-semibold py-3.5 px-6 rounded-full transition-opacity flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {tab === 'login' ? 'Confirm Sign In' : 'Create My Account'}
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : authType === 'otp' ? (
              <motion.div
                key="phone-otp-block"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl text-foreground">Phone Registration</h3>
                  <p className="text-[11px] text-muted-foreground font-light leading-relaxed mt-1">
                    Sign up or Log in immediately with your smartphone number via lightning fast OTP.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {otpStep === 'phone' ? (
                    <motion.form
                      key="send-phone-step"
                      onSubmit={handleSendPhoneOtp}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Enter Custom Name (Required first time)</label>
                        <div className="relative">
                          <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Your Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Smart Phone Number</label>
                        <div className="relative flex">
                          <span className="flex items-center justify-center bg-surface border border-r-0 border-border rounded-l-xl px-3 font-mono text-xs text-muted-foreground">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-4 pr-10 py-3 bg-surface border border-border rounded-r-xl text-xs outline-none focus:border-foreground focus:bg-background font-mono tracking-wider transition-all"
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground/80 font-light mt-1">
                          We will instantly transmit an authentication code for authorization.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || phone.length < 8}
                        className="w-full bg-primary hover:opacity-95 text-primary-foreground font-semibold py-3.5 px-6 rounded-full transition-opacity flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 shadow-sm"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Send Access Validation code
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="verify-phone-step"
                      onSubmit={handleVerifyOtp}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-5"
                    >
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground font-light text-center">
                          A code was delivered to <strong className="text-foreground tracking-wide font-mono">+91 {phone}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtpStep('phone')}
                          className="text-[10px] block mx-auto font-semibold text-accent uppercase tracking-wider hover:opacity-85 mt-1 underline underline-offset-2"
                        >
                          Modify Phone Number
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-foreground font-semibold block text-center">
                          Enter 6-digit verification code
                        </label>
                        
                        {/* 6 Grid layout split box for OTP verification */}
                        <div className="flex justify-center gap-2">
                          {otpCode.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpRefs.current[i] = el; }}
                              type="text"
                              maxLength={1}
                              pattern="[0-9]*"
                              inputMode="numeric"
                              required
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-12 h-14 bg-surface text-center font-mono text-xl border border-border rounded-xl focus:border-foreground focus:bg-background outline-none transition-all shadow-sm"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpCode.some(val => !val)}
                        className="w-full bg-primary hover:opacity-95 text-primary-foreground font-semibold py-3.5 px-6 rounded-full transition-opacity flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 shadow-sm"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Submit code & sign in
                            <Check size={13} />
                          </>
                        )}
                      </button>

                      {/* Resend mechanisms */}
                      <div className="text-center pt-2">
                        {timer > 0 ? (
                          <p className="text-[10px] text-muted-foreground font-light">
                            Resend code permitted in <span className="font-mono text-foreground font-medium">{timer} seconds</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                              setGeneratedOtp(newCode);
                              setTimer(60);
                              setShowNotification(true);
                              toast.success('New access verification code dispatched!');
                            }}
                            className="text-[10px] font-semibold text-foreground uppercase tracking-wider flex items-center justify-center gap-1 mx-auto hover:opacity-80 transition-all"
                          >
                            <RefreshCw size={11} className="mr-0.5" /> Dispatch verification code again
                          </button>
                        )}
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="gmail-otp-block"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl text-foreground">Gmail Custom OTP</h3>
                  <p className="text-[11px] text-muted-foreground font-light leading-relaxed mt-1">
                    Sign in securely by receiving a single-use verification passcode in your Gmail inbox instantly.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {otpStep === 'email_input' ? (
                    <motion.form
                      key="send-gmail-step"
                      onSubmit={handleSendGmailOtp}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Enter Custom Name (Required first time)</label>
                        <div className="relative">
                          <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Your Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Gmail Address</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="email"
                            required
                            placeholder="username@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-foreground focus:bg-background transition-all"
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground/80 font-light mt-1">
                          We will instantly route a secure authorization link and 6-digit security pin code to your mail.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !email || !email.includes('@')}
                        className="w-full bg-primary hover:opacity-95 text-primary-foreground font-semibold py-3.5 px-6 rounded-full transition-opacity flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 shadow-sm"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Generate Gmail validation code
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="verify-gmail-step"
                      onSubmit={handleVerifyOtp}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-5"
                    >
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground font-light text-center">
                          A custom passcode has been routed to your inbox at <strong className="text-foreground font-mono">{email}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtpStep('email_input')}
                          className="text-[10px] block mx-auto font-semibold text-accent uppercase tracking-wider hover:opacity-85 mt-1 underline underline-offset-2"
                        >
                          Modify Gmail Address
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-foreground font-semibold block text-center">
                          Enter 6-digit Gmail code
                        </label>
                        
                        {/* 6 Grid layout split box for OTP verification */}
                        <div className="flex justify-center gap-2">
                          {otpCode.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpRefs.current[i] = el; }}
                              type="text"
                              maxLength={1}
                              pattern="[0-9]*"
                              inputMode="numeric"
                              required
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-12 h-14 bg-surface text-center font-mono text-xl border border-border rounded-xl focus:border-foreground focus:bg-background outline-none transition-all shadow-sm"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpCode.some(val => !val)}
                        className="w-full bg-primary hover:opacity-95 text-primary-foreground font-semibold py-3.5 px-6 rounded-full transition-opacity flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50 shadow-sm"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Secure verification link
                            <Check size={13} />
                          </>
                        )}
                      </button>

                      {/* Resend mechanisms */}
                      <div className="text-center pt-2">
                        {timer > 0 ? (
                          <p className="text-[10px] text-muted-foreground font-light">
                            Resend code permitted in <span className="font-mono text-foreground font-medium">{timer} seconds</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                              setGeneratedOtp(newCode);
                              setTimer(60);
                              setShowNotification(true);
                              toast.success('Gmail verification passcode re-routed!');
                            }}
                            className="text-[10px] font-semibold text-foreground uppercase tracking-wider flex items-center justify-center gap-1 mx-auto hover:opacity-80 transition-all"
                          >
                            <RefreshCw size={11} className="mr-0.5" /> Re-route verification email
                          </button>
                        )}
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Elegant Demo / Admin Info Box */}
          {tab === 'login' && authType === 'email' && (
            <div className="mt-6 p-4 rounded-xl bg-muted border border-border text-left">
              <div className="flex items-center gap-2 text-foreground font-semibold text-[10px] uppercase tracking-wider">
                <ShieldCheck size={14} className="text-[#9333ea]" />
                <span>Demo Workspace Profile</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-light leading-normal">
                An administrator account is prepared to view inventory, orders, and studio statistics instantly.
              </p>
              <button
                type="button"
                onClick={useDemoConfig}
                className="mt-2 text-[9px] font-semibold text-[#9333ea] uppercase tracking-widest hover:underline hover:opacity-80 transition-all flex items-center gap-1"
              >
                Autofill administrative access →
              </button>
            </div>
          )}

          {/* Footnotes */}
          <div className="mt-6 text-center text-muted-foreground text-[10px] uppercase tracking-wider leading-relaxed border-t border-border pt-6">
            Protected by serene studio standard guards.<br />
            <span className="text-foreground font-medium underline underline-offset-2 hover:opacity-80 cursor-pointer">Terms of craft</span> · <span className="text-foreground font-medium underline underline-offset-2 hover:opacity-80 cursor-pointer">Privacy decree</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
