import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addToCart } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getDoc(doc(db, 'products', id)).then(snap => {
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        }
      });
    }
  }, [id]);

  if (!product) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

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

  return (
    <div className="flex flex-col bg-white">
      <div className="relative h-96 bg-gray-100 group">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} />
        </button>
        
        <img src={allImages[activeImageIndex]} alt={product.name} className="w-full h-full object-cover transition-all duration-500" />
        
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/20 backdrop-blur rounded-full">
            {allImages.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImageIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${activeImageIndex === i ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50/50">
          {allImages.map((img, i) => (
            <button 
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeImageIndex === i ? 'border-indigo-600 scale-105' : 'border-transparent'}`}
            >
              <img src={img} className="w-full h-full object-cover" alt={`thumb-${i}`} />
            </button>
          ))}
        </div>
      )}
      
      <div className="p-5 flex flex-col gap-5">
        <div>
          <h1 className="font-bold text-2xl text-gray-900 leading-tight">{product.name}</h1>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 tracking-tight">₹{product.price.toLocaleString()}</span>
          </div>
          {product.stock > 0 ? (
            <div className="mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded uppercase tracking-wider">In Stock</div>
          ) : (
            <div className="mt-1 text-xs font-bold text-red-600 bg-red-50 w-fit px-2 py-0.5 rounded uppercase tracking-wider">Out of Stock</div>
          )}
        </div>

        {product.sizes && product.sizes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900">Select Size</h3>
              {selectedSize && <span className="text-xs font-bold text-indigo-600 uppercase">Selected: {selectedSize}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size: string) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[48px] h-12 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center ${
                    selectedSize === size 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100"></div>

        <div>
          <h3 className="font-bold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
          <span className="font-bold text-gray-900">Quantity</span>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 text-gray-600"><Minus size={16} /></button>
            <div className="w-12 text-center font-black text-gray-900">{quantity}</div>
            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 text-gray-600"><Plus size={16} /></button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-20 flex gap-3">
        <button 
          disabled={product.stock <= 0}
          onClick={() => handleAddToCart(false)}
          className="flex-1 bg-white border-2 border-gray-900 text-gray-900 font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        >
          <ShoppingCart size={20} />
          Cart
        </button>
        <button 
          disabled={product.stock <= 0}
          onClick={() => handleAddToCart(true)}
          className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
