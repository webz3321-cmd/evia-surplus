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
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
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
    <div className="flex flex-col min-h-screen bg-neutral-50/50 pb-32">
      {/* Visual Workspace Banner Background with luxury editorial touch */}
      <div className="h-60 bg-gradient-to-br from-stone-905 via-stone-900 to-neutral-950 relative overflow-hidden flex items-end p-8 border-b border-stone-800">
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-stone-950 to-transparent opacity-85 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        {/* Ambient radial accent */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 h-10 px-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center gap-2 text-stone-300 border border-white/10 transition-all hover:text-white hover:border-white/20 active:scale-95 z-20 cursor-pointer text-xs uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={14} />
          <span>Return</span>
        </button>

        <div className="relative z-10 w-full max-w-xl mx-auto flex items-end justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-amber-500/90 block mb-1">Authenticated Account</span>
            <h1 className="font-serif text-3xl font-bold text-white tracking-wide">My Account</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9.5px] tracking-widest uppercase font-bold text-stone-400">Secure Account</span>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 -mt-10 relative z-10 max-w-xl mx-auto w-full"
      >
        {/* Core Profile Identity Bento Grid Box */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200/40 border border-stone-200/80 flex flex-col items-center text-center">
          
          {/* Avatar Container resembling high-fidelity Chrome profile linking */}
          <div className="w-24 h-24 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-900 mb-5 border border-stone-150 shadow-xs relative group-hover:border-amber-500/40 transition-all">
             <UserIcon size={36} className="text-stone-700" />
             <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white" title="Verified Presence">
                <ShieldCheck size={12} />
             </div>
          </div>

          <h2 className="font-serif text-2xl text-stone-950 tracking-normal font-bold leading-none">{fullName || user.name || 'Customer'}</h2>
          <p className="text-stone-450 font-mono text-xs uppercase tracking-[0.18em] mt-2.5 font-medium">{user.email?.toUpperCase()}</p>
          
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {user.role === 'admin' && (
              <Link to="/admin" className="bg-stone-900 hover:bg-stone-850 text-white font-bold px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer">
                <Settings size={13} className="text-amber-500" />
                <span>Admin Central</span>
              </Link>
            )}
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="bg-white hover:bg-red-50 text-red-650 border border-stone-200 hover:border-red-200 font-bold px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <LogOut size={13} className="text-red-500" />
              <span>Logout Session</span>
            </button>
          </div>
        </div>

        {/* Action Blocks */}
        <div className="grid grid-cols-1 gap-4 mt-6">
           <Link to="/order" className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-5 group hover:border-stone-400 transition-all">
              <div className="w-11 h-11 bg-stone-50 text-stone-900 rounded-xl flex items-center justify-center group-hover:bg-stone-950 group-hover:text-amber-400 border border-stone-200/60 transition-all">
                <Package size={20} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-serif text-[13.5px] font-bold text-stone-950 tracking-wide uppercase">My Orders</h3>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Track and view all your orders</p>
              </div>
              <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-950 transition-colors" />
           </Link>
        </div>

        {/* Contact info element card */}
        <div className="bg-white rounded-2xl p-7 border border-stone-200/80 shadow-xs mt-6 space-y-5 text-left">
           <div className="border-b border-stone-100 pb-3">
             <h3 className="font-serif text-sm text-stone-950 font-bold uppercase tracking-wider">Contact Details</h3>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center text-stone-450 border border-stone-200/50"><Mail size={16} /></div>
              <div className="flex flex-col">
                 <span className="text-[8.5px] font-bold text-stone-400 uppercase tracking-widest leading-none">Registered Email Address</span>
                 <span className="text-xs font-semibold text-stone-850 font-mono mt-1.5">{user.email}</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center text-stone-450 border border-stone-200/50"><Phone size={16} /></div>
              <div className="flex flex-col">
                 <span className="text-[8.5px] font-bold text-stone-400 uppercase tracking-widest leading-none">Mobile Number</span>
                 <span className="text-xs font-semibold text-stone-850 mt-1.5">{user.phone || 'No phone number provided'}</span>
              </div>
           </div>
        </div>

        {/* Shipping Address container */}
        <div className="bg-white rounded-2xl p-7 border border-stone-200/80 shadow-xs mt-6 text-left">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
            <h3 className="font-serif text-sm text-stone-950 font-bold uppercase tracking-wider">Shipping Address</h3>
            {!isEditingAddress && (
              <button 
                onClick={() => setIsEditingAddress(true)} 
                className="text-[9.5px] font-bold text-stone-800 hover:text-amber-600 uppercase tracking-widest bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-md border border-stone-200/80 transition-all cursor-pointer"
              >
                Edit Address
              </button>
            )}
          </div>

          <div className="space-y-4">
            {isEditingAddress ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all mt-1" placeholder="Your Full Name" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all mt-1" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Address (House No / Building / Street)</label>
                  <textarea value={addressLine} onChange={e=>setAddressLine(e.target.value)} rows={2} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all resize-none mt-1" placeholder="House No, Apartment name, Street name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Landmark</label>
                    <input value={landmark} onChange={e=>setLandmark(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all mt-1" placeholder="e.g. Near Temple / Mall" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">City / Town / District</label>
                    <input value={taluq} onChange={e=>setTaluq(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all mt-1" placeholder="e.g. City name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">State</label>
                    <input value={state} onChange={e=>setState(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all mt-1" placeholder="e.g. Delhi" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Pincode</label>
                    <input value={pincode} onChange={e=>setPincode(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-950 transition-all mt-1 font-mono tracking-wider animate-none" placeholder="6-digit PIN code" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="space-y-1.5 p-4.5 bg-stone-50 rounded-xl border border-stone-200/50">
                    <div className="flex items-center gap-2 mb-2">
                       <MapPin size={15} className="text-amber-500" />
                       <span className="text-[9.5px] font-bold text-stone-450 uppercase tracking-widest">Selected Shipping Address</span>
                    </div>
                    {fullName ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-900 uppercase tracking-wide">{fullName}</p>
                        <p className="text-[11px] text-stone-500 font-medium font-mono">{phone}</p>
                        <p className="text-xs text-stone-600 leading-relaxed mt-2 p-3 bg-white border border-stone-200/60 rounded-lg shadow-2xs italic font-serif">
                          {addressLine}, {landmark && `${landmark}, `}{taluq}, {state} - {pincode}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-widest py-3 italic text-center leading-relaxed">No shipping address provided yet.<br />Please add an address to place your orders.</p>
                    )}
                 </div>
              </div>
            )}
          </div>

          {isEditingAddress && (
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setIsEditingAddress(false)} className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer">Cancel</button>
              <button 
                onClick={handleUpdate} 
                disabled={saving} 
                className="flex-[2] py-3.5 bg-stone-900 hover:bg-stone-850 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-md shadow-stone-200 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={13} /> Save Address</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
