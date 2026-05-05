import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Ticket } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue('');
    setMinAmount('');
    setIsActive(true);
    setEditId(null);
  };

  const handleEdit = (coupon: any) => {
    setEditId(coupon.id);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value.toString());
    setMinAmount(coupon.minAmount?.toString() || '');
    setIsActive(coupon.isActive);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Error deleting coupon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) {
      toast.error('Code and Value are required');
      return;
    }

    const loadingToast = toast.loading('Saving coupon...');
    try {
      const couponData = {
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        minAmount: minAmount ? Number(minAmount) : 0,
        isActive,
        updatedAt: Date.now()
      };

      if (editId) {
        await updateDoc(doc(db, 'coupons', editId), couponData);
        toast.success('Coupon updated', { id: loadingToast });
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          createdAt: Date.now()
        });
        toast.success('Coupon created', { id: loadingToast });
      }
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Error saving coupon', { id: loadingToast });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Coupons</h1>
          <p className="text-gray-500 font-medium">Manage discount codes</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex p-10 justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Ticket size={18} />
                      </div>
                      <span className="font-black text-gray-900">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-600 capitalize">{coupon.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-indigo-600">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(coupon)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium italic">No coupons found. Create your first one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Coupon Code</label>
                <input 
                  required 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  type="text" 
                  placeholder="E.G. SAVE20"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-gray-300" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discount Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Value</label>
                  <input 
                    required 
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                    type="number" 
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-indigo-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Min Order Amount (Optional)</label>
                <input 
                  value={minAmount} 
                  onChange={e => setMinAmount(e.target.value)} 
                  type="number" 
                  placeholder="0"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold" 
                />
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive} 
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="isActive" className="font-bold text-gray-700 text-sm">Active & Usable</label>
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                {editId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
