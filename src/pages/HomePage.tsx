import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catFilter = searchParams.get('cat');

  useEffect(() => {
    getDocs(collection(db, 'categories')).then(snap => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    getDocs(collection(db, 'products')).then(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const filteredProducts = catFilter 
    ? products.filter(p => categories.find(c => c.id === p.catId)?.name.toLowerCase() === catFilter.toLowerCase())
    : products;

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Categories Horizontal Scroll */}
      <section>
        <h2 className="font-bold text-lg mb-3">Categories</h2>
        <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
          {categories.map((c) => (
            <div 
              key={c.id} 
              onClick={() => navigate(`/?cat=${c.name}`)}
              className="snap-start flex flex-col items-center gap-1 shrink-0 cursor-pointer min-w-[70px]"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 overflow-hidden shadow-sm border border-indigo-100">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold text-center mt-1 text-gray-700">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm tracking-wide">{catFilter ? `${catFilter} Products` : 'Featured Products'}</h2>
          <button onClick={() => navigate(catFilter ? '/' : '/')} className="text-xs text-indigo-600 font-black tracking-wide">{catFilter ? 'Clear' : 'See All'}</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm flex flex-col cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="w-full aspect-square bg-gray-50 rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="px-1 flex flex-col flex-1">
                <h3 className="font-bold text-[11px] text-gray-900 truncate mb-1">{p.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-black text-[12px] text-indigo-600 tracking-tight">₹{p.price.toLocaleString()}</span>
                </div>
                <button className="w-full mt-2 py-1.5 bg-gray-900 hover:bg-black text-white text-[10px] font-bold rounded-lg transition-colors">Details</button>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500">No products found.</div>
        )}
      </section>
    </div>
  );
}
