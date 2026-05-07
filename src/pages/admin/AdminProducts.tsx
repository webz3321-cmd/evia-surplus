import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    setLoading(true);
    
    // Listen to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (catSnap) => {
      const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCategories(cats);
      if (cats.length > 0 && !catId) setCatId(cats[0].id);
      
      // Update products with new category info if products are loaded
      setProducts(prevProds => prevProds.map(p => {
        const cat = cats.find(c => c.id === p.catId);
        return { ...p, categoryName: cat ? cat.name : 'Unknown' };
      }));

      if (!catSnap.metadata.hasPendingWrites) setLoading(false);
    }, (err) => {
      console.error('Error listening to categories:', err);
      handleFirestoreError(err, OperationType.GET, 'categories_stream');
      setLoading(false);
    });

    // Listen to products
    const unsubProds = onSnapshot(collection(db, 'products'), (prodSnap) => {
      const prods = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Map cat names to prods using latest categories state
      setProducts(prods.map((p: any) => {
        const cat = categories.find(c => c.id === p.catId);
        return { ...p, categoryName: cat ? cat.name : 'Unknown' };
      }));

      if (!prodSnap.metadata.hasPendingWrites) setLoading(false);
    }, (err) => {
      console.error('Error listening to products:', err);
      handleFirestoreError(err, OperationType.GET, 'products_stream');
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, [categories.length]); // Re-run mapping when categories length changes

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
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No products found.</td></tr>
              ) : products.map(prod => (
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
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Main Image URL</label>
                <input required value={image} onChange={e=>setImage(e.target.value)} type="url" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secondary Image URLs (Comma Separated)</label>
                <textarea value={secondaryImages} onChange={e=>setSecondaryImages(e.target.value)} rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" placeholder="url1, url2, ..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Sizes (Comma Separated)</label>
                <input value={sizes} onChange={e=>setSizes(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" placeholder="XL, L, M, S" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"></textarea>
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
