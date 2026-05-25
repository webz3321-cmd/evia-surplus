import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAppContext } from '../context';
import { ArrowLeft, Minus, Plus, ShoppingBag, Truck, RotateCcw, Shield, Share2, Heart, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';

import ProductReviews from '../components/ProductReviews';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setLoading(true);
      getDoc(doc(db, 'products', id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          const prodObj = { id: snap.id, ...data };
          setProduct(prodObj);
          
          if (data.catId) {
            getDoc(doc(db, 'categories', data.catId)).then(catSnap => {
              if (catSnap.exists()) {
                setCategory({ id: catSnap.id, ...catSnap.data() });
              }
            });

            // Retrieve related products in same category + cross-sell suggestions
            const qSameCat = query(
              collection(db, 'products'),
              where('catId', '==', data.catId),
              limit(8)
            );
            
            // Also suggest some pieces from other categories for "complete the look"
            const qAll = query(
              collection(db, 'products'),
              limit(20)
            );

            Promise.all([getDocs(qSameCat), getDocs(qAll)]).then(([snapSame, snapAll]) => {
              const sameCatList = snapSame.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(p => p.id !== id);
              
              const allList = snapAll.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(p => p.id !== id);
              
              const currentName = data.name.toLowerCase();
              const isTop = currentName.includes('shirt') || currentName.includes('jacket') || currentName.includes('tee') || currentName.includes('hoodie');
              const isPants = currentName.includes('pant') || currentName.includes('short') || currentName.includes('trouser') || currentName.includes('cargo');
              const isFootwear = currentName.includes('boot') || currentName.includes('shoe');

              // 1. Same Type items (e.g. other shirts)
              const sameType = allList.filter(p => {
                const n = p.name.toLowerCase();
                if (isTop && (n.includes('shirt') || n.includes('jacket') || n.includes('tee') || n.includes('hoodie'))) return true;
                if (isPants && (n.includes('pant') || n.includes('short') || n.includes('trouser') || n.includes('cargo'))) return true;
                if (isFootwear && (n.includes('boot') || n.includes('shoe'))) return true;
                return false;
              });

              // 2. Complementary items (The "Complete the Look" logic)
              const complementary = allList.filter(p => {
                const n = p.name.toLowerCase();
                if (isTop && (n.includes('pant') || n.includes('short') || n.includes('trouser') || n.includes('cargo'))) return true;
                if (isPants && (n.includes('shirt') || n.includes('jacket') || n.includes('tee') || n.includes('hoodie'))) return true;
                if (isFootwear && (n.includes('pant') || n.includes('trouser'))) return true;
                return false;
              });

              // Interleave: [SameType_1, Complementary_1, SameType_2, Complementary_2, ...]
              const combined: any[] = [];
              for (let i = 0; i < 4; i++) {
                if (sameType[i]) combined.push(sameType[i]);
                if (complementary[i]) combined.push(complementary[i]);
              }
              
              // Unique and limit to 8
              const finalRelated = combined
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
                .slice(0, 8);
              
              setRelatedProducts(finalRelated);
            });
          }
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest text-[#9333ea] animate-pulse">Syncing...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <p className="mt-2 text-sm text-muted-foreground font-light">The piece you are attempting to view is not in our archives.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-widest text-primary-foreground">Back to catalog</Link>
      </div>
    );
  }

  const allImages = [product.image, ...(product.secondaryImages || [])].filter(Boolean);

  const handleAddToCart = (directCheckout = false) => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addToCart(product, quantity, selectedSize || undefined);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);

    if (directCheckout) {
      navigate('/cart');
    } else {
      toast.success('Successfully added to bag');
    }
  };

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Editorial Breadcrumbs */}
        <nav className="mb-8 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground capitalize">{category?.name || 'Archive'}</span>
            <span>/</span>
            <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{product.name}</span>
          </div>
          
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold"
          >
            <ArrowLeft size={12} /> Go Back
          </button>
        </nav>

        {/* Dynamic Presentation Layout */}
        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl bg-surface border border-border/50">
              <img 
                src={allImages[activeImageIndex]} 
                alt={product.name} 
                className="aspect-[4/5] w-full object-cover transition-all duration-[800ms] hover:scale-102"
              />
            </div>
            
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((src, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`aspect-square overflow-hidden rounded-lg bg-surface border transition-all ${
                      activeImageIndex === i ? 'border-foreground opacity-100 scale-102 shadow-sm' : 'border-border/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Specifications & Purchase Form */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                {category?.name || 'Exclusive artifact'}
              </p>
              
              <div className="flex gap-1">
                <button 
                  onClick={shareProduct} 
                  className="rounded-full p-2 hover:bg-secondary text-foreground transition-colors"
                  aria-label="Share product"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button 
                  className="rounded-full p-2 hover:bg-secondary text-foreground transition-all active:scale-90"
                  aria-label="Wishlist"
                  onClick={() => {
                    if (isInWishlist(product.id)) {
                      removeFromWishlist(product.id);
                      toast.success('Removed from saved items');
                    } else {
                      addToWishlist(product);
                      toast.success('Added to saved items / Whistel!', { icon: '❤️' });
                    }
                  }}
                >
                  <Heart className={`h-4 w-4 transition-colors ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-stone-550'}`} />
                </button>
              </div>
            </div>

            <h1 className="mt-3 font-display text-4xl text-foreground leading-none sm:text-5xl capitalize">
              {product.name}
            </h1>
            
            <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
              {product.productType === 'rent' ? 'Seasonal rental edition · hand-washed and ironed carefully before shipping.' : 'Considered essential apparel · crafted with organic, long-lasting fabrics.'}
            </p>

            <div className="mt-6 flex items-center gap-3 border-b border-border pb-1 flex-wrap">
              <span className="text-3xl font-extrabold text-stone-950">₹{product.price.toLocaleString()}</span>
              {product.price > 100 && (() => {
                const originalPrice = product.originalPrice || Math.round(product.price * 1.35);
                const discountPercent = product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 25;
                return (
                  <>
                    <span className="text-base text-stone-400 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 font-extrabold text-xs px-2.5 py-1 rounded-full whitespace-nowrap">
                      {discountPercent}% Off
                    </span>
                  </>
                );
              })()}
            </div>
            
            {/* Dynamic GST spec breakdown badge */}
            {(() => {
              const cgstPercent = typeof product.cgstRate === 'number' ? product.cgstRate : 9;
              const sgstPercent = typeof product.sgstRate === 'number' ? product.sgstRate : 9;
              const totalTaxPercent = cgstPercent + sgstPercent;
              return (
                <div className="mt-2 text-[10.5px] text-gray-500 font-mono flex items-center gap-1.5 flex-wrap border-b border-border pb-6 select-none">
                  <span className="bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded text-[9.5px] uppercase tracking-wider">Inclusive of GST</span>
                  <span>•</span>
                  <span>CGST: {cgstPercent}%</span>
                  <span>•</span>
                  <span>SGST: {sgstPercent}%</span>
                  <span>•</span>
                  <span className="font-semibold text-gray-700">Total Tax: {totalTaxPercent}%</span>
                </div>
              );
            })()}

            {/* Product Purchase options states */}
            <div className="mt-6 space-y-6">
              {/* Sizes list matching evia style */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">Select size</p>
                    <button onClick={() => alert("Size guidelines: standard regular fit. Select your standard size.")} className="text-[10px] text-accent underline underline-offset-2">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((s: string) => (
                      <button 
                        key={s} 
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-12 h-11 px-4 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all ${
                          selectedSize === s 
                            ? "border-foreground bg-foreground text-background scale-102" 
                            : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selectors */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">Quantity</p>
                <div className="inline-flex items-center rounded-full border border-border bg-background">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="p-3.5 hover:text-foreground text-muted-foreground transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="p-3.5 hover:text-foreground text-muted-foreground transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Add and Buy buttons */}
              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <button
                  disabled={product.stock === 0}
                  onClick={() => handleAddToCart(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-foreground bg-background py-4 text-xs font-semibold uppercase tracking-widest text-foreground transition-all hover:bg-secondary disabled:opacity-50"
                >
                  {added ? <><Check className="h-4 w-4" /> Added to bag</> : <><ShoppingBag className="h-4 w-4" /> Add to bag</>}
                </button>

                <button
                  disabled={product.stock === 0}
                  onClick={() => handleAddToCart(true)}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-primary py-4 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50 shadow-sm"
                >
                  Buy now · ₹{(product.price * quantity).toLocaleString()}
                </button>
              </div>
            </div>

            {/* Description Details segment */}
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">Details & Story</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-light">{product.description}</p>
            </div>

            {/* Value cards strip */}
            <ul className="mt-8 grid gap-3.5 text-xs text-muted-foreground border-t border-border pt-6">
              {[
                { i: Truck, t: "Free shipping over ₹1,500" },
                { i: Shield, t: "Quality assurance guarantee" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-foreground shrink-0" /> 
                  <span className="font-light">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Community Feedback Section */}
        {product && (
          <ProductReviews productId={product.id} />
        )}

        {/* Related Items Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-28 border-t border-border pt-20">
            <div className="flex items-end justify-between gap-4 mb-10 px-2 sm:px-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A38A5F]">Acquisition pairings</span>
                <h2 className="mt-2 font-display text-4xl text-foreground lowercase">related<span className="text-muted-foreground/30">.</span>pieces</h2>
              </div>
              <Link to="/" className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground hover:opacity-70 transition-opacity border-b border-foreground/20 pb-0.5">Browse Index</Link>
            </div>
            
            {/* Horizontal scroll container with hidden scrollbar for professional look */}
            <div className="relative group/scroll">
              <div className="flex gap-x-6 overflow-x-auto pb-10 scrollbar-hide snap-x snap-mandatory px-2 sm:px-0 scroll-smooth">
                {relatedProducts.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => { navigate(`/product/${p.id}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="flex-none w-[260px] sm:w-[280px] snap-start group cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-surface border border-border/40 transition-all duration-500 group-hover:shadow-2xl group-hover:border-foreground/10 group-hover:-translate-y-2">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110" 
                      />
                      
                      {/* Professional subtle overlay badge */}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
                          {p.price > 12000 ? 'Exclusive' : 'Limited'}
                        </span>
                      </div>

                      {/* Quick view hint on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                         <span className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl">View Piece</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-1">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-[13px] text-foreground font-semibold leading-tight capitalize group-hover:text-[#A38A5F] transition-colors">{p.name}</h3>
                        <span className="text-[13px] font-bold text-foreground">₹{p.price.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                        {Math.floor(Math.random() * 5) + 1} SIZES REMAINING
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
