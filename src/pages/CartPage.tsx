import { useNavigate, Link } from 'react-router';
import { useAppContext } from '../context';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, user } = useAppContext();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'offers'), where('active', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setOffers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 text-muted-foreground border border-border">
          <ShoppingBag size={28} />
        </div>
        <h2 className="font-display text-4xl mb-3 text-foreground">Your bag is empty</h2>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm font-light leading-relaxed">Discover our latest premium collection of apparel and objects made to last.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-primary hover:opacity-95 text-primary-foreground font-semibold py-3.5 px-8 rounded-full transition-opacity uppercase text-[10px] tracking-widest"
        >
          Explore collection
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Navigation Breadcrumbs */}
        <header className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-widest text-[#9333ea]">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">Catalog</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">Shopping Bag</span>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold uppercase tracking-wider"
          >
            <ArrowLeft size={11} /> Continue shopping
          </button>
        </header>

        <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-8">Your bag</h1>

        {/* Dynamic Cart Layout: Split screen */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: Products column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="border-t border-border">
              {cart.map((item, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${item.product.id}-${item.size || 'no-size'}-${index}`} 
                  className="py-6 border-b border-border flex gap-4 sm:gap-6 justify-between items-start"
                >
                  <div className="flex gap-4 sm:gap-6 items-start flex-1">
                    <div className="w-20 sm:w-24 aspect-[4/5] bg-surface rounded-lg overflow-hidden shrink-0 border border-border/40">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[9px] uppercase tracking-widest text-accent font-semibold"> garment </span>
                      <h3 className="font-display text-lg sm:text-xl text-foreground capitalize leading-tight">{item.product.name}</h3>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-semibold text-foreground">₹{item.product.price.toLocaleString()}</span>
                        {item.size && (
                          <span className="text-[10px] font-semibold bg-secondary text-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Size: {item.size}
                          </span>
                        )}
                      </div>

                      {/* Quantity manipulation selector */}
                      <div className="inline-flex items-center rounded-full border border-border bg-background mt-3">
                        <button 
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.size)} 
                          className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12}/>
                        </button>
                        <span className="px-3 text-xs font-bold text-foreground">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)} 
                          className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12}/>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove items button */}
                  <button 
                    onClick={() => removeFromCart(item.product.id, item.size)} 
                    className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Summary Order Summary Column */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-surface p-6 sm:p-8 border border-border/80">
              <h2 className="font-display text-2xl text-foreground mb-6">Order summary</h2>
              
              <div className="space-y-4 text-sm font-light border-b border-border pb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground/80">Original Subtotal</span>
                  <span className="text-foreground font-semibold">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/80">Premium Shipping</span>
                  <span className="text-emerald-700 font-semibold uppercase tracking-wider text-xs">Free Delivery</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/80">Service taxes</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>

              {/* Special offers text segment */}
              {offers.length > 0 && (
                <div className="my-6 space-y-3">
                  {offers.map((off) => (
                    <div key={off.id} className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9333ea] mt-1.5 shrink-0 animate-pulse"></div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9333ea]">{off.title}</p>
                        <p className="text-xs text-[#9d58e3] mt-0.5 leading-snug">{off.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-baseline pt-4 mb-6">
                <span className="text-sm font-medium text-foreground">Estimate Total</span>
                <span className="font-display text-3xl text-foreground">₹{cartTotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={() => {
                  if(!user) {
                    navigate('/login');
                  } else {
                    navigate('/checkout');
                  }
                }}
                className="w-full bg-primary hover:opacity-95 text-primary-foreground font-semibold py-4 px-6 rounded-full transition-opacity flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-sm"
              >
                {user ? 'Proceed to payment' : 'Login to secure checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
