import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, limit, doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { MapPin, AlertCircle, ShoppingBag, CreditCard, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const { user, cart, cartTotal, clearCart } = useAppContext();
  const navigate = useNavigate();
  
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Listen to user changes to get latest address
  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.id), (snap) => {
        if (snap.exists()) {
          setCurrentUserData(snap.data());
        }
      });
      return () => unsub();
    }
  }, [user]);

  const discountedTotal = Math.max(0, cartTotal - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error('Invalid coupon code');
        return;
      }

      const coupon = snap.docs[0].data();
      
      if (!coupon.isActive) {
        toast.error('Coupon is no longer active');
        return;
      }

      if (coupon.minAmount && cartTotal < coupon.minAmount) {
        toast.error(`Minimum order amount for this coupon is ₹${coupon.minAmount}`);
        return;
      }

      let calcDiscount = 0;
      if (coupon.type === 'percentage') {
        calcDiscount = (cartTotal * coupon.value) / 100;
      } else {
        calcDiscount = coupon.value;
      }

      setDiscount(calcDiscount);
      setAppliedCoupon({ id: snap.docs[0].id, code: couponCode.toUpperCase().trim(), value: coupon.value, type: coupon.type });
      toast.success('Coupon applied successfully!');
    } catch (err) {
      toast.error('Error applying coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  if (!user || cart.length === 0) {
    navigate('/');
    return null;
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserData?.address) {
      toast.error('Please add an address in your profile first');
      navigate('/profile');
      return;
    }
    setLoading(true);
    
    try {
      const orderData = {
        userId: user.id,
        subtotal: cartTotal,
        discount: discount,
        totalAmount: discountedTotal,
        couponUsed: appliedCoupon ? appliedCoupon.code : null,
        address: currentUserData.address,
        status: 'Placed',
        paymentMethod: 'COD',
        createdAt: Date.now(),
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          image: item.product.image,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size || null
        }))
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/order');
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <ShoppingBag size={20} />
        </div>
        <h2 className="font-black text-2xl text-gray-900 tracking-tight">Checkout</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Summary & Coupon */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              Order Summary
            </h3>
            <div className="flex flex-col gap-4 mb-4">
              {cart.map((item, idx) => (
                <div key={`${item.product.id}-${idx}`} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-sm font-bold text-gray-900 line-clamp-1">{item.product.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-gray-500">Qty: {item.quantity}</span>
                      {item.size && <span className="text-[10px] bg-indigo-50 text-indigo-600 font-black px-1.5 py-0.5 rounded uppercase">Size: {item.size}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className="font-black text-sm text-gray-900">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-px bg-gray-50 my-4"></div>
            
            {appliedCoupon ? (
              <div className="flex justify-between items-center mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{appliedCoupon.code} Applied</span>
                </div>
                <button onClick={() => { setDiscount(0); setAppliedCoupon(null); setCouponCode(''); }} className="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded-lg border border-red-100">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <input 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Promo Code" 
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 uppercase placeholder:normal-case font-mono transition-all"
                />
                <button 
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode}
                  className="px-6 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {couponLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Apply'}
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Delivery Charge</span>
                <span className="text-emerald-600">FREE</span>
              </div>
              <div className="h-px bg-gray-50 pt-2"></div>
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-900">Final Total</span>
                <span className="font-black text-2xl text-indigo-600 tracking-tight">₹{discountedTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Address & Payment */}
        <div className="flex flex-col gap-6">
          <form onSubmit={handlePlaceOrder} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              Shipping & Payment
            </h3>
            
            {error && <div className="p-3 mb-5 text-sm bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">{error}</div>}

            <div className="flex flex-col gap-5">
              {/* Address Display */}
              <div className={`p-4 rounded-2xl border-2 transition-all ${currentUserData?.address ? 'border-gray-100 bg-gray-50/50' : 'border-dashed border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Delivery Address</span>
                  </div>
                  <button type="button" onClick={() => navigate('/profile')} className="text-xs font-black text-indigo-600 hover:underline">Change</button>
                </div>
                
                {currentUserData?.address ? (
                  <p className="text-sm font-bold text-gray-800 leading-relaxed">
                    {currentUserData.address}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 py-2">
                    <AlertCircle size={16} />
                    <span className="text-sm font-bold">No saved address found</span>
                  </div>
                )}
              </div>

              {/* Payment Method - Fixed to COD */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <CreditCard size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Payment Method</span>
                </div>
                <div className="p-4 border-2 border-indigo-600 bg-indigo-50/50 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-indigo-600 text-white rounded-bl-2xl">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-indigo-900">Cash on Delivery</span>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase mt-0.5">Pay in cash when reached</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              disabled={loading || !currentUserData?.address} 
              type="submit" 
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex justify-center items-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
              {loading ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : (
                <>
                  <span>Confirm Order</span>
                  <span className="h-4 w-px bg-white/30"></span>
                  <span>₹{discountedTotal.toLocaleString()}</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest">Safe & Secure Payments Only</p>
          </form>
        </div>
      </div>
    </div>
  );
}
