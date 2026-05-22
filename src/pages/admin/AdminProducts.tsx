import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, Image as ImageIcon, FileText, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // form state
  const [catId, setCatId] = useState('');
  const [isNewCat, setIsNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [secondaryImages, setSecondaryImages] = useState(''); // comma separated
  const [sizes, setSizes] = useState(''); // comma separated
  const [productType, setProductType] = useState<'buy' | 'rent'>('buy');
  const [cgstRate, setCgstRate] = useState('9');
  const [sgstRate, setSgstRate] = useState('9');

  // Drag over states
  const [dragOverDesc, setDragOverDesc] = useState(false);

  // File loading utility functions
  const handleDescFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDesc(e.target.result as string);
        toast.success('Description file loaded successfully');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    setLoading(true);
    
    // Listen to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (catSnap) => {
      const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCategories(cats);
    }, (err) => {
      console.error('Error listening to categories:', err);
      handleFirestoreError(err, OperationType.GET, 'categories_stream');
    });

    // Listen to products
    const unsubProds = onSnapshot(collection(db, 'products'), (prodSnap) => {
      const prods = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProducts(prods);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to products:', err);
      handleFirestoreError(err, OperationType.GET, 'products_stream');
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, []);

  // Derived products with category names
  const productsWithCat = products.map(p => {
    const cat = categories.find(c => c.id === p.catId);
    return { ...p, categoryName: cat ? cat.name : 'Unknown' };
  });

  const openAddModal = () => {
    setEditId(null);
    setIsNewCat(false);
    setNewCatName('');
    setNewCatImage('');
    setName('');
    setDesc('');
    setPrice('');
    setStock('');
    setImage('');
    setNewCatName('');
    setNewCatImage('');
    setSecondaryImages('');
    setSizes('');
    setProductType('buy');
    setCgstRate('9');
    setSgstRate('9');
    if (categories.length > 0) setCatId(categories[0].id);
    else setCatId('new');
    setShowModal(true);
  };

  const openEditModal = (prod: any) => {
    setEditId(prod.id);
    setIsNewCat(false);
    setName(prod.name);
    setDesc(prod.description || '');
    setPrice(prod.price.toString());
    setStock(prod.stock.toString());
    setImage(prod.image);
    setNewCatName('');
    setNewCatImage('');
    setSecondaryImages(prod.secondaryImages?.join(', ') || '');
    setSizes(prod.sizes?.join(', ') || '');
    setProductType(prod.productType || 'buy');
    setCgstRate(typeof prod.cgstRate === 'number' ? prod.cgstRate.toString() : '9');
    setSgstRate(typeof prod.sgstRate === 'number' ? prod.sgstRate.toString() : '9');
    setCatId(prod.catId);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully');
    } catch(err:any) {
      toast.error(err.message || 'Error deleting product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    let finalCatId = catId;
    setSubmitting(true);
    const loadingToast = toast.loading('Saving product...');
    
    try {
      console.log('Starting product save...', { editId, finalCatId });
      if (catId === 'new') {
        const catRes = await addDoc(collection(db, 'categories'), { 
          name: newCatName.trim(), 
          image: newCatImage.trim(), 
          createdAt: Date.now() 
        });
        finalCatId = catRes.id;
        console.log('New category created:', finalCatId);
      }

      if (!finalCatId) throw new Error('Please select or create a category');

      const sImages = secondaryImages.split(',').map(s => s.trim()).filter(s => s !== '');
      const sSizes = sizes.split(',').map(s => s.trim()).filter(s => s !== '');

      const productData = { 
        catId: finalCatId, 
        name: name.trim(), 
        description: desc.trim(), 
        price: Number(price), 
        stock: Number(stock), 
        image: image.trim(),
        secondaryImages: sImages,
        sizes: sSizes,
        productType,
        cgstRate: Number(cgstRate) || 0,
        sgstRate: Number(sgstRate) || 0,
        updatedAt: Date.now()
      };

      if (editId) {
        await updateDoc(doc(db, 'products', editId), productData);
        console.log('Product updated successfully');
        toast.success('Product updated', { id: loadingToast });
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: Date.now() });
        console.log('Product created successfully');
        toast.success('Product created', { id: loadingToast });
      }
      setShowModal(false);
    } catch(err:any) {
      console.error('Error saving:', err);
      toast.error(err.message || 'Error saving product', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-900">Manage Products</h1>
        <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm shadow-sm transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Image</th>
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold text-center">Stock</th>
                <th className="p-4 font-bold text-right">Price</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-500 flex justify-center"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></td></tr>
              ) : productsWithCat.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No products found.</td></tr>
              ) : productsWithCat.map(prod => (
                <tr key={prod.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 w-24">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                      <img src={prod.image} className="w-full h-full object-cover" alt="prod" />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-800 line-clamp-2 h-16">{prod.name}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${prod.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{prod.stock}</span>
                  </td>
                  <td className="p-4 text-right font-bold">₹{prod.price.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditModal(prod)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(prod.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">{editId ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                  <button 
                    type="button"
                    onClick={() => {
                      if (catId === 'new') {
                        if (categories.length > 0) setCatId(categories[0].id);
                        else setCatId('');
                      } else {
                        setCatId('new');
                      }
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {catId === 'new' ? 'Choose Existing' : '+ Create New Category'}
                  </button>
                </div>
                
                {catId !== 'new' ? (
                  <select 
                    required 
                    value={catId} 
                    onChange={e=>setCatId(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">New Category Detail</h4>
                    </div>
                    <div>
                      <input 
                        required={catId === 'new'}
                        value={newCatName} 
                        onChange={e=>setNewCatName(e.target.value)} 
                        type="text" 
                        placeholder="New Category Name (e.g. Jeans)" 
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-sm font-medium" 
                      />
                    </div>
                    <div>
                      <input 
                        required={catId === 'new'}
                        value={newCatImage} 
                        onChange={e=>setNewCatImage(e.target.value)} 
                        type="url" 
                        placeholder="Image URL: https://..." 
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-sm font-medium" 
                      />
                      <p className="text-[9px] text-indigo-400 mt-1 ml-1 font-bold italic">Unsplash or Pexels URLs work best!</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required value={price} onChange={e=>setPrice(e.target.value)} type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock Qty</label>
                  <input required value={stock} onChange={e=>setStock(e.target.value)} type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CGST Rate (%)</label>
                  <input required min="0" max="100" step="any" value={cgstRate} onChange={e=>setCgstRate(e.target.value)} type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-medium" />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">SGST Rate (%)</label>
                  <input required min="0" max="100" step="any" value={sgstRate} onChange={e=>setSgstRate(e.target.value)} type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Main Image URL</label>
                <div className="flex flex-col gap-3">
                  <input 
                    required 
                    value={image} 
                    onChange={e=>setImage(e.target.value)} 
                    type="url" 
                    placeholder="E.g. https://images.unsplash.com/photo-..." 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm" 
                  />
                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                    Please use an external secure image URL (e.g. from Unsplash or Pexels) to optimize Firestore database limits.
                  </p>
                  {image && (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm mt-1 group shrink-0">
                      <img src={image} alt="preview" className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                      }} />
                      <button 
                        type="button" 
                        onClick={() => setImage('')} 
                        className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secondary Image URLs (Comma Separated)</label>
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={secondaryImages} 
                    onChange={e=>setSecondaryImages(e.target.value)} 
                    rows={2} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors font-mono text-xs" 
                    placeholder="https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
                  />
                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                    Provide comma-separated image URLs for additional product views. Double-check your links before saving!
                  </p>

                  {secondaryImages.split(',').map(s=>s.trim()).filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-gray-50/50 rounded-xl border border-gray-100">
                      {secondaryImages.split(',').map(s=>s.trim()).filter(Boolean).map((imgUrl, i) => (
                        <div key={i} className="relative w-12 h-12 rounded border border-stone-200 overflow-hidden shadow-sm bg-white">
                          <img src={imgUrl} alt="sec" className="w-full h-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                          }} />
                          <button 
                            type="button" 
                            onClick={() => {
                              const list = secondaryImages.split(',').map(s=>s.trim()).filter(Boolean);
                              list.splice(i, 1);
                              setSecondaryImages(list.join(', '));
                            }} 
                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/65 hover:bg-black/80 text-white rounded-full transition-colors"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Sizes (Comma Separated)</label>
                <input value={sizes} onChange={e=>setSizes(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" placeholder="XL, L, M, S" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Listing Type</label>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setProductType('buy')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${productType === 'buy' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                  >
                    Sale (Buy)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setProductType('rent')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${productType === 'rent' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                  >
                    Rental (Rent)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-3 flex flex-col transition-all ${
                    dragOverDesc ? 'border-indigo-600 bg-indigo-50/40' : 'border-stone-200 bg-stone-50/50 hover:border-indigo-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDesc(true); }}
                  onDragLeave={() => setDragOverDesc(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDesc(false);
                    if (e.dataTransfer.files?.[0]) handleDescFile(e.dataTransfer.files[0]);
                  }}
                >
                  <textarea 
                    required 
                    value={desc} 
                    onChange={e=>setDesc(e.target.value)} 
                    rows={4} 
                    placeholder="Write unique details of rare items here, or drop a text/markdown file to automatically register..." 
                    className="w-full p-2.5 text-sm bg-white border border-stone-200 rounded-lg outline-none focus:border-indigo-500 transition-colors"
                  />
                  
                  <div className="mt-2 text-stone-500 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-stone-400">Characters: {desc.length}</span>
                    <label className="cursor-pointer group flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded font-bold transition-all border border-stone-200 shadow-sm">
                      <FileText size={12} className="text-stone-500" />
                      <span>Upload Description File</span>
                      <input 
                        type="file" 
                        accept=".txt,.md,.json" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleDescFile(e.target.files[0]);
                        }} 
                      />
                    </label>
                  </div>
                </div>
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
