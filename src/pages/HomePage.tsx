import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { db } from '../lib/firebase';
import { collection, onSnapshot, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Search, SlidersHorizontal, ChevronRight, X, Truck, RotateCcw, Shield, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper function to normalize text for consistent searches (hyphens, spaces, punctuation)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/-/g, ' ') // convert hyphens to space (e.g., t-shirt -> t shirt)
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // strip other punctuation
    .replace(/\s+/g, ' ') // collapse multi spaces
    .trim();
};

// Synonym mapping to match alternative search terms like Meesho
const getSynonyms = (word: string): string[] => {
  const w = word.toLowerCase().trim();
  if (['tshirt', 't-shirt', 'tee', 't-shirts', 'tshirts', 't shirt', 'tshirts'].includes(w) || w.startsWith('t-sh') || w.startsWith('tsh')) {
    return ['tshirt', 't-shirt', 't shirt', 'tee', 'tshirts', 't-ships', 'shir'];
  }
  if (['pant', 'pants', 'trouser', 'trousers', 'cargo', 'cargos', 'jeans', 'jean', 'lower', 'lowers'].includes(w)) {
    return ['pant', 'pants', 'trouser', 'trousers', 'cargo', 'cargos', 'jeans', 'lower', 'lowers'];
  }
  if (['shirt', 'shirts'].includes(w)) {
    return ['shirt', 'shirts'];
  }
  if (['watch', 'watches', 'analog', 'smartwatch'].includes(w)) {
    return ['watch', 'watches', 'analog', 'clock'];
  }
  if (['shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sneakers', 'footwear'].includes(w)) {
    return ['shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sneakers', 'footwear'];
  }
  if (['coat', 'jacket', 'jackets', 'coats', 'outerwear', 'windbreaker', 'parka'].includes(w)) {
    return ['coat', 'jacket', 'jackets', 'coats', 'outerwear', 'windbreaker', 'parka', 'hoodie'];
  }
  if (['women', "women's", 'woman', 'lady', 'ladies', 'girl', 'girls', 'female'].includes(w)) {
    return ['women', 'woman', 'lady', 'ladies', 'girl', 'girls', 'female', 'kurtis', 'kurti', 'saree', 'lehnga', 'tops'];
  }
  if (['men', "men's", 'man', 'gentleman', 'gentlemen', 'boy', 'boys', 'male', 'menswear'].includes(w)) {
    return ['men', 'man', 'gentleman', 'gentlemen', 'boy', 'boys', 'male', 'menswear', 'gentle'];
  }
  if (w.endsWith('s') && w.length > 3) {
    return [w, w.slice(0, -1)];
  }
  return [w];
};

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catFilter = searchParams.get('cat');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Handle manual/checkbox toggle for multicategory filter
  const handleCategoryToggle = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(prev => prev.filter(cId => cId !== id));
    } else {
      setSelectedCategories(prev => [...prev, id]);
    }
  };

  // Sync URL catFilter param on load or change
  useEffect(() => {
    if (catFilter && categories.length > 0) {
      const match = categories.find(c => c.name.toLowerCase() === catFilter.toLowerCase());
      if (match && !selectedCategories.includes(match.id)) {
        setSelectedCategories([match.id]);
      }
    }
  }, [catFilter, categories]);

  useEffect(() => {
    // Listen to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'categories_stream');
      setLoading(false);
    });

    // Listen to products
    const unsubProds = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'products_stream');
      setLoading(false);
    });

    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });

    return () => {
      unsubCats();
      unsubProds();
      unsubSettings();
    };
  }, []);

  // Compute live quantities of inventory per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.catId) {
        counts[p.catId] = (counts[p.catId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Filter by category checkbox state selection
    if (selectedCategories.length > 0) {
      result = result.filter(p => p.catId && selectedCategories.includes(p.catId));
    } else if (catFilter) {
      // Fallback to catFilter URL search parameter if state hasn't been modified yet
      result = result.filter(p => {
        const cat = categories.find(c => c.id === p.catId);
        return cat?.name.toLowerCase() === catFilter.toLowerCase();
      });
    }

    // 2. Clearer, perfectly matching search checker (handles 't shirt', 'pant', etc.)
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeText(searchQuery);
      const queryWords = normalizedQuery.split(' ').filter(Boolean);

      result = result.filter(p => {
        const pNameNormalized = normalizeText(p.name);
        const catName = p.categoryName || categories.find(c => c.id === p.catId)?.name || '';
        const pCatNormalized = normalizeText(catName);
        const pDescNormalized = normalizeText(p.description || '');
        const pTagsNormalized = (p.tags || []).map((t: string) => normalizeText(t)).join(' ');

        const productCombinedText = `${pNameNormalized} ${pCatNormalized} ${pDescNormalized} ${pTagsNormalized}`;

        // Direct whole phrase query match
        if (productCombinedText.includes(normalizedQuery)) {
          return true;
        }

        // Tokenized matching with smart synonym expansion
        const matchesAllWords = queryWords.every(word => {
          if (productCombinedText.includes(word)) {
            return true;
          }
          const synonyms = getSynonyms(word);
          return synonyms.some(syn => productCombinedText.includes(syn));
        });

        return matchesAllWords;
      });
    }

    // 3. Sort ordering of search results
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => {
        const ra = 4.0 + (products.indexOf(a) % 10) * 0.1;
        const rb = 4.0 + (products.indexOf(b) % 10) * 0.1;
        return rb - ra;
      });
    } else if (sortBy === 'popular') {
      result.sort((a, b) => {
        const ra = 12 + (products.indexOf(a) * 7) % 85;
        const rb = 12 + (products.indexOf(b) * 7) % 85;
        return rb - ra;
      });
    }

    return result;
  }, [products, catFilter, selectedCategories, searchQuery, categories, sortBy]);


  return (
    <div className="bg-background min-h-screen">
      {/* Responsive Premium Search Bar Strip */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search military issue, utility gear..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const el = document.getElementById("catalog");
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
              className="w-full bg-surface border border-transparent rounded-full py-3.5 pl-11 pr-11 text-xs font-medium outline-none focus:bg-background focus:border-border transition-all uppercase tracking-wider"
              style={{ minHeight: '44px' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}

            {/* Meesho style responsive suggestions dropdown */}
            {searchFocused && (
              <div className="absolute left-0 mt-2 w-full bg-white border border-stone-250 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1 select-none">
                    🔥 Trending Searches
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['t shirt', 'pants', 'watches', 'shoes', 'jacket'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          const el = document.getElementById("catalog");
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-[10px] bg-stone-100 hover:bg-purple-100 hover:text-purple-700 transition-colors px-3 py-1.5 rounded-full font-bold text-stone-600 capitalize cursor-pointer"
                        style={{ minHeight: '32px' }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {searchQuery.trim().length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 select-none">
                      🛍&nbsp;Matching Surplus Products ({filteredProducts.slice(0, 5).length})
                    </p>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                      {filteredProducts.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSearchQuery(p.name);
                            navigate(`/product/${p.id}`);
                          }}
                          className="w-full text-left text-xs text-stone-700 hover:text-purple-700 font-bold py-1.5 px-2 rounded-lg hover:bg-stone-50 transition-all flex items-center gap-2"
                        >
                          <img src={p.image} className="w-6 h-6 rounded object-cover shrink-0 border border-stone-200" referrerPolicy="no-referrer" />
                          <span className="truncate capitalize">{p.name}</span>
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <p className="text-stone-400 text-[10px] italic py-1 pl-2 select-none">No exact matches found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            {catFilter && (
              <button 
                onClick={() => navigate('/')}
                className="text-[10.5px] font-semibold uppercase tracking-widest text-[#9333ea] bg-purple-50 hover:bg-purple-100 border border-purple-100 px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 shrink-0"
                style={{ minHeight: '40px' }}
              >
                <X size={12} /> Clear Filter ({catFilter})
              </button>
            )}
            <button 
              onClick={() => {
                setFiltersExpanded(!filtersExpanded);
                const el = document.getElementById("catalog-filters");
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 border border-border bg-background px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-surface transition-colors"
              style={{ minHeight: '40px' }}
            >
              <SlidersHorizontal size={14} /> {filtersExpanded ? "Hide Filters" : "Filters & Sort"}
            </button>
          </div>
        </div>
      </section>

      {/* Responsive Mobile-Perfect Hero Section */}
      <section className="relative overflow-hidden bg-surface border-b border-border">
        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-16 md:py-24 sm:px-6">
          <div className="flex flex-col-reverse md:grid md:grid-cols-12 items-center gap-8 md:gap-12">
            
            {/* Content Column */}
            <div className="w-full md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9333ea] bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-150 select-none">
                {settings?.heroTag || "Meesho Verified Supplier · 100% Quality"}
              </span>
              <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-[1.15] sm:leading-[1.1] text-stone-900 tracking-tight font-extrabold">
                {settings?.heroTitle ? (
                  <span>{settings.heroTitle}</span>
                ) : (
                  <>Vintage military <em className="italic text-[#9333ea]">fashion surplus.</em></>
                )}
              </h1>
              <p className="mt-3.5 sm:mt-6 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-stone-500 font-light">
                {settings?.heroDesc || "Sourced globally, curated for life. We grade and catalog premium menswear garments and cold-weather clothing built to industrial specs."}
              </p>
              
              <div className="mt-6 sm:mt-8 flex flex-row items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto">
                <button 
                  onClick={() => {
                    const el = document.getElementById("catalog");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }} 
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-[#111] px-6 py-3.5 sm:px-8 sm:py-4 text-xs font-bold uppercase tracking-widest text-[#fff] hover:bg-stone-800 transition-all hover:shadow shadow-sm active:scale-95"
                  style={{ minHeight: '46px' }}
                >
                  Shop Catalog <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => alert("Our story: sourcing authentic, indestructible military salvage and vintage workwear with rich historical narratives.")}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-250 bg-background px-6 py-3.5 sm:px-8 sm:py-4 text-xs font-bold uppercase tracking-widest text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
                  style={{ minHeight: '46px' }}
                >
                  Our Story
                </button>
              </div>
            </div>
            
            {/* High-Fidelity Responsive Image Column */}
            <div className="w-full md:col-span-5 relative animate-in fade-in duration-500">
              <img 
                src={settings?.heroImage || "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=900"} 
                alt="Evia military surplus close-up" 
                className="aspect-[3/4] w-full rounded-2xl object-cover object-top shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] border border-[#efece6]" 
              />
            </div>

          </div>
        </div>

        {/* Meesho Genuine Quality Trust badges */}
        <div className="bg-purple-50/40 border-t border-purple-100 py-3.5 select-none">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-semibold text-stone-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#9333ea] text-xs sm:text-sm">✓</span>
              <span>7 Days Easy Returns</span>
            </div>
            <div className="h-3.5 w-[1px] bg-purple-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#9333ea] text-xs sm:text-sm">💵</span>
              <span>Cash on Delivery</span>
            </div>
            <div className="h-3.5 w-[1px] bg-purple-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#9333ea] text-xs sm:text-sm">🏷️</span>
              <span>Lowest Price Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Strip */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-3">
          {[
            { i: Truck, t: "Free Shipping Over $150", s: "Carbon-neutral delivery, worldwide." },
            { i: RotateCcw, t: "30-Day Free Returns", s: "Easy, hassle-free returns program." },
            { i: Shield, t: "Made to Last Forever", s: "Lifetime repair warranty on every order." },
          ].map(({ i: Icon, t, s }) => (
            <div key={t} className="flex items-start gap-4">
              <div className="rounded-full bg-secondary p-3"><Icon className="h-4 w-4 text-foreground" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground uppercase tracking-wider">{t}</p>
                <p className="text-xs text-muted-foreground leading-relaxed font-light mt-0.5">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Meesho Style Category Bubbles Section - Premium Aligned Selector */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 bg-background">
        <div className="mb-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9333ea] bg-purple-50 px-3 py-1 rounded-full border border-purple-100 select-none">
              🏷️ Shop by Category
            </span>
          </div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Featured Collections</h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Tap a collection below to instantly load and filter the corresponding tactical gear and military-grade supplies.
          </p>
        </div>

        {/* Responsive scrollable/wrappable category list replicating Meesho look */}
        <div className="relative w-full py-2">
          {categories.length > 0 ? (
            <div className="flex gap-5 sm:gap-7 overflow-x-auto pb-4 pt-1 justify-start md:justify-center scroll-smooth scrollbar-none select-none">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <div 
                    key={cat.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories([]);
                      } else {
                        setSelectedCategories([cat.id]);
                      }
                      const el = document.getElementById("catalog");
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group cursor-pointer flex flex-col items-center shrink-0 w-[84px] sm:w-[108px] text-center"
                  >
                    {/* Arch shaped image card EXACTLY like Meesho (Arch shape with soft background tint) */}
                    <div className={`relative w-[80px] h-[96px] sm:w-[100px] sm:h-[120px] rounded-t-full rounded-b-3xl transition-all duration-300 flex items-center justify-center p-0.5 overflow-hidden bg-gradient-to-b from-[#fdf7ff] via-[#f7ebff] to-[#f0dbff] ${
                      isSelected 
                        ? 'ring-4 ring-[#9333ea] scale-105 shadow-[0_8px_20px_rgba(147,51,234,0.15)]' 
                        : 'shadow-[0_4px_10px_rgba(0,0,0,0.02)] group-hover:scale-105 group-hover:shadow-[0_6px_14px_rgba(147,51,234,0.06)]'
                    }`}>
                      <img 
                        src={cat.image || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300"} 
                        alt={cat.name} 
                        className="w-full h-full object-cover rounded-t-full rounded-b-3xl transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                        }}
                      />
                    </div>
                    
                    {/* Centered Label beneath the arch structure */}
                    <span className={`mt-3 text-[11px] sm:text-xs font-bold tracking-tight capitalize leading-tight truncate max-w-[84px] sm:max-w-[108px] transition-colors ${
                      isSelected ? 'text-[#9333ea]' : 'text-stone-700 group-hover:text-[#9333ea]'
                    }`}>
                      {cat.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic py-6 text-center select-none bg-white/40 rounded-2xl">
              No categories added yet. Visit the Admin Panel to create some.
            </p>
          )}
        </div>
      </section>

      {/* Main Catalog Section */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 border-t border-border">
        {/* Title and stats summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9333ea]">Sourced Premium Inventory</span>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl text-foreground capitalize tracking-tight flex items-center gap-2">
              {searchQuery ? (
                <>Search results for <span className="font-semibold text-primary underline decoration-indigo-500/30">"{searchQuery}"</span></>
              ) : selectedCategories.length > 0 ? (
                <>Selected Collections</>
              ) : (
                <>All Authentic Surplus</>
              )}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-semibold bg-stone-100/80 px-4 py-2 rounded-full border border-stone-200/50">
            {filteredProducts.length} items found
          </p>
        </div>

        {/* Meesho Layout: Left Side Sorter & Filters + Right Side Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8" id="catalog-filters">
          {/* Left Column: Sorter & Category Checkboxes */}
          <div className={`md:col-span-1 flex flex-col gap-6 ${filtersExpanded ? 'block' : 'hidden md:flex'}`}>
            
            {/* Sort Box */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Sort by</h3>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-700 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer accent-indigo-600"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="popular">Popularity</option>
                </select>
              </div>
            </div>

            {/* Filters Box */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">Filters</h3>
                {(selectedCategories.length > 0 || searchQuery || sortBy !== 'relevance') && (
                  <button 
                    onClick={() => {
                      setSelectedCategories([]);
                      setSearchQuery('');
                      setSortBy('relevance');
                      navigate('/');
                    }}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-widest transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Dropdown and checklist */}
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Category</h4>
                <div className="flex flex-col gap-2">
                  {categories.map((c) => {
                    const count = categoryCounts[c.id] || 0;
                    const isChecked = selectedCategories.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center gap-3 py-1 px-1.5 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer select-none ${isChecked ? 'bg-indigo-50/20' : ''}`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCategoryToggle(c.id)}
                          className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-semibold text-stone-700 capitalize leading-tight">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                            {count}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                  {categories.length === 0 && (
                    <p className="text-[11px] text-stone-400 italic">No collections registered.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Grid listings of products matched */}
          <div className="md:col-span-3">
            {loading && products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-2xl border border-stone-200/50">
                <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] uppercase tracking-widest text-[#9333ea] animate-pulse font-extrabold font-mono">Gathering archive...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs">
                <h3 className="font-display text-2xl text-stone-805">No pieces discovered</h3>
                <p className="text-stone-500 text-xs font-light mt-2 max-w-sm leading-relaxed">
                  We couldn't locate any matching garments. Try searching with other tags, deselect checkboxes, or clear matches.
                </p>
                <button 
                  onClick={() => { 
                    setSelectedCategories([]);
                    setSearchQuery(''); 
                    setSortBy('relevance');
                    navigate('/'); 
                  }} 
                  className="mt-6 font-bold text-[10px] uppercase tracking-widest text-[#fff] bg-[#111] px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                >
                  Clear all search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((p, idx) => {
                  const simulatedRating = (4.0 + (idx % 10) * 0.1).toFixed(1);
                  const simulatedReviews = 11 + (idx * 11) % 94;
                  const originalPrice = Math.round(p.price * 1.35);
                  const discountPercent = 25;

                  return (
                    <div 
                      key={p.id} 
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="group cursor-pointer flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 select-none">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-750 ease-out group-hover:scale-103"
                        />
                        <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
                          {p.stock <= 5 && p.stock > 0 && (
                            <span className="rounded bg-orange-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                              Few Left
                            </span>
                          )}
                          {p.stock === 0 && (
                            <span className="rounded bg-stone-900 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                              Sold out
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Frame */}
                      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-stone-400 font-extrabold mb-1">
                            {categories.find(c => c.id === p.catId)?.name || p.categoryName || "Surplus Collection"}
                          </p>
                          <h3 className="text-xs sm:text-xs font-semibold text-stone-800 group-hover:text-indigo-600 transition-colors capitalize tracking-tight line-clamp-2 min-h-[32px] leading-tight font-sans">
                            {p.name}
                          </h3>
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-emerald-600 text-white rounded px-1.5 py-0.5 text-[9px] font-bold inline-flex items-center gap-0.5">
                              {simulatedRating} <span className="text-[8px]">★</span>
                            </span>
                            <span className="text-[9px] text-stone-400 font-semibold">
                              ({simulatedReviews} Reviews)
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-stone-100">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-stone-900">
                              ₹{p.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-stone-400 line-through">
                              ₹{originalPrice.toLocaleString()}
                            </span>
                            <span className="text-emerald-600 font-bold text-[10px]">
                              {discountPercent}% Off
                            </span>
                          </div>
                          <p className="text-[9px] text-[#9333ea] font-semibold mt-1">Special Price Enabled</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Spread */}
      <section className="bg-surface border-y border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center">
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=400" 
              alt="Heavy-duty military grade boots" 
              className="w-full h-full aspect-square rounded-xl object-cover border border-border" 
            />
            <img 
              src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400" 
              alt="Tactical mountain rucksack detail" 
              className="w-full h-full aspect-square rounded-xl object-cover border border-border mt-10" 
            />
          </div>
          
          <div className="lg:pl-10">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">Sourcing Protocol</span>
            <h2 className="mt-4 font-display text-4xl text-foreground sm:text-5xl leading-none">
              Indestructible garments, salvaged for the modern collector.
            </h2>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed font-light">
              Every item in our collection is hand-inspected for physical integrity, original military contract markings, and historical authenticity. We specialize in salvage stock from the 1950s to the 1980s — heavy wools, authentic herringbone denim, and bulletproof military sateen cotton.
            </p>
            <button 
              onClick={() => alert("Salvaged Stock Provenance: US Armed Forces (M-65, OG-107), British Commonwealth (Wool Combat), and French Foreign Legion.")}
              className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground hover:opacity-80 transition-opacity cursor-pointer"
            >
              Verify provenance <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h2 className="font-display text-4xl text-foreground sm:text-5xl">Letters from the studio</h2>
        <p className="mt-4 text-muted-foreground font-light text-sm">New releases, restocks, and the occasional essay. No noise or marketing slop.</p>
        <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); alert("Subscribed!"); }}>
          <input 
            type="email" 
            required 
            placeholder="you@example.com"
            className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-xs uppercase tracking-wider outline-none focus:border-foreground transition-colors" 
          />
          <button className="rounded-full bg-primary px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90">
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
