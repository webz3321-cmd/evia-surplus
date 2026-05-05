import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../../context';
import { Shield } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        const u = userDoc.data();
        login({ id: userCred.user.uid, name: u.name, email: u.email, role: 'admin' } as any);
        navigate('/admin');
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col border border-gray-100">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100">
          <Shield size={32} />
        </div>
        <h2 className="text-2xl font-black text-center mb-2 text-gray-900 tracking-tight">EVIA Admin</h2>
        <p className="text-center text-sm text-gray-500 mb-8 font-medium">Log in to manage your store</p>
        
        {error && <div className="p-3 mb-6 text-sm bg-red-50 text-red-600 rounded-xl font-medium text-center border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
          </div>
          
          <button disabled={loading} type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex justify-center items-center h-[52px]">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
