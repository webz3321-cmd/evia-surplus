import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { ArrowLeft, Minus, Plus, ShoppingCart, ShieldCheck, Truck, RotateCcw, Share2, Heart } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addToCart } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getDoc(doc(db, 'products', id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          
          if (data.catId) {
            getDoc(doc(db, 'categories', data.catId)).then(catSnap => {
              if (catSnap.exists()) {
                setCategory({ id: catSnap.id, ...catSnap.data() });
              }
            });
          }
        }
      });
    }
  }, [id]);

  if (!product) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-bold text-gray-500 animate-pulse">Loading Product...</span>
    </div>
  );

  const allImages = [product.image, ...(product.secondaryImages || [])].filter(Boolean);

  const handleAddToCart = (directCheckout = false) => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addToCart(product, quantity, selectedSize || undefined);
    if (directCheckout) {
      navigate('/cart');
    } else {
      toast.success('Added to cart');
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
    <div className="flex flex-col bg-[#fcfcfc] min-h-screen pb-32">
      {/* Visual Header */}
      <div className="relative h-[450px] md:h-[600px] bg-gray-50 group">
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center transition-transform active:scale-90">
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div className="flex gap-2">
            <button onClick={shareProduct} className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center transition-transform active:scale-90">
              <Share2 size={18} className="text-gray-900" />
            </button>
            <button className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center transition-transform active:scale-90">
              <Heart size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <img src={allImages[activeImageIndex]} alt={product.name} className="w-full h-full object-cover transition-all duration-700 hover:scale-105" />
        
        {allImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 p-2 bg-white/30 backdrop-blur-md rounded-full shadow-lg border border-white/50">
            {allImages.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImageIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeImageIndex === i ? 'bg-indigo-600 scale-125 w-5' : 'bg-white'}`}
              />
            ))}
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar bg-white shadow-sm border-b border-gray-100">
          {allImages.map((img, i) => (
            <button 
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${activeImageIndex === i ? 'border-indigo-600 ring-4 ring-indigo-50 scale-105' : 'border-gray-100'}`}
            >
              <img src={img} className="w-full h-full object-cover" alt={`thumb-${i}`} />
            </button>
          ))}
        </div>
      )}
      
      <div className="max-w-2xl mx-auto w-full">
        <div className="p-6 flex flex-col gap-8 bg-white md:rounded-b-3xl shadow-sm">
          {/* Info Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-indigo-100 italic">
                {category?.name || 'Exclusive'}
              </span>
              {product.productType === 'rent' && (
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-md italic">
                  For Rent
                </span>
              )}
              <div className="h-0.5 w-4 bg-gray-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-emerald-600">★ 4.9</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">1.2k Reviews</span>
              </div>
            </div>
            
            <h1 className="font-black text-3xl text-gray-900 leading-none tracking-tight uppercase">{product.name}</h1>
            
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-indigo-600 tracking-tighter">₹{product.price.toLocaleString()}</span>
              <span className="text-lg font-bold text-gray-300 line-through mb-0.5">₹{(product.price * 1.5).toLocaleString()}</span>
              <span className="bg-red-50 text-red-500 text-[10px] font-black px-2 py-1 rounded-lg mb-1">SAVE 30%</span>
            </div>

            {product.stock > 0 ? (
              <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${product.stock <= 5 ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${product.stock <= 5 ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {product.stock <= 5 ? `Only ${product.stock} left in stock!` : 'In Stock Ready to ship'}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs font-black uppercase tracking-widest">Out of Stock</span>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-50"></div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Select Size</h3>
                <button className="text-[10px] font-bold text-indigo-600 underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[60px] h-14 px-4 rounded-2xl border-2 font-black transition-all flex items-center justify-center text-sm ${
                      selectedSize === size 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                      : 'border-gray-100 bg-[#f9f9f9] text-gray-500 hover:border-indigo-200'
                    }`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Product Detail</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium bg-gray-50/50 p-4 rounded-3xl border border-gray-50">{product.description}</p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-3xl text-center gap-2">
              <ShieldCheck size={20} className="text-indigo-500" />
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none">Original Brand</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-3xl text-center gap-2">
              <Truck size={20} className="text-indigo-500" />
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none">Free Delivery</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-3xl text-center gap-2">
              <RotateCcw size={20} className="text-indigo-500" />
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none">Easy Return</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between bg-[#f8f9fa] p-5 rounded-[2rem] border border-gray-100">
            <div className="flex flex-col">
              <span className="font-black text-gray-900 text-sm">Quantity</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select Units</span>
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all text-gray-600 rounded-xl"
              >
                <Minus size={18} />
              </button>
              <div className="w-14 text-center font-black text-lg text-gray-900">{quantity}</div>
              <button 
                onClick={() => setQuantity(quantity + 1)} 
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all text-gray-600 rounded-xl"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button 
            disabled={product.stock <= 0}
            onClick={() => handleAddToCart(false)}
            className="flex-1 bg-white border-2 border-gray-900 text-gray-900 font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white active:scale-95 disabled:opacity-50 disabled:grayscale uppercase text-xs tracking-widest shadow-xl"
          >
            <ShoppingCart size={18} />
            Cart
          </button>
          <button 
            disabled={product.stock <= 0}
            onClick={() => handleAddToCart(true)}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest relative overflow-hidden group"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-800 opacity-20 transition-all group-hover:h-full"></div>
            <span className="relative z-10">{product.stock > 0 ? 'Buy Now' : 'Out of Stock'}</span>
            <div className="relative z-10 w-px h-4 bg-white/20"></div>
            <span className="relative z-10">₹{(product.price * quantity).toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
