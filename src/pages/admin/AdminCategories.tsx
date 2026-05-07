import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      if (!snap.metadata.hasPendingWrites) setLoading(false);
    }, (err) => {
      console.error('Error listening to categories:', err);
      toast.error('Failed to load categories');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setImage(cat.image);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch(err:any) {
      toast.error('Error deleting category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    const loadingToast = toast.loading('Saving category...');
    try {
      const categoryData = { 
        name: name.trim(), 
        image: image.trim(),
        updatedAt: Date.now()
      };

      if (editId) {
        await updateDoc(doc(db, 'categories', editId), categoryData);
        toast.success('Category updated', { id: loadingToast });
      } else {
        await addDoc(collection(db, 'categories'), { ...categoryData, createdAt: Date.now() });
        toast.success('Category created', { id: loadingToast });
      }
      setShowModal(false);
    } catch(err:any) {
      console.error('Error saving:', err);
      toast.error(err.message || 'Error saving category', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-900">Manage Categories</h1>
        <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm shadow-sm transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Image</th>
                <th className="p-4 font-bold">Category Name</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={3} className="p-8 text-center text-gray-500 flex justify-center"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500 font-medium">No categories found.</td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 w-24">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                      <img src={cat.image} className="w-full h-full object-cover" alt="cat" />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-800">{cat.name}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditModal(cat)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">{editId ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image URL</label>
                <input required value={image} onChange={e=>setImage(e.target.value)} type="url" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2">
                   {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
