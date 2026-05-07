import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { LogOut, Settings, User as UserIcon, Package, MapPin, Phone, Mail, Save } from 'lucide-react';
import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="p-6 h-full flex flex-col justify-center items-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex flex-col items-center justify-center text-gray-400 mb-6">
          <UserIcon size={40} />
        </div>
        <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
        <p className="text-gray-500 mb-8">Login to manage your profile and orders.</p>
        <button onClick={() => navigate('/login')} className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm hover:bg-indigo-700 transition">Login / Sign Up</button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full pb-20">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex flex-col items-center justify-center font-bold text-2xl mb-4">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="font-bold text-xl">{user.name}</h2>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        {user.role === 'admin' && (
          <a href="/admin" className="mt-4 bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Settings size={16} />
            Admin Dashboard
          </a>
        )}
      </div>

      <h3 className="font-bold text-gray-900 mb-3 px-2">Account Details</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 flex flex-col">
        <div className="p-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Email Address</div>
            <div className="text-sm font-medium">{user.email}</div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <Phone size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Phone Number</div>
            <div className="text-sm font-medium">{user.phone || 'Not provided'}</div>
          </div>
        </div>
        
        {/* Permanent Address Section */}
        <div className="p-4 flex flex-col gap-3 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Default Delivery Address</div>
                <div className="text-[11px] text-indigo-500 font-bold uppercase tracking-tight">Saved for fast checkout</div>
              </div>
            </div>
            <button 
              onClick={() => {
                if (isEditingAddress) {
                  saveAddress();
                } else {
                  setIsEditingAddress(true);
                }
              }}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
            >
              {isEditingAddress ? 'Save Change' : address ? 'Edit' : 'Add Address'}
            </button>
          </div>
          
          {isEditingAddress ? (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter House No, Area, Landmark, Pincode..."
              rows={3}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
            />
          ) : (
            <div className="text-sm text-gray-800 font-medium leading-relaxed bg-gray-50/50 p-2 rounded-lg">
              {address || <span className="text-gray-400 italic font-normal">No address saved yet. Please add one.</span>}
            </div>
          )}
        </div>

        <a href="/order" className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <Package size={18} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">My Orders</div>
            <div className="text-xs text-gray-500">View and track your orders</div>
          </div>
        </a>
      </div>

      <button onClick={() => { logout(); navigate('/login'); }} className="w-full bg-white text-red-600 border border-red-100 font-bold py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2">
        <LogOut size={20} />
        Logout
      </button>

      {saving && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-gray-700">Updating profile...</span>
          </div>
        </div>
      )}
    </div>
  );

  async function saveAddress() {
    if (!address.trim()) {
      toast.error('Address cannot be empty');
      return;
    }
    setSaving(true);
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.id), {
          address: address.trim()
        });
        setIsEditingAddress(false);
        toast.success('Address saved successfully');
      }
    } catch (err) {
      toast.error('Failed to update address');
    } finally {
      setSaving(false);
    }
  }
}
