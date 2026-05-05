import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (email === 'evia@admin.gmail.com' && password === 'admin123') {
        login({ id: 'admin-id', name: 'Admin', email: email, role: 'admin' } as any);
        navigate('/admin');
        return;
      }

      let userCred;
      if (tab === 'login') {
        userCred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        if (userDoc.exists()) {
          const u = userDoc.data();
          login({ id: userCred.user.uid, name: u.name, email: u.email, role: u.role || 'user' } as any);
          navigate('/');
        } else {
          login({ id: userCred.user.uid, name: email, email: email, role: 'user' } as any);
          navigate('/');
        }
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name, phone, email, role: 'user', createdAt: Date.now()
        });
        login({ id: userCred.user.uid, name, email, role: 'user' } as any);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-black text-center mb-6 tracking-tight text-indigo-600">EVIA</h2>
        
        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'signup' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="p-3 mb-4 text-sm bg-red-50 text-red-600 rounded-lg whitespace-pre-wrap">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'signup' && (
            <>
              <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              <input type="tel" placeholder="Phone Number" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
            </>
          )}
          <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
          
          <button disabled={loading} type="submit" className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (tab === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}

