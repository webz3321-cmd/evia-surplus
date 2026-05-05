import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { user, cart, cartTotal, clearCart } = useAppContext();
  const navigate = useNavigate();
  
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

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
    if (address.trim() === '') {
      toast.error('Please enter delivery address');
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
        address,
        status: 'Placed',
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
    <div className="p-4">
      <h2 className="font-bold text-xl mb-6">Checkout</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <h3 className="font-bold mb-3">Order Summary</h3>
        <div className="flex flex-col gap-2 mb-3">
          {cart.map((item, idx) => (
            <div key={`${item.product.id}-${idx}`} className="flex justify-between text-sm">
              <div className="flex flex-col">
                <span className="text-gray-600 font-medium">{item.quantity}x {item.product.name}</span>
                {item.size && <span className="text-[10px] text-indigo-600 font-bold uppercase">Size: {item.size}</span>}
              </div>
              <span className="font-bold text-gray-900">₹{(item.product.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-gray-100 my-3"></div>
        
        {appliedCoupon ? (
          <div className="flex justify-between items-center mb-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Coupon Applied:</span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{appliedCoupon.code}</span>
            </div>
            <button onClick={() => { setDiscount(0); setAppliedCoupon(null); setCouponCode(''); }} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            <input 
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="Coupon Code" 
              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 uppercase placeholder:normal-case font-mono"
            />
            <button 
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode}
              className="px-4 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center min-w-[70px]"
            >
              {couponLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Apply'}
            </button>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-sm mb-2 text-emerald-600 font-bold">
            <span>Discount</span>
            <span>- ₹{discount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between font-black text-lg">
          <span className="text-gray-900">Total</span>
          <span className="text-indigo-600">₹{discountedTotal.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold mb-4">Delivery Details</h3>
        
        {error && <div className="p-2 mb-4 text-sm bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
            <input type="text" readOnly value={user.name} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
            <input type="text" readOnly value={user.phone || ''} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Complete Address</label>
            <textarea required value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="House No, Street, City, Pincode" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"></textarea>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
            <div className="p-3 border-2 border-indigo-600 bg-indigo-50 rounded-xl font-medium text-indigo-800 flex items-center justify-between">
              <span>Cash on Delivery</span>
              <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white ring-1 ring-indigo-600"></div>
            </div>
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full mt-6 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex justify-center items-center">
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : `Place Order (₹${discountedTotal.toLocaleString()})`}
        </button>
      </form>
    </div>
  );
}
