import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, Image as ImageIcon, FileText, X, Search, Package, Sparkles, RefreshCw } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // form state
  const [catId, setCatId] = useState('');
  const [isNewCat, setIsNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
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

  // Derived products with category names and search filter
  const filteredProducts = products.map(p => {
    const cat = categories.find(c => c.id === p.catId);
    return { ...p, categoryName: cat ? cat.name : 'Unknown' };
  }).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditId(null);
    setIsNewCat(false);
    setNewCatName('');
    setNewCatImage('');
    setName('');
    setDesc('');
    setPrice('');
    setOriginalPrice('');
    setStock('');
    setImage('');
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
    setOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : '');
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this asset permanentely?')) return;
    
    const loadId = toast.loading('Erasing record...');
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Record Erased', { id: loadId });
    } catch(err:any) {
      console.error("Asset Disposal Error:", err);
      toast.error('Access Denied: ' + (err.message || 'Permission denied'), { id: loadId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    let finalCatId = catId;
    setSubmitting(true);
    const loadingToast = toast.loading('Syncing to archives...');
    
    try {
      if (catId === 'new') {
        const catRes = await addDoc(collection(db, 'categories'), { 
          name: newCatName.trim(), 
          image: newCatImage.trim(), 
          createdAt: Date.now() 
        });
        finalCatId = catRes.id;
      }

      if (!finalCatId) throw new Error('Specify Archive Category');

      const sImages = secondaryImages.split(',').map(s => s.trim()).filter(Boolean);
      const sSizes = sizes.split(',').map(s => s.trim()).filter(Boolean);

      const productData = { 
        catId: finalCatId, 
        name: name.trim(), 
        description: desc.trim(), 
        price: Number(price), 
        originalPrice: originalPrice ? Number(originalPrice) : null,
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
        toast.success('Inventory Updated', { id: loadingToast });
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: Date.now() });
        toast.success('New Asset Registered', { id: loadingToast });
      }
      setShowModal(false);
    } catch(err:any) {
      toast.error(err.message || 'Sync Failed', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-black lowercase text-foreground">inventory<span className="text-[#A38A5F]">.</span>ledger</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Tactical Asset Registry & Curation</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="w-full md:w-auto bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#A38A5F] dark:hover:bg-[#A38A5F] hover:text-white transition-all active:scale-[0.98]"
        >
          <Plus size={18} /> Register Asset
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search by name or category..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-[32px] shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#A38A5F] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <Package className="mx-auto text-stone-200" size={48} />
            <p className="text-xs text-stone-400 font-black uppercase tracking-widest">No matching assets found in ledger.</p>
          </div>
        ) : (
          <>
            {/* Unified Responsive Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:gap-4 md:p-6">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="p-6 md:bg-stone-50/50 md:dark:bg-white/[0.02] md:border md:border-stone-100 md:dark:border-white/5 md:rounded-[32px] space-y-4 hover:border-[#A38A5F]/20 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-black overflow-hidden border border-stone-200 dark:border-white/10 group-hover:scale-105 transition-transform duration-500">
                        <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-foreground mb-1 line-clamp-2 leading-snug">{prod.name}</div>
                        <div className="inline-block px-2 py-1 rounded-lg bg-stone-100 dark:bg-white/5 text-[8px] font-black uppercase tracking-widest text-stone-500">{prod.categoryName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                       <button onClick={() => openEditModal(prod)} className="p-3 text-stone-400 hover:text-[#A38A5F] hover:bg-[#A38A5F]/10 rounded-xl border border-stone-100 dark:border-white/5 transition-all shadow-sm"><Edit2 size={18} /></button>
                       <button onClick={(e) => handleDelete(e, prod.id)} className="p-3 text-stone-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl border border-stone-100 dark:border-white/5 transition-all shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-stone-50 dark:bg-black/50 md:bg-white md:dark:bg-black/80 p-4 rounded-2xl border border-transparent md:border-stone-100 md:dark:border-white/5">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Valuation</p>
                      <p className="font-black text-base text-foreground flex items-center gap-2">
                        ₹{prod.price.toLocaleString()}
                        {prod.originalPrice && <span className="text-[10px] text-stone-400 line-through">₹{prod.originalPrice.toLocaleString()}</span>}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Status</p>
                      <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        prod.stock > 10 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' :
                        prod.stock > 0 ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' :
                        'text-rose-500 bg-rose-50 dark:bg-rose-950/20'
                      }`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${prod.stock > 0 ? 'bg-current pulse' : 'bg-rose-500'}`}></div>
                         {prod.stock} Units
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 z-50">
          <div className="bg-white dark:bg-[#0D0D0D] w-full max-w-2xl max-h-[96dvh] md:max-h-[90vh] md:rounded-[40px] rounded-t-[40px] shadow-2xl flex flex-col border border-stone-200 dark:border-white/10 animate-in slide-in-from-bottom duration-500 overflow-hidden relative">
            <div className="p-5 md:p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0D0D0D] md:rounded-t-[40px] shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-serif font-black lowercase text-foreground">{editId ? 'Edit Asset' : 'Register New Asset'}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 bg-stone-50 dark:bg-white/5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 min-h-0 p-5 md:p-8 touch-pan-y">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
                <div className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Asset Allocation</label>
                      <button 
                        type="button"
                        onClick={() => {
                          if (catId === 'new') {
                            setCatId(categories.length > 0 ? categories[0].id : '');
                          } else {
                            setCatId('new');
                          }
                        }}
                        className="text-[10px] font-black text-[#A38A5F] hover:underline uppercase tracking-widest"
                      >
                        {catId === 'new' ? 'Choose Existing' : '+ New Category'}
                      </button>
                    </div>
                    
                    {catId !== 'new' ? (
                      <select 
                        required 
                        value={catId} 
                        onChange={e=>setCatId(e.target.value)} 
                        className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all appearance-none"
                      >
                        <option value="" disabled>Select Department...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (
                      <div className="bg-[#A38A5F]/5 p-6 rounded-3xl border border-[#A38A5F]/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3">
                          <Sparkles className="text-[#A38A5F]" size={16} />
                          <h4 className="text-[10px] font-black text-[#A38A5F] uppercase tracking-[0.2em]">New Archive Definition</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input required value={newCatName} onChange={e=>setNewCatName(e.target.value)} type="text" placeholder="Category Name" className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/5 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-[#A38A5F]" />
                          <input required value={newCatImage} onChange={e=>setNewCatImage(e.target.value)} type="url" placeholder="Cover Image URL" className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/5 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-[#A38A5F]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Core Identification</label>
                    <input required value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Asset Nomenclature" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Current Valuation (₹)</label>
                      <input required value={price} onChange={e=>setPrice(e.target.value)} type="number" placeholder="6,400" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">M.R.P / Original (₹)</label>
                      <input value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} type="number" placeholder="8,000" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">On-Hand Stock</label>
                      <input required value={stock} onChange={e=>setStock(e.target.value)} type="number" placeholder="Qty" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                    </div>
                    <div className="flex items-end pb-1">
                      <div className="w-full bg-stone-50 dark:bg-white/5 p-4 rounded-2xl border border-stone-100 dark:border-white/5 text-center">
                        {originalPrice && Number(originalPrice) > Number(price) ? (
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                            Auto-Discount: {Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Base Rate No-Offer</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">CGST (%)</label>
                      <input required value={cgstRate} onChange={e=>setCgstRate(e.target.value)} type="number" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">SGST (%)</label>
                      <input required value={sgstRate} onChange={e=>setSgstRate(e.target.value)} type="number" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Visual Registry (Main)</label>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <input required value={image} onChange={e=>setImage(e.target.value)} type="url" placeholder="Primary Image URL" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                      </div>
                      {image && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 dark:border-white/10 shrink-0">
                          <img src={image} className="w-full h-full object-cover" alt="prev" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Secondary Viewports (URLs)</label>
                    <textarea value={secondaryImages} onChange={e=>setSecondaryImages(e.target.value)} rows={3} placeholder="Comma-separated URLs" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-[11px] font-bold outline-none focus:border-[#A38A5F] transition-all font-mono" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Operational Sizes</label>
                    <input value={sizes} onChange={e=>setSizes(e.target.value)} type="text" placeholder="XS, S, M, L, XL" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Transaction Protocol</label>
                    <div className="flex bg-stone-50 dark:bg-black p-1.5 rounded-2xl border border-stone-100 dark:border-white/10">
                      <button type="button" onClick={() => setProductType('buy')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${productType === 'buy' ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black shadow-lg' : 'text-stone-400'}`}>Sale Acquisition</button>
                      <button type="button" onClick={() => setProductType('rent')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${productType === 'rent' ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black shadow-lg' : 'text-stone-400'}`}>Tactical Rental</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Intelligence Report (Desc)</label>
                    <div 
                      className={`border-2 border-dashed rounded-3xl p-4 flex flex-col gap-4 transition-all ${
                        dragOverDesc ? 'border-[#A38A5F] bg-[#A38A5F]/5' : 'border-stone-200 dark:border-white/10'
                      }`}
                      onDragOver={e=>{ e.preventDefault(); setDragOverDesc(true); }}
                      onDragLeave={()=>setDragOverDesc(false)}
                      onDrop={e=>{
                        e.preventDefault();
                        setDragOverDesc(false);
                        if(e.dataTransfer.files?.[0]) handleDescFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows={6} className="w-full bg-white dark:bg-black border-none outline-none text-sm font-medium resize-none placeholder:text-stone-300" placeholder="Archive documentation..." />
                      <div className="flex justify-between items-center border-t border-stone-100 dark:border-white/5 pt-4">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Bytes: {new TextEncoder().encode(desc).length}</span>
                        <label className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-white/5 hover:bg-[#A38A5F]/10 text-stone-600 dark:text-stone-400 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer transition-all border border-stone-200 dark:border-white/5">
                          <FileText size={14} /> Import File
                          <input type="file" accept=".txt,.md" className="hidden" onChange={e=>{ if(e.target.files?.[0]) handleDescFile(e.target.files[0]); }} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 md:p-8 border-t border-stone-100 dark:border-white/5 flex gap-4 bg-white dark:bg-[#0D0D0D] shrink-0">
              <button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="flex-1 py-4 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-stone-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50">Discard</button>
              <button form="product-form" type="submit" disabled={submitting} className="flex-1 py-4 bg-[#A38A5F] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#8B7350] transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                 {submitting && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                {editId ? 'Apply Update' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
