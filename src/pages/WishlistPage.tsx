import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { Heart, ShoppingCart, Trash2, ArrowLeft, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useAppContext();
  const navigate = useNavigate();

  const handleAddToCart = (product: any) => {
    // Check if sizes are available, of so pick first, else undefined
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    addToCart(product, 1, size);
    toast.success(`"${product.name}" added to cart!`, { icon: '🛒' });
  };

  const clearAllSaved = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach(item => {
      removeFromWishlist(item.id);
    });
    toast.success('Your Whistel/Wishlist Archive has been fully cleared.');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 font-sans antialiased text-[#1c1c1c]">
      {/* Editorial Spread Header */}
      <div className="bg-stone-900 text-white py-16 px-6 relative overflow-hidden">
        {/* Ambient grids */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.25em] block mb-2">SECURE SAVED UTILITY INDEX</span>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-stone-100">
                WHISTEL ARCHIVE <span className="font-light text-stone-400">/ Saved Items</span>
              </h1>
              <p className="mt-4 text-sm text-stone-300 max-w-xl font-light leading-relaxed">
                Your personal curated grade reservoir. These items are reserved for provenance tracking, custom requisition, or quick checkouts.
              </p>
            </div>
            {wishlist.length > 0 && (
              <button 
                onClick={clearAllSaved}
                className="px-5 py-2.5 bg-stone-820 hover:bg-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-stone-800 transition-colors flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <Trash2 size={13} /> Clear Entire Index
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {wishlist.length === 0 ? (
          /* High Craft Empty State */
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mb-6 border border-stone-200 shadow-inner">
              <Heart size={28} className="stroke-1" />
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">No Items Curated Yet</h3>
            <p className="text-sm text-stone-550 mt-2 max-w-md font-light leading-relaxed">
              Your Whistel/Saved list is currently empty. Deep-dive into our heavy-duty catalogs or vintage military salvage fields and tap the heart icon on any premium utilities to save them here for offline tracking.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="mt-8 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Start Sourcing & Browse Catalog <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Products Grid with absolute detail */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((product) => {
              const isSale = product.discountPrice && product.discountPrice < product.price;

              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-full group"
                >
                  {/* Image View */}
                  <div className="relative aspect-square w-full bg-stone-100 overflow-hidden border-b border-stone-100">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : product.image || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400"}
                      alt={product.name}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    />

                    {/* Stock status badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      {product.stock <= 0 ? (
                        <span className="bg-red-100 text-red-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                          DEPLETED
                        </span>
                      ) : product.stock < 5 ? (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                          LOW CRITICAL SURPLUS ({product.stock})
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider border border-emerald-100">
                          VERIFIED SURPLUS STOCK
                        </span>
                      )}
                    </div>

                    {/* Quick remove trigger */}
                    <button
                      onClick={() => {
                        removeFromWishlist(product.id);
                        toast.success(`Removed "${product.name}" from saved archive.`);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-red-650 flex items-center justify-center shadow-sm transition-all border border-stone-100 cursor-pointer duration-200"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{product.categoryName || "Salvage Range"}</span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          GRADE {product.grade || 'A'}
                        </span>
                      </div>
                      
                      <h4 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="font-display font-bold text-lg text-stone-900 group-hover:text-amber-800 transition-colors tracking-tight cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 font-light leading-relaxed">
                        {product.description || "No supplemental details cataloged currently for this piece."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                      {/* Price view */}
                      <div>
                        {isSale ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-stone-400 line-through font-mono font-medium">₹{product.price}</span>
                            <span className="text-md font-bold text-stone-900 font-mono">₹{product.discountPrice}</span>
                          </div>
                        ) : (
                          <span className="text-md font-bold text-stone-900 font-mono">₹{product.price}</span>
                        )}
                      </div>

                      {/* Add block */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white font-extrabold uppercase tracking-widest text-[9px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <ShoppingCart size={11} /> Add To Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust Stamps */}
      <div className="max-w-7xl mx-auto px-6 mt-16 border-t border-stone-250 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="text-amber-605" size={20} />
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900">CURATED RETENTION</h5>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">Our curation retention ensures save indicators will survive local cache resets.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center shrink-0">
              <HelpCircle className="text-amber-605" size={20} />
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900">WHISTEL REQUISITION</h5>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">Save items to request priority inspections from physical salvage teams globally.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center shrink-0">
              <Heart className="text-amber-605 fill-amber-50" size={18} />
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">GRADE MONITORING</h5>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">Automatic surplus level tracking displays live alert flags for saved materials.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
