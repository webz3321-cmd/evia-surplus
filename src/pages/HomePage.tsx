import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Search, SlidersHorizontal, ChevronRight, X, ShoppingCart, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catFilter = searchParams.get('cat');

  useEffect(() => {
    setLoading(true);
    
    // Listen to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      if (!snap.metadata.hasPendingWrites) setLoading(false);
    }, (err) => {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'categories_stream');
      setLoading(false);
    });

    // Listen to products
    const unsubProds = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      if (!snap.metadata.hasPendingWrites) setLoading(false);
    }, (err) => {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'products_stream');
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (catFilter) {
      result = result.filter(p => {
        const cat = categories.find(c => c.id === p.catId);
        return cat?.name.toLowerCase() === catFilter.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, catFilter, searchQuery, categories]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white p-4 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search lifestyle, fashion, home..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-10 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="bg-white border border-gray-200 p-3 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-10">
        
        {/* Main Banner */}
        <div className="relative rounded-[2rem] overflow-hidden bg-indigo-600 group">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
            alt="Hero" 
            className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
          />
          <div className="absolute inset-0 z-20 p-6 md:p-10 flex flex-col justify-center">
            <span className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2 animate-pulse">Limited Offer</span>
            <h2 className="text-white font-black text-2xl md:text-4xl leading-tight max-w-[200px] md:max-w-xs drop-shadow-lg">Refresh Your Style Today.</h2>
            <button className="mt-4 md:mt-6 bg-white text-indigo-900 font-bold px-6 py-2.5 rounded-full w-fit hover:bg-indigo-50 transition-all active:scale-95 shadow-xl">Explore Now</button>
          </div>
        </div>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-black text-lg text-gray-900 tracking-tight">Shop by Category</h2>
            <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:underline">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-2 no-scrollbar snap-x">
            {categories.map((c) => (
              <button 
                key={c.id} 
                onClick={() => navigate(`/?cat=${c.name}`)}
                className={`flex flex-col items-center gap-2 shrink-0 snap-start transition-all ${catFilter?.toLowerCase() === c.name.toLowerCase() ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`w-16 h-16 rounded-full p-0.5 border-2 ${catFilter?.toLowerCase() === c.name.toLowerCase() ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-gray-100'}`}>
                  <div className="w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className={`text-[11px] font-bold tracking-tight ${catFilter?.toLowerCase() === c.name.toLowerCase() ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Recently Added Section - Only show when no search/cat filter */}
        {!catFilter && !searchQuery && products.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-black text-lg text-gray-900 tracking-tight">Newly Arrived</h2>
              <div className="h-1 bg-indigo-600 rounded-full w-8"></div>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
              {products.slice(0, 6).map((p) => (
                <div 
                  key={`recent-${p.id}`} 
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="w-40 shrink-0 snap-start bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 truncate mb-1">{p.name}</h3>
                  <p className="text-indigo-600 font-black text-sm tracking-tight">₹{p.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Product Grid */}
        <section>
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex flex-col">
              <h2 className="font-black text-xl text-gray-900 tracking-tight">
                {catFilter ? `${catFilter} Selection` : searchQuery ? `Search: ${searchQuery}` : "Recommended for You"}
              </h2>
              <div className="flex gap-1 mt-1">
                <div className="w-8 h-1 bg-indigo-600 rounded-full"></div>
                <div className="w-2 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            {catFilter && (
              <button 
                onClick={() => navigate('/')} 
                className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <X size={12} /> Clear Filter
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                className="group bg-white border border-gray-100 rounded-[1.5rem] p-3 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col relative"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                {/* Visual Badges */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
                  {p.stock <= 5 && p.stock > 0 && (
                    <div className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase shadow-lg shadow-orange-100 animate-pulse">
                      Low Stock
                    </div>
                  )}
                  <div className="bg-white/90 backdrop-blur text-indigo-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase shadow-sm border border-indigo-50">
                    Trusted
                  </div>
                </div>

                {p.stock === 0 && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-[1.5rem]">
                    <div className="bg-gray-900 text-white text-xs font-black px-4 py-2 rounded-xl scale-110 shadow-xl">OUT OF STOCK</div>
                  </div>
                )}

                <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-2xl mb-4 overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                
                <div className="px-1 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest italic truncate max-w-[100px]">
                      {categories.find(c => c.id === p.catId)?.name || 'Fashion'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-black text-gray-400">★ 4.2</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 line-clamp-2 leading-tight mb-3 min-h-[40px] uppercase">
                    {p.name}
                  </h3>
                  
                  <div className="mt-auto flex items-end justify-between pt-2 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-gray-400 line-through decoration-red-400">₹{(p.price * 1.5).toLocaleString()}</span>
                      <span className="font-black text-lg text-gray-900 tracking-tight leading-none italic">₹{p.price.toLocaleString()}</span>
                    </div>
                    <div className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-indigo-100">
                      -30%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mb-6 border-4 border-white shadow-xl">
                <Search size={40} />
              </div>
              <h3 className="font-black text-2xl text-gray-900 mb-2 tracking-tight">No matching products</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">We searched everywhere but couldn't find a match. Try broadening your keywords or browse popular categories.</p>
              <button 
                onClick={() => { setSearchQuery(''); navigate('/'); }} 
                className="mt-8 font-black text-white bg-indigo-600 px-8 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                Back to Home
              </button>
            </div>
          )}
        </section>

        {/* Benefits Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center gap-3">
             <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner mt-[-10px] mb-2"><ShoppingCart size={24} /></div>
             <h4 className="text-sm font-bold text-gray-900">COD Available</h4>
             <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-none">Pay at Delivery</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center gap-3">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner mt-[-10px] mb-2"><MapPin size={24} /></div>
             <h4 className="text-sm font-bold text-gray-900">Fast Delivery</h4>
             <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-none">3-5 Days</p>
          </div>
          {/* ... and so on ... */}
        </div>
      </div>
    </div>
  );
}
