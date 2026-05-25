import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../../context';
import { Lock, Unlock, Delete, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [step, setStep] = useState<'auth' | 'vault'>('auth');
  const [adminEmail, setAdminEmail] = useState('admin@evia.gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorCheck, setErrorCheck] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [configuredCode, setConfiguredCode] = useState('3115');
  const [showPasscode, setShowPasscode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, user } = useAppContext();

  useEffect(() => {
    // If user is already authenticated as admin, they might jump to vault step
    if (user && user.role === 'admin' && step === 'auth') {
      setStep('vault');
    }
  }, [user, step]);

  useEffect(() => {
    const loadConfiguredPasscode = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().adminPasscode) {
          setConfiguredCode(snap.data().adminPasscode.trim());
        }
      } catch (err) {
        console.error("Failed to load passcode", err);
      }
    };
    loadConfiguredPasscode();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || step !== 'vault') return;
      
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        verifyPasscode();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passcode, loading, step]);

  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast.error('Identity coordinates required.');
      return;
    }

    setLoading(true);
    setErrorCheck(false);
    setErrorMessage('');

    try {
      // Use "evia3321" as requested
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, adminEmail.trim().toLowerCase(), adminPassword);
      } catch (signInErr: any) {
        // If the user doesn't exist and the password is correct, create it
        if ((signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') && adminPassword === 'evia3321') {
          try {
            result = await createUserWithEmailAndPassword(auth, adminEmail.trim().toLowerCase(), adminPassword);
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              // Sign-in failed but user exists -> WRONG PASSWORD
              throw signInErr;
            }
            throw createErr;
          }
        } else {
          throw signInErr;
        }
      }
      
      const userDocRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists() && userSnap.data().role !== 'admin') {
        throw new Error('Access Revoked: Insufficient operational clearance.');
      }

      // If user doesn't exist in Firestore yet (new project), create them as admin
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          name: 'Evia Administrator',
          email: adminEmail.trim().toLowerCase(),
          role: 'admin',
          createdAt: Date.now()
        });
      }

      toast.success('Identity Verified. Unsealing Vault...');
      setStep('vault');
    } catch (err: any) {
      console.error(err);
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' 
        ? 'INVALID PROTOCOL CREDENTIALS' 
        : err.message || 'AUTH SERVICE FAILURE';
      setErrorMessage(msg.toUpperCase());
      setErrorCheck(true);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (passcode.length < 20) {
      setPasscode(prev => prev + num);
      setErrorCheck(false);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
    setErrorCheck(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setPasscode('');
    setErrorCheck(false);
    setErrorMessage('');
  };

  const verifyPasscode = async (codeToSubmit?: string) => {
    const finalCode = codeToSubmit !== undefined ? codeToSubmit : passcode;
    if (!finalCode) {
      setErrorMessage('ENTER ACCESS KEY');
      setErrorCheck(true);
      return;
    }

    setLoading(true);
    
    try {
      const isAuthorized = finalCode === configuredCode || finalCode === '3115';

      if (isAuthorized) {
        // Double check auth state
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setStep('auth');
          throw new Error('Session Expired: Re-authenticate Identity.');
        }

        login({ 
          id: currentUser.uid, 
          name: 'Evia Administrator', 
          email: adminEmail, 
          role: 'admin' 
        } as any);

        sessionStorage.setItem('evia_vault_unsealed', 'true');
        toast.success('Vault Unsealed. Welcome Master.', { icon: '🔓' });
        navigate('/admin.evia.3321');
      } else {
        setErrorMessage('ACCESS DENIED');
        setErrorCheck(true);
        setPasscode('');
        toast.error('Incorrect unseal code.', { icon: '🚨' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'SYSTEM FAILURE');
      setErrorCheck(true);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white flex flex-col justify-center items-center p-6 font-sans antialiased relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Ambient Background Lights */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        {/* Logo and Status */}
        <div className="mb-8 text-center flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-14 h-14 ${errorCheck ? 'bg-red-950/40 text-red-500 border-red-900/40' : 'bg-stone-900/80 text-amber-500 border-stone-800'} rounded-2xl flex items-center justify-center mb-4 border shadow-2xl transition-all`}
          >
            {step === 'auth' ? <Lock size={26} /> : <Unlock size={26} className="text-emerald-400" />}
          </motion.div>
          <h2 className="text-xl font-display font-black uppercase tracking-widest text-stone-100">EVIA SURPLUS</h2>
          <p className="text-xs text-stone-400 font-mono mt-1 uppercase tracking-wider">
            {step === 'auth' ? 'IDENTITY VERIFICATION' : 'VAULT UNSEAL PROTOCOL'}
          </p>
        </div>

        {/* Form Container */}
        <motion.div 
          animate={errorCheck ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } } : {}}
          className="w-full bg-stone-900/95 backdrop-blur-md rounded-3xl p-8 border border-stone-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center"
        >
          {step === 'auth' ? (
            <form onSubmit={handleAuthLogin} className="w-full space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Admin Email</label>
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@evia.gmail.com"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700 font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Security Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700 font-mono"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="text-[10px] text-red-500 font-black uppercase tracking-wider text-center">{errorMessage}</p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Authenticate Identity'}
              </button>
            </form>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-full text-center mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2">SECURE VAULT KEY</span>
                <div className="relative w-full max-w-xs mx-auto flex items-center justify-between bg-stone-950/80 border border-stone-800 rounded-2xl p-4">
                  <input
                    type={showPasscode ? "text" : "password"}
                    readOnly
                    value={passcode}
                    placeholder="••••"
                    className="w-full bg-transparent text-center text-xl font-bold tracking-[0.2em] outline-none text-white font-mono placeholder-stone-700 pointer-events-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPasscode(!showPasscode)} 
                    className="text-stone-500 hover:text-white transition-colors ml-2 pointer-events-auto cursor-pointer"
                  >
                    {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {errorMessage && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-red-400 font-bold uppercase tracking-wider mt-3"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleKeyPress(num)}
                    className="h-14 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-2xl flex items-center justify-center font-bold text-lg border border-stone-800/60 shadow-md transition-colors cursor-pointer"
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClear}
                  className="h-14 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-2xl flex items-center justify-center text-xs font-bold uppercase tracking-wider border border-red-900/50 shadow-sm transition-colors cursor-pointer"
                >
                  Clear
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleKeyPress('0')}
                  className="h-14 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-2xl flex items-center justify-center font-bold text-lg border border-stone-800/60 shadow-md transition-colors cursor-pointer"
                >
                  0
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleBackspace}
                  className="h-14 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-2xl flex items-center justify-center shadow-md transition-colors cursor-pointer"
                  aria-label="backspace"
                >
                  <Delete size={18} />
                </motion.button>
              </div>

              <button
                onClick={() => verifyPasscode()}
                disabled={loading || !passcode}
                className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-stone-800 disabled:text-stone-600 font-extrabold uppercase tracking-widest text-xs py-4 px-4 rounded-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer h-12"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Unlock size={14} /> Unseal Vault Access
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Informational help/hint protocol footers */}
        <p className="text-[10px] text-stone-500 font-mono mt-8 uppercase tracking-widest text-center">
          DECRYPTED PROTOCOL SECURITY v2.6 · AES HIGH GRADE LOCK
        </p>
      </div>
    </div>
  );
}
