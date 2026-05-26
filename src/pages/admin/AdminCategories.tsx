import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, UploadCloud } from 'lucide-react';
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
  const [isMoving, setIsMoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image processing utility
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid file type: Must be an image'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // Smaller target for categories

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const result = canvas.toDataURL('image/jpeg', 0.82);
          resolve(result);
        };
        img.onerror = () => reject(new Error('Failed to load image object'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file source'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadId = toast.loading('Synchronizing Visual Data...');
    try {
      const result = await processImage(files[0]);
      setImage(result);
      toast.success('Visual Uplink Complete', { id: loadId });
    } catch (err: any) {
      toast.error(err.message || 'Processing failed', { id: loadId });
    } finally {
      e.target.value = '';
    }
  };

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
    setIsMoving(false);
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setImage(cat.image);
    setIsMoving(cat.isMoving || false);
    setShowModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this category? Products in this category will remain but without a valid category link.')) return;
    
    const loadId = toast.loading('Deleting...');
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category Deleted', { id: loadId });
    } catch(err:any) {
      console.error("Category Disposal Error:", err);
      toast.error('Authority Denied: ' + (err.message || 'Permission denied'), { id: loadId });
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
        isMoving: isMoving,
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
                  <td className="p-4 font-bold text-gray-800">
                    <div className="flex flex-col gap-1">
                      <span className="capitalize">{cat.name}</span>
                      {cat.isMoving && (
                        <span className="inline-flex self-start text-[9px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          ✨ Moving Campaign
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEditModal(cat)} className="p-3 text-stone-400 hover:text-[#A38A5F] hover:bg-[#A38A5F]/10 rounded-xl transition-all border border-transparent hover:border-[#A38A5F]/20"><Edit2 size={18} /></button>
                      <button onClick={(e) => handleDelete(e, cat.id)} className="p-3 text-stone-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 z-50">
          <div className="bg-white dark:bg-[#0D0D0D] w-full max-w-md max-h-[96dvh] md:max-h-[90vh] md:rounded-[40px] rounded-t-[40px] shadow-2xl flex flex-col border border-stone-200 dark:border-white/10 animate-in slide-in-from-bottom duration-500 overflow-hidden relative">
            <div className="p-5 md:p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0D0D0D] md:rounded-t-[40px] shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-serif font-black lowercase text-foreground">{editId ? 'Edit Category' : 'Register Category'}</h3>
              </div>
              <button disabled={submitting} onClick={() => setShowModal(false)} className="p-2 text-stone-400 hover:text-foreground bg-stone-50 dark:bg-white/5 rounded-full transition-colors active:scale-90">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-5 md:p-8 touch-pan-y">
              <form id="category-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Category Name</label>
                    <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-[#A38A5F] transition-colors" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Category Asset (Gallery)</label>
                    <div className="flex flex-col gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                      
                      {image ? (
                        <div className="relative group aspect-square w-full sm:w-48 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-black p-0 shadow-sm transition-all hover:border-[#A38A5F]/40">
                          <img src={image} alt="preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                             <button 
                               type="button" 
                               onClick={() => fileInputRef.current?.click()}
                               className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-[#A38A5F] hover:text-white transition-all shadow-xl"
                             >
                               Change
                             </button>
                             <button 
                               type="button" 
                               onClick={() => setImage('')} 
                               className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-rose-500 transition-all"
                             >
                               Remove
                             </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-12 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-[32px] hover:border-[#A38A5F]/40 hover:bg-[#A38A5F]/5 transition-all flex flex-col items-center justify-center gap-4 text-stone-400 group/btn"
                        >
                          <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-white/5 flex items-center justify-center group-hover/btn:scale-110 transition-transform shadow-sm">
                            <UploadCloud size={24} className="text-[#A38A5F]" />
                          </div>
                          <div className="text-center px-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Upload Visual</p>
                            <p className="text-[9px] font-bold uppercase tracking-tighter mt-1 opacity-50">Local Archive / Camera Roll</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-stone-50/50 dark:bg-white/[0.02] rounded-2xl border border-stone-200 dark:border-white/5">
                    <input 
                      id="category-isMoving"
                      type="checkbox" 
                      checked={isMoving} 
                      onChange={e => setIsMoving(e.target.checked)} 
                      className="w-5 h-5 mt-0.5 text-[#A38A5F] border-stone-300 rounded focus:ring-[#A38A5F] accent-[#A38A5F] cursor-pointer"
                    />
                    <label htmlFor="category-isMoving" className="flex flex-col cursor-pointer gap-1">
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Show in Moving Marquee Campaign</span>
                      <span className="text-[10px] text-stone-500 font-medium leading-relaxed">If enabled, this category will slide in the Meesho-style infinite moving banner on the Home Page.</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 md:p-8 border-t border-stone-100 dark:border-white/5 flex gap-4 bg-white dark:bg-[#0D0D0D] shrink-0">
              <button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="flex-1 py-4 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-stone-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50">Cancel</button>
              <button form="category-form" type="submit" disabled={submitting} className="flex-1 py-4 bg-[#A38A5F] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#8B7350] transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                 {submitting && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                {editId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
