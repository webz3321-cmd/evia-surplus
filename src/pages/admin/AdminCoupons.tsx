import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Ticket } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      if (!snap.metadata.hasPendingWrites) setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to listen to coupons');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue('');
    setMinAmount('');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setEditId(null);
  };

  const handleEdit = (coupon: any) => {
    setEditId(coupon.id);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value.toString());
    setMinAmount(coupon.minAmount?.toString() || '');
    setIsActive(coupon.isActive);
    setStartDate(coupon.startDate || '');
    setEndDate(coupon.endDate || '');
    setShowModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Coupon deleted');
    } catch (err: any) {
      console.error("Coupon delete failure:", err);
      toast.error('Error deleting coupon: ' + (err.message || 'Permission denied'));
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
        startDate: startDate || null,
        endDate: endDate || null,
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
          {/* Desktop Table View */}
          <table className="w-full text-left hidden md:table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Validity</th>
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
                    <div className="flex flex-col gap-1">
                      {coupon.startDate ? (
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Start: {coupon.startDate}</span>
                          <span className="text-[8px] font-black text-rose-600 uppercase tracking-tighter">End: {coupon.endDate || 'No Limit'}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold italic">Always Valid</span>
                      )}
                    </div>
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
                      <button onClick={(e) => handleDelete(e, coupon.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="divide-y divide-gray-50 md:hidden">
            {coupons.map(coupon => (
              <div key={coupon.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1" onClick={() => handleEdit(coupon)}>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Ticket size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900 tracking-tight">{coupon.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{coupon.type}</span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                      <span className="text-[10px] font-black text-indigo-600 uppercase">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-4">
                   <button 
                    onClick={(e) => handleDelete(e, coupon.id)} 
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {coupons.length === 0 && (
            <div className="px-6 py-20 text-center text-gray-400 font-medium italic bg-white flex flex-col items-center gap-4">
              <Ticket size={40} className="text-gray-200" />
              <span>No coupons found in registry.</span>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 z-50">
          <div className="bg-white w-full max-w-md max-h-[92dvh] md:max-h-[90vh] md:rounded-[40px] rounded-t-[40px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom duration-500">
            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 md:rounded-t-[40px]">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Plus size={24} className="rotate-45" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 md:p-8 touch-pan-y">
              <form id="coupon-form" onSubmit={handleSubmit} className="space-y-5 pb-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valid From</label>
                    <input 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      type="date" 
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expiry Date</label>
                    <input 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      type="date" 
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold" 
                    />
                  </div>
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
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex gap-4">
              {editId && (
                <button 
                  type="button" 
                  onClick={(e) => { 
                    if(confirm('Are you sure you want to delete this coupon?')) {
                      handleDelete(e as any, editId);
                      setShowModal(false);
                    }
                  }} 
                  className="px-6 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button form="coupon-form" type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                {editId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
