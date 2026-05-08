import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (email === 'evia@admin.gmail.com' && password === 'admin123') {
        login({ id: 'admin-id', name: 'Admin', email: email, role: 'admin' } as any);
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
        login({ id: userCred.user.uid, name, email, role: 'user', phone } as any);
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col justify-center p-6 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto w-full"
      >
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 mb-6 group cursor-default">
              <Sparkles className="group-hover:rotate-12 transition-transform duration-500" size={32} />
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">EVIA</h1>
           <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Premium Shopping Experience</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/50 border border-gray-100 p-8">
           <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8">
              <button 
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'login' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400'}`}
                onClick={() => setTab('login')}
              >
                Sign In
              </button>
              <button 
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'signup' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400'}`}
                onClick={() => setTab('signup')}
              >
                Join Now
              </button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {tab === 'signup' && (
                  <motion.div 
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        required 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner" 
                      />
                    </div>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="tel" 
                        placeholder="Phone Number" 
                        required 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner" 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner" 
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border ${password.length > 0 && password.length < 6 ? 'border-red-400' : 'border-transparent'} rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner`} 
                />
              </div>
              {password.length > 0 && password.length < 6 && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4 mt-1"
                >
                  Password must be at least 6 characters
                </motion.p>
              )}

              <div className="pt-2">
                <button 
                  disabled={loading || password.length < 6} 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 px-6 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] group disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {tab === 'login' ? 'Sign In To Account' : 'Create Your Account'}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
           </form>
           
           <div className="mt-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
              By joining EVIA, you agree to our <br />
              <span className="text-gray-900 underline">Terms of Service</span> & <span className="text-gray-900 underline">Privacy Policy</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
