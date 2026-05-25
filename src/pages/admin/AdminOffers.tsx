import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { Sparkles, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminOffers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [active, setActive] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'offers'), (snap) => {
      setOffers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'offers');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setTitle('OFFERS AVAILABLE');
    setText('');
    setActive(true);
    setEditId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: title.trim().toUpperCase(), text: text.trim(), active, updatedAt: Date.now() };

    try {
      if (editId) {
        await updateDoc(doc(db, 'offers', editId), data);
        toast.success('Offer updated');
      } else {
        await addDoc(collection(db, 'offers'), { ...data, createdAt: Date.now() });
        toast.success('Offer added');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to save offer');
    }
  };

    const deleteOffer = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'offers', id));
      toast.success('Offer removed');
    } catch (err: any) {
      console.error("Offer delete error:", err);
      toast.error('Delete failed: ' + (err.message || 'Permission denied'));
    }
  };

  const openEdit = (off: any) => {
    setEditId(off.id);
    setTitle(off.title);
    setText(off.text);
    setActive(off.active);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Cart Offers</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage promotional banners</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus size={16} /> New Offer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-10 flex justify-center col-span-2 text-indigo-400"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : offers.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-200 rounded-[2.5rem] text-center col-span-2">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active offers found</p>
          </div>
        ) : (
          offers.map(off => (
            <div key={off.id} className={`bg-white p-6 rounded-[2rem] border-2 transition-all ${off.active ? 'border-transparent shadow-lg shadow-indigo-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${off.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Sparkles size={20} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(off)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-gray-100"><Edit2 size={18} /></button>
                  <button onClick={(e) => deleteOffer(e, off.id)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-100"><Trash2 size={18} /></button>
                </div>
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{off.title}</h4>
              <p className="font-bold text-gray-900 leading-snug">{off.text}</p>
              <div className="mt-4 flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${off.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                   {off.active ? 'Visible on Cart' : 'Hidden'}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0" />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md max-h-[92dvh] md:max-h-[90vh] md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">{editId ? 'Edit Offer' : 'Create Offer'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
              </div>
            <div className="overflow-y-auto flex-1 p-6 md:p-8 touch-pan-y">
              <form id="offer-form" onSubmit={handleSave} className="space-y-5 pb-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Badge Title</label>
                  <input required value={title} onChange={e=>setTitle(e.target.value)} type="text" className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner" placeholder="OFFERS AVAILABLE" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Offer Message</label>
                  <textarea required value={text} onChange={e=>setText(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner" placeholder="Buy 2 or more items to get secret digital voucher." />
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                  <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} id="active" className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="active" className="text-sm font-black text-gray-700 uppercase tracking-tight cursor-pointer">Active & Visible</label>
                </div>
              </form>
            </div>
            <div className="p-6 md:p-8 border-t border-gray-100 bg-white shrink-0">
              <button form="offer-form" type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-indigo-700 active:scale-95">
                <Save size={18} /> {editId ? 'Apply Changes' : 'Launch Offer'}
              </button>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
