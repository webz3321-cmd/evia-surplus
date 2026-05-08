import { useNavigate, Link } from 'react-router';
import { useAppContext } from '../context';
import { LogOut, Settings, User as UserIcon, Package, MapPin, Phone, Mail, Save, ArrowLeft, ShieldCheck, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfilePage() {
  const { user, logout, login } = useAppContext();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine, setAddressLine] = useState(user?.addressLine || user?.address || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [taluq, setTaluq] = useState(user?.taluq || '');
  const [state, setState] = useState(user?.state || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleUpdate = async () => {
    if (!fullName.trim() || !phone.trim() || !addressLine.trim() || !pincode.trim()) {
      toast.error('Please fill required fields (Name, Phone, Address, Pincode)');
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        landmark: landmark.trim(),
        taluq: taluq.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        address: `${addressLine.trim()}, ${landmark.trim()}, ${taluq.trim()}, ${state.trim()} - ${pincode.trim()}`
      };
      await updateDoc(doc(db, 'users', user.id), updatedData);
      if (login) login({ ...user, ...updatedData } as any);
      setIsEditingAddress(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] pb-32">
      {/* Visual Header Background */}
      <div className="h-48 bg-indigo-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-24 translate-x-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-24 -translate-x-24"></div>
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20 transition-all active:scale-90 z-20">
          <ArrowLeft size={20} />
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 -mt-16 relative z-10 max-w-xl mx-auto w-full"
      >
        {/* User Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100/50 border border-gray-100 flex flex-col items-center text-center">
          <div className="w-28 h-28 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-6 border-8 border-white shadow-lg relative">
             <UserIcon size={44} />
             <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                <ShieldCheck size={14} />
             </div>
          </div>
          <h2 className="font-black text-2xl text-gray-900 tracking-tight uppercase leading-none">{user.name}</h2>
          <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">{user.email}</p>
          
          <div className="flex gap-2 mt-6">
            {user.role === 'admin' && (
              <Link to="/admin" className="bg-indigo-600 text-white font-black px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95">
                <Settings size={14} />
                Admin Panel
              </Link>
            )}
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-white text-red-500 border border-red-100 font-black px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-red-50 transition-all active:scale-95">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 gap-4 mt-8">
           <Link to="/order" className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:border-indigo-200 transition-all">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Package size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm text-gray-900 uppercase tracking-tight">Purchase History</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active & past orders</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
           </Link>
        </div>

        {/* Contact info card */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mt-8 space-y-6">
           <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight">Contact Information</h3>
           
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Mail size={18} /></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Registered Email</span>
                 <span className="text-sm font-bold text-gray-800 mt-1">{user.email}</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Phone size={18} /></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Phone Number</span>
                 <span className="text-sm font-bold text-gray-800 mt-1">{user.phone || 'Not linked'}</span>
              </div>
           </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight">Personal & Shipping Address</h3>
            {!isEditingAddress && (
              <button onClick={() => setIsEditingAddress(true)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {isEditingAddress ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" placeholder="Contact Name" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" placeholder="10-digit number" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address (House, Building, Area)</label>
                  <textarea value={addressLine} onChange={e=>setAddressLine(e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm resize-none" placeholder="Door No, Street Name..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Near / Landmark</label>
                    <input value={landmark} onChange={e=>setLandmark(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" placeholder="Railway Station..." />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Taluq</label>
                    <input value={taluq} onChange={e=>setTaluq(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" placeholder="Taluq name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
                    <input value={state} onChange={e=>setState(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" placeholder="Karnataka" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                    <input value={pincode} onChange={e=>setPincode(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" placeholder="6-digit code" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="space-y-1.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                       <MapPin size={16} className="text-indigo-600" />
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Shipping Profile</span>
                    </div>
                    {fullName ? (
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{fullName}</p>
                        <p className="text-xs text-gray-600 font-bold">{phone}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-2 italic">
                          {addressLine}, {landmark && `Near ${landmark}, `}{taluq}, {state} - {pincode}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest py-2 italic text-center">Incomplete profile. Please update details.</p>
                    )}
                 </div>
              </div>
            )}
          </div>

          {isEditingAddress && (
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setIsEditingAddress(false)} className="flex-1 py-4 bg-gray-50 text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all hover:bg-gray-100 active:scale-95">Cancel</button>
              <button 
                onClick={handleUpdate} 
                disabled={saving} 
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={14} /> Save Profile</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
