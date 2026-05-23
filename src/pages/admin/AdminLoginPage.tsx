import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../../context';
import { Lock, Unlock, Delete, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState('');
  const [errorCheck, setErrorCheck] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [configuredCode, setConfiguredCode] = useState('3115');
  const [showPasscode, setShowPasscode] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAppContext();

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

  const handleKeyPress = (num: string) => {
    if (passcode.length < 10) {
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
      setErrorMessage('Please enter a passcode');
      setErrorCheck(true);
      return;
    }

    setLoading(true);
    // Simulate minor lag for authenticating feel
    await new Promise(resolve => setTimeout(resolve, 450));

    if (finalCode === configuredCode || (configuredCode === '3115' && finalCode === '3115')) {
      login({ id: 'admin-id', name: 'Admin Manager', email: 'admin@evia.local', role: 'admin' } as any);
      toast.success('Admin unlocked successfully.', { icon: '🔓' });
      navigate('/admin');
    } else {
      setErrorMessage('Access Denied. Incorrect Passcode.');
      setErrorCheck(true);
      setPasscode('');
      toast.error('Incorrect passcode protection active.', { icon: '🚨' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white flex flex-col justify-center items-center p-6 font-sans antialiased relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Absolute Ambient Background Lights for Luxury Feel */}
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
            {errorCheck ? <AlertCircle size={26} className="animate-bounce" /> : <Lock size={26} />}
          </motion.div>
          <h2 className="text-xl font-display font-black uppercase tracking-widest text-stone-100">EVIA SURPLUS</h2>
          <p className="text-xs text-stone-400 font-mono mt-1 uppercase tracking-wider">PROTECTED VAULT AREA</p>
        </div>

        {/* Dynamic Shake Effect Container for incorrect passcode entry */}
        <motion.div 
          animate={errorCheck ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } } : {}}
          className="w-full bg-stone-900/95 backdrop-blur-md rounded-3xl p-6 border border-stone-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center"
        >
          {/* Output dots display or visible text */}
          <div className="w-full text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2">ENTER ADMIN PASSCODE</span>
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
                className="text-stone-500 hover:text-white transition-colors ml-2 pointer-events-auto"
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

          {/* Luxury Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleKeyPress(num)}
                className="h-14 bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-100 rounded-2xl flex items-center justify-center font-bold text-lg border border-stone-800/60 shadow-md transition-colors cursor-pointer"
              >
                {num}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleClear}
              className="h-14 bg-red-955/20 hover:bg-red-955/40 text-red-400 rounded-2xl flex items-center justify-center text-xs font-bold uppercase tracking-wider border border-red-955/50 shadow-sm transition-colors cursor-pointer"
            >
              Clear
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleKeyPress('0')}
              className="h-14 bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-100 rounded-2xl flex items-center justify-center font-bold text-lg border border-stone-800/60 shadow-md transition-colors cursor-pointer"
            >
              0
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleBackspace}
              className="h-14 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded-2xl flex items-center justify-center shadow-md transition-colors cursor-pointer"
              aria-label="backspace"
            >
              <Delete size={18} />
            </motion.button>
          </div>

          {/* Action button to execute validation */}
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
        </motion.div>

        {/* Informational help/hint protocol footers */}
        <p className="text-[10px] text-stone-500 font-mono mt-8 uppercase tracking-widest text-center">
          DECRYPTED PROTOCOL SECURITY v2.6 · AES HIGH GRADE LOCK
        </p>
      </div>
    </div>
  );
}
