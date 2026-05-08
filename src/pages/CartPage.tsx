import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, CreditCard, Sparkles } from 'lucide-react';
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 h-full flex flex-col items-center justify-center min-h-[70vh] text-center"
      >
        <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 text-indigo-300 border-4 border-white shadow-xl">
          <ShoppingBag size={56} />
        </div>
        <h2 className="text-3xl font-black mb-4 tracking-tight text-gray-900">Your bag is empty</h2>
        <p className="text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">Discover our latest premium collection and find something you love today.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase text-xs tracking-widest"
        >
          Start Shopping
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] pb-32">
      {/* Header */}
      <div className="bg-white p-6 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-900">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-black text-xl text-gray-900 tracking-tight">Shopping Bag</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 flex flex-col gap-5 max-w-xl mx-auto w-full"
      >
        <div className="flex flex-col gap-4">
          {cart.map((item, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={`${item.product.id}-${item.size || 'no-size'}-${index}`} 
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-5 group"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-50">
                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-sm text-gray-900 line-clamp-2 leading-tight uppercase">{item.product.name}</h3>
                    <button onClick={() => removeFromCart(item.product.id, item.size)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <div className="font-black text-indigo-600 text-lg">₹{item.product.price.toLocaleString()}</div>
                    {item.size && (
                      <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg uppercase tracking-wider italic">
                        Size: {item.size}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-0.5 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.size)} 
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-400 hover:text-indigo-600 active:scale-90 transition-all"
                    >
                      <Minus size={14}/>
                    </button>
                    <span className="px-4 font-black text-gray-900 text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)} 
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-400 hover:text-indigo-600 active:scale-90 transition-all"
                    >
                      <Plus size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Cards (Offers) */}
        {offers.length > 0 ? (
          offers.map((off, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              key={off.id} 
              className="bg-indigo-600 rounded-[2rem] p-6 text-white overflow-hidden relative shadow-xl shadow-indigo-100"
            >
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-200" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-100">{off.title}</h4>
                </div>
                <p className="text-sm font-bold max-w-[200px] leading-snug">{off.text}</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
            </motion.div>
          ))
        ) : (
          <div className="bg-gray-50 rounded-[2rem] p-6 text-gray-400 border border-dashed border-gray-100 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest">More offers coming soon</p>
          </div>
        )}
      </motion.div>

      {/* Sticky Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Grand Total</span>
              <span className="font-black text-3xl text-gray-900 tracking-tighter italic">₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Free Shipping
              </span>
              <p className="text-[9px] text-gray-400 font-medium mt-0.5">Estimated delivery: 3-5 Days</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if(!user) {
                navigate('/login');
              } else {
                navigate('/checkout');
              }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase text-xs tracking-[0.2em]"
          >
            {user ? 'Proceed to Secure Checkout' : 'Login to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
