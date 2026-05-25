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

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Add Admin Notification
      await addDoc(collection(db, 'notifications'), {
        type: 'new_order',
        orderId: orderRef.id,
        userName: user?.name || 'Customer',
        totalAmount: discountedTotal,
        status: 'unread',
        createdAt: Date.now()
      });

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
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Column */}
          <div className="w-full lg:w-[65%] flex flex-col gap-6">
            {/* Shipping Section */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200/80 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-900 shrink-0 border border-stone-200/40">
                    <MapPin size={18} />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-stone-900 tracking-wide">Shipping Parameters</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditingAddress(!isEditingAddress)} 
                  className="text-[9.5px] font-bold text-stone-800 px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-lg transition-all uppercase tracking-widest whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  {isEditingAddress ? 'Cancel Edit' : 'Change Address'}
                </button>
              </div>
              
              {isEditingAddress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        placeholder="John Doe" 
                        value={shippingForm.fullName} 
                        onChange={e => setShippingForm({...shippingForm, fullName: e.target.value})}
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">Mobile Number</label>
                      <input 
                        placeholder="10-digit number" 
                        value={shippingForm.phone} 
                        onChange={e => setShippingForm({...shippingForm, phone: e.target.value})}
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">Full House Address</label>
                    <textarea 
                      placeholder="House No, Street, Area" 
                      value={shippingForm.addressLine} 
                      onChange={e => setShippingForm({...shippingForm, addressLine: e.target.value})}
                      rows={2}
                      className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">Landmark</label>
                      <input 
                        placeholder="Near Temple / Mall" 
                        value={shippingForm.landmark} 
                        onChange={e => setShippingForm({...shippingForm, landmark: e.target.value})}
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">Taluq / City</label>
                      <input 
                        placeholder="City name" 
                        value={shippingForm.taluq} 
                        onChange={e => setShippingForm({...shippingForm, taluq: e.target.value})}
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">State</label>
                      <input 
                        placeholder="State name" 
                        value={shippingForm.state} 
                        onChange={e => setShippingForm({...shippingForm, state: e.target.value})}
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] font-bold text-stone-400 uppercase tracking-widest ml-1">Pincode</label>
                      <input 
                        placeholder="6-digit PIN" 
                        value={shippingForm.pincode} 
                        onChange={e => setShippingForm({...shippingForm, pincode: e.target.value})}
                        className="w-full px-5 py-3 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium outline-none focus:border-stone-950 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                currentUserData?.fullName ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-stone-50 rounded-2xl border border-stone-200/60 text-left">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-stone-800 shadow-xs border border-stone-200/65 shrink-0">
                      <MapPin size={22} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="text-lg font-serif font-bold text-stone-900 leading-none">{currentUserData.fullName}</p>
                        <span className="px-2.5 py-0.5 bg-stone-200 text-stone-800 text-[8.5px] font-bold rounded-lg uppercase tracking-wider border border-stone-300/40">Default Location</span>
                      </div>
                      <p className="text-xs text-stone-500 font-mono mb-3">{currentUserData.phone}</p>
                      <p className="text-xs text-stone-600 leading-relaxed font-serif italic p-3 bg-white border border-stone-150 rounded-lg shadow-2xs">
                        {currentUserData.address}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-red-50/30 rounded-3xl border border-dashed border-red-200 text-center">
                    <AlertCircle size={32} className="text-red-400 mb-3" />
                    <p className="text-red-600 font-black text-sm uppercase tracking-widest">Shipping Details Missing</p>
                    <p className="text-red-400 text-xs mt-2 font-medium">Please provide an address to proceed</p>
                  </div>
                )
              )}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200/80 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-900 shrink-0 border border-stone-200/40">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900 tracking-wide">Method of Exchange</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="p-6 border-2 border-stone-950 bg-stone-950 text-white rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-amber-500 text-stone-950 rounded-bl-xl">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-widest uppercase text-amber-500">Cash on Delivery</span>
                    <span className="text-[10px] text-stone-300 font-medium uppercase mt-1.5 tracking-wider opacity-90">Pay on physical delivery</span>
                  </div>
                </div>
                
                <div className="p-6 border border-stone-100 bg-stone-50/40 rounded-xl relative overflow-hidden opacity-40 cursor-not-allowed">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-widest uppercase text-stone-400">Online payment gate</span>
                    <span className="text-[9px] text-stone-400 font-bold uppercase mt-1.5 tracking-widest">Unavailable in Beta</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-[35%] lg:sticky lg:top-24 flex flex-col gap-6">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6">
              <h3 className="font-black text-xl text-gray-900 mb-6 uppercase tracking-tight flex items-center justify-between">
                Order Summary
                <span className="text-[10px] font-black text-white bg-purple-600 px-3 py-1 rounded-full uppercase tracking-widest">{cart.length} ITEMS</span>
              </h3>
              
              {/* Product list with complete interactive specification details */}
              <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, idx) => {
                  const itemSubtotal = item.product.price * item.quantity;
                  const cgstPercent = typeof item.product.cgstRate === 'number' ? item.product.cgstRate : 9;
                  const sgstPercent = typeof item.product.sgstRate === 'number' ? item.product.sgstRate : 9;
                  const totalTaxPercent = cgstPercent + sgstPercent;
                  
                  // Base Price is item price / (1 + totalTaxPercent/100)
                  const basePricePerUnit = Math.round(item.product.price / (1 + totalTaxPercent / 100));
                  const gstPerUnit = item.product.price - basePricePerUnit;
                  
                  return (
                    <div key={`${item.product.id}-${idx}`} className="flex flex-col p-3 rounded-2xl bg-stone-50/50 hover:bg-stone-50 transition-all border border-stone-200/50">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 relative group border border-stone-200/60 p-0.5">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <span className="text-xs font-extrabold text-stone-900 truncate leading-tight uppercase tracking-tight">{item.product.name}</span>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                            {item.size && (
                              <span className="text-[9px] bg-stone-200/60 text-stone-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                Size: {item.size}
                              </span>
                            )}
                          </div>

                          <div className="text-[9.5px] text-stone-500 font-mono mt-1.5 flex items-center gap-1">
                            <span>₹{item.product.price.toLocaleString()}</span>
                            <span>×</span>
                            <span>{item.quantity} units</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center shrink-0">
                          <span className="font-black text-xs text-stone-900">₹{itemSubtotal.toLocaleString()}</span>
                          <span className="text-[8px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">(GST inc.)</span>
                        </div>
                      </div>

                      {/* Tax Invoice Breakdown Sub-tray */}
                      <div className="mt-2 pt-2 border-t border-stone-200/40 grid grid-cols-2 gap-1 text-[8.5px] font-mono text-stone-400">
                        <div>Base Price: ₹{(basePricePerUnit * item.quantity).toLocaleString()}</div>
                        <div className="text-right">GST ({totalTaxPercent}% code): ₹{(gstPerUnit * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-gray-100 mb-6"></div>

              {/* Coupon Section */}
              <div className="mb-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Promo Code</p>
                {appliedCoupon ? (
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">{appliedCoupon.code}</span>
                    </div>
                    <button 
                      onClick={() => { setDiscount(0); setAppliedCoupon(null); setCouponCode(''); }} 
                      type="button"
                      className="text-[9px] font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest cursor-pointer"
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
                      className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-bold outline-none focus:border-stone-900 focus:bg-white uppercase tracking-widest placeholder:normal-case transition-all"
                    />
                    <button 
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20 cursor-pointer"
                    >
                      {couponLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* High Fidelity Pricing details with detailed Tax Invoice Layout (GST inc) */}
              {(() => {
                const totalGross = cartTotal;
                const totalDiscount = discount;
                const grandTotal = discountedTotal;
                
                // Calculate dynamic taxes based on each item's specific custom or fallback CGST/SGST rate
                let calculatedTaxableSubtotal = 0;
                let calculatedCgstAmount = 0;
                let calculatedSgstAmount = 0;

                cart.forEach((item) => {
                  const itemSubtotal = item.product.price * item.quantity;
                  // Proportionally share the checkout discount across items (if any discount is applied)
                  const proportionalDiscount = totalGross > 0 ? (itemSubtotal / totalGross) * totalDiscount : 0;
                  const itemDiscountedTotal = itemSubtotal - proportionalDiscount;
                  
                  const cgstPercent = typeof item.product.cgstRate === 'number' ? item.product.cgstRate : 9;
                  const sgstPercent = typeof item.product.sgstRate === 'number' ? item.product.sgstRate : 9;
                  const totalTaxPercent = cgstPercent + sgstPercent;
                  
                  const itemTaxable = itemDiscountedTotal / (1 + totalTaxPercent / 100);
                  const itemGst = itemDiscountedTotal - itemTaxable;
                  
                  const itemCgst = (itemGst * cgstPercent) / (totalTaxPercent || 1);
                  const itemSgst = itemGst - itemCgst;

                  calculatedTaxableSubtotal += itemTaxable;
                  calculatedCgstAmount += itemCgst;
                  calculatedSgstAmount += itemSgst;
                });

                const taxableSubtotal = Math.round(calculatedTaxableSubtotal);
                const cgstAmount = Math.round(calculatedCgstAmount);
                const sgstAmount = Math.round(calculatedSgstAmount);
                const totalGstAmount = cgstAmount + sgstAmount;

                return (
                  <div className="space-y-3 p-5 rounded-2xl bg-stone-50/80 border border-stone-200/80 text-left">
                    <p className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest border-b border-stone-200/60 pb-1.5 mb-2">Price Breakdown details</p>
                    
                    <div className="flex justify-between text-[11px] font-bold text-stone-600">
                      <span>Total Item Price</span>
                      <span className="text-stone-900 font-mono">₹{totalGross.toLocaleString()}</span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-[11px] font-extrabold text-emerald-600">
                        <span>Promo Code Discount</span>
                        <span className="font-mono">- ₹{totalDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="h-[1px] bg-stone-200/60 my-1"></div>

                    <div className="flex justify-between text-[10.5px] text-stone-500">
                      <span>Taxable Value (Before Taxes)</span>
                      <span className="font-mono">₹{taxableSubtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-stone-400 pl-3 border-l border-stone-200">
                      <span>CGST (Inclusive)</span>
                      <span>₹{cgstAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-stone-400 pl-3 border-l border-stone-200">
                      <span>SGST (Inclusive)</span>
                      <span>₹{sgstAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-[11px] font-bold text-stone-600">
                      <span>Total GST Tax Included</span>
                      <span className="text-stone-700 font-mono">₹{totalGstAmount.toLocaleString()}</span>
                    </div>

                    <div className="h-[1px] bg-stone-200/60 my-1"></div>

                    <div className="flex justify-between text-[11px] font-bold text-stone-500">
                      <span>Delivery & Handling</span>
                      <span className="text-emerald-600 font-extrabold uppercase tracking-wide">FREE DELIVERY</span>
                    </div>

                    <div className="h-px bg-stone-300/80 my-2"></div>

                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="font-black text-stone-400 uppercase text-[8.5px] tracking-[0.18em]">Grand Total (GST Inc)</span>
                        <span className="font-black text-2xl text-stone-900 tracking-tight font-mono mt-0.5">₹{grandTotal.toLocaleString()}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-[#9333ea] bg-purple-50 px-2 py-1 rounded border border-purple-150 uppercase tracking-widest select-none">
                        COD Approved
                      </span>
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handlePlaceOrder}>
                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full mt-6 bg-black hover:bg-stone-900 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 relative overflow-hidden cursor-pointer"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    <span className="text-base uppercase tracking-widest">Place Order (COD)</span>
                  )}
                </button>
              </form>
              
              <div className="mt-6 flex items-center justify-center gap-4 py-2 border-t border-gray-50 opacity-40">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Safe Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
