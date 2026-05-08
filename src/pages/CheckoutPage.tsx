import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, limit, doc, onSnapshot, updateDoc } from 'firebase/firestore';
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

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    landmark: '',
    taluq: '',
    state: '',
    pincode: ''
  });

  // Listen to user data
  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.id), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCurrentUserData(data);
          setShippingForm({
            fullName: data.fullName || data.name || '',
            phone: data.phone || '',
            addressLine: data.addressLine || data.address || '',
            landmark: data.landmark || '',
            taluq: data.taluq || '',
            state: data.state || '',
            pincode: data.pincode || ''
          });
          // If profile is incomplete, force edit mode
          if (!data.fullName || !data.addressLine || !data.pincode) {
            setIsEditingAddress(true);
          }
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

  useEffect(() => {
    if (!user || cart.length === 0) {
      navigate('/');
    }
  }, [user, cart.length, navigate]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingAddress) {
      if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.addressLine || !shippingForm.pincode) {
        toast.error('Please complete your shipping details');
        return;
      }
    } else if (!currentUserData?.fullName || !currentUserData?.addressLine) {
      setIsEditingAddress(true);
      toast.error('Please complete your shipping details');
      return;
    }

    setLoading(true);
    
    try {
      const finalShipping = isEditingAddress ? shippingForm : {
        fullName: currentUserData.fullName,
        phone: currentUserData.phone,
        addressLine: currentUserData.addressLine,
        landmark: currentUserData.landmark,
        taluq: currentUserData.taluq,
        state: currentUserData.state,
        pincode: currentUserData.pincode
      };

      const printableAddress = `${finalShipping.addressLine}, ${finalShipping.landmark ? `Near ${finalShipping.landmark}, ` : ''}${finalShipping.taluq}, ${finalShipping.state} - ${finalShipping.pincode}`;

      const orderData = {
        userId: user!.id,
        subtotal: cartTotal,
        discount: discount,
        totalAmount: discountedTotal,
        couponUsed: appliedCoupon ? appliedCoupon.code : null,
        address: printableAddress,
        shippingDetails: finalShipping,
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

      // Also update user profile with latest address if it was edited
      if (isEditingAddress) {
        await updateDoc(doc(db, 'users', user!.id), {
          ...finalShipping,
          address: printableAddress
        });
      }

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/order');
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || cart.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-[#FAFAFB] min-h-screen pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-gray-200">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="font-black text-3xl text-gray-900 tracking-tighter leading-none">Checkout</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Review & Place Order</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/cart')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            Back to Cart
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Shipping Section */}
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <MapPin size={18} />
                  </div>
                  <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">Shipping Information</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditingAddress(!isEditingAddress)} 
                  className="text-xs font-black text-indigo-600 px-4 py-2 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-all uppercase tracking-wider"
                >
                  {isEditingAddress ? 'Cancel Edit' : 'Change Address'}
                </button>
              </div>
              
              {isEditingAddress ? (
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        placeholder="e.g. John Doe" 
                        value={shippingForm.fullName} 
                        onChange={e => setShippingForm({...shippingForm, fullName: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                      <input 
                        placeholder="10-digit number" 
                        value={shippingForm.phone} 
                        onChange={e => setShippingForm({...shippingForm, phone: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full House Address</label>
                    <textarea 
                      placeholder="House No, Street, Road, Area" 
                      value={shippingForm.addressLine} 
                      onChange={e => setShippingForm({...shippingForm, addressLine: e.target.value})}
                      rows={2}
                      className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Landmark</label>
                      <input 
                        placeholder="Near Temple / Mall" 
                        value={shippingForm.landmark} 
                        onChange={e => setShippingForm({...shippingForm, landmark: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Taluq / City</label>
                      <input 
                        placeholder="City name" 
                        value={shippingForm.taluq} 
                        onChange={e => setShippingForm({...shippingForm, taluq: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
                      <input 
                        placeholder="State name" 
                        value={shippingForm.state} 
                        onChange={e => setShippingForm({...shippingForm, state: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                      <input 
                        placeholder="6-digit PIN" 
                        value={shippingForm.pincode} 
                        onChange={e => setShippingForm({...shippingForm, pincode: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                currentUserData?.fullName ? (
                  <div className="flex items-start gap-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                      <MapPin size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-lg font-black text-gray-900 leading-none">{currentUserData.fullName}</p>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-tighter">Current Default</span>
                      </div>
                      <p className="text-sm text-gray-500 font-bold mb-3">{currentUserData.phone}</p>
                      <div className="flex items-start gap-2 text-gray-600 leading-relaxed max-w-md">
                        <span className="text-sm font-medium italic underline decoration-indigo-200 underline-offset-4">{currentUserData.address}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 rounded-3xl border border-dashed border-red-200 text-center">
                    <AlertCircle size={32} className="text-red-400 mb-3" />
                    <p className="text-red-600 font-black text-sm uppercase tracking-widest leading-none">Shipping Details Missing</p>
                    <p className="text-red-400 text-xs mt-2 font-medium">Please provide an address to proceed</p>
                  </div>
                )
              )}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">Payment Method</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border-2 border-indigo-600 bg-indigo-50/30 rounded-3xl relative overflow-hidden group border-opacity-100">
                  <div className="absolute top-0 right-0 p-4 bg-indigo-600 text-white rounded-bl-3xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-indigo-900 text-lg tracking-tight uppercase">Cash on Delivery</span>
                    <span className="text-xs text-indigo-600 font-bold uppercase mt-1 tracking-wider opacity-60">Pay when order arrives</span>
                  </div>
                </div>
                
                <div className="p-6 border-2 border-gray-100 bg-gray-50/30 rounded-3xl relative overflow-hidden opacity-40 cursor-not-allowed">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-400 text-lg tracking-tight uppercase">Online Payment</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-6">
              <h3 className="font-black text-lg text-gray-900 mb-6 uppercase tracking-tight flex items-center justify-between">
                Order Summary
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{cart.length} ITEMS</span>
              </h3>
              
              <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${idx}`} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 relative group">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute top-1 right-1 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-xs font-black text-gray-900 truncate leading-tight mb-1">{item.product.name}</span>
                      <div className="flex items-center gap-2">
                        {item.size && (
                          <span className="text-[8px] bg-indigo-50 text-indigo-700 font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                            SIZE: {item.size}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-gray-400">₹{item.product.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="font-black text-xs text-gray-900">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-50 mb-6"></div>

              {/* Coupon Section */}
              <div className="mb-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Have a promo code?</p>
                {appliedCoupon ? (
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">{appliedCoupon.code}</span>
                    </div>
                    <button 
                      onClick={() => { setDiscount(0); setAppliedCoupon(null); setCouponCode(''); }} 
                      className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="ENTER CODE" 
                      className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black outline-none focus:border-indigo-500 focus:bg-white uppercase tracking-widest placeholder:normal-case transition-all"
                    />
                    <button 
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-20 flex items-center justify-center"
                    >
                      {couponLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span className="opacity-60">Subtotal</span>
                  <span className="text-gray-900">₹{cartTotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold uppercase tracking-wider">
                    <span>Discount</span>
                    <span>- ₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span className="opacity-60">Shipping</span>
                  <span className="text-emerald-500">FREE</span>
                </div>
                <div className="h-px bg-gray-200 mt-2 mb-1"></div>
                <div className="flex justify-between items-end">
                  <span className="font-black text-gray-900 uppercase text-xs tracking-widest">Grand Total</span>
                  <span className="font-black text-3xl text-black tracking-tight">₹{discountedTotal.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder}>
                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-6 rounded-3xl shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] flex flex-col justify-center items-center gap-1 disabled:opacity-50 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-xl tracking-tighter leading-none">Confirm Order</span>
                      <span className="text-[10px] font-black text-white/60 tracking-[0.2em] uppercase">Final Amount: ₹{discountedTotal.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </form>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Secure Checkout</p>
                </div>
                <div className="flex gap-4 opacity-30 grayscale saturate-0">
                  <CreditCard size={16} />
                  <ShoppingBag size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
