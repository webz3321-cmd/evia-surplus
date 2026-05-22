import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Search, SlidersHorizontal, ChevronRight, X, Truck, RotateCcw, Shield, Mail, ArrowRight } from 'lucide-react';

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
    <div className="bg-background min-h-screen">
      {/* Editorial Search Bar Strip */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search garments, accessories, home..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-transparent rounded-full py-2.5 pl-10 pr-10 text-xs font-medium outline-none focus:bg-background focus:border-border transition-all uppercase tracking-wider"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {catFilter && (
              <button 
                onClick={() => navigate('/')}
                className="text-[10px] font-semibold uppercase tracking-widest text-[#9333ea] bg-purple-50 hover:bg-purple-100 border border-purple-100 px-4 py-2 rounded-full transition-all flex items-center gap-1"
              >
                <X size={11} /> Clear Filter ({catFilter})
              </button>
            )}
            <button className="flex items-center gap-2 border border-border bg-background px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-surface transition-colors">
              <SlidersHorizontal size={14} /> Filter
            </button>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div className="relative z-10 flex flex-col items-start text-left">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">Considered Design · 2026</span>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              The quiet shop for things <em className="italic">worth keeping.</em>
            </h1>
            <p className="mt-6 max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground font-light">
              Apparel, accessories and objects, made in small runs from natural materials. Designed to be lived in, repaired, and passed on.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button 
                onClick={() => {
                  const el = document.getElementById("catalog");
                  el?.scrollIntoView({ behavior: "smooth" });
                }} 
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
              >
                Shop the collection <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => alert("Our story: handcrafting slow garments using local workshops.")}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
              >
                Our story
              </button>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=900" 
              alt="Evia autumn collection study" 
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)] border border-border" 
            />
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

      {/* Dynamic Categories Selector */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Collections</span>
          <h2 className="mt-2 font-display text-4xl text-foreground">Shop by Category</h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className={`rounded-full border px-6 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-all ${
              !catFilter ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            All Pieces
          </button>
          {categories.map((c) => {
            const active = catFilter?.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/?cat=${c.name}`)}
                className={`rounded-full border px-6 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-all capitalize ${
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Catalog Section */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Selected Works</span>
            <h2 className="mt-2 font-display text-4xl text-foreground md:text-5xl capitalize">
              {catFilter ? `${catFilter} garments` : searchQuery ? `Search Results` : "New arrivals"}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-light">{filteredProducts.length} premium objects listed</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Gathering archive...</p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => navigate(`/product/${p.id}`)}
                className="group cursor-pointer block"
              >
                {/* Product Image Stage */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface border border-border/40">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  
                  {/* Stock status badges */}
                  <div className="absolute left-3 top-3 flex flex-col gap-1">
                    {p.stock <= 5 && p.stock > 0 && (
                      <span className="rounded-full bg-orange-600 px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-white">
                        Few Left
                      </span>
                    )}
                    {p.stock === 0 && (
                      <span className="rounded-full bg-black/80 px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur">
                        Hold
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Metadata info */}
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                      {categories.find(c => c.id === p.catId)?.name || "archive"}
                    </p>
                    <h3 className="mt-1 text-sm text-foreground group-hover:opacity-80 transition-opacity capitalize font-medium tracking-tight">
                      {p.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">₹{p.price.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground font-light">Original price</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h3 className="font-display text-3xl text-foreground">No pieces discovered</h3>
            <p className="text-muted-foreground text-sm font-light mt-2 max-w-sm">
              We couldn't locate any matching pieces. Try selecting another collection filter or clear search filters.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); navigate('/'); }} 
              className="mt-6 font-semibold text-[10px] uppercase tracking-widest text-primary-foreground bg-primary px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Examine entire collection
            </button>
          </div>
        )}
      </section>

      {/* Editorial Spread */}
      <section className="bg-surface border-y border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center">
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400" 
              alt="Handcraft leather workshop product" 
              className="w-full h-full aspect-square rounded-xl object-cover border border-border" 
            />
            <img 
              src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400" 
              alt="Drape and apparel close-up study" 
              className="w-full h-full aspect-square rounded-xl object-cover border border-border mt-10" 
            />
          </div>
          
          <div className="lg:pl-10">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">The Studio</span>
            <h2 className="mt-4 font-display text-4xl text-foreground sm:text-5xl leading-none">
              A small team, working slowly, on purpose.
            </h2>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed font-light">
              Every piece is developed with a single mill or workshop and produced in limited quantities. We list provenance, materials, and the people behind every product — and we tell you when something is going to take a little longer to make.
            </p>
            <button 
              onClick={() => alert("Our workshops list: Porto (Footwear), Tuscany (Leather), Biella (Wool Knit), and Jaipur (Block prints).")}
              className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground hover:opacity-80 transition-opacity"
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
