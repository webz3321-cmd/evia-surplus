import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context';
import { Package, Truck, CheckCircle, ChevronDown, ChevronUp, Download, XCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const OrderItem = ({ order, onUpdate }: { order: any, onUpdate: () => void, key?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const items = order.items || [];

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: Date.now()
      });

      if (newStatus === 'Cancelled') {
        // Add Admin Notification for cancellation
        await addDoc(collection(db, 'notifications'), {
          type: 'order_cancelled',
          orderId: order.id,
          userName: order.shippingDetails?.fullName || 'Customer',
          totalAmount: order.totalAmount,
          status: 'unread',
          createdAt: Date.now()
        });
      }

      toast.success(`Order ${newStatus.toLowerCase()} successfully`);
      onUpdate();
    } catch (err) {
      toast.error(`Failed to ${newStatus.toLowerCase()} order`);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Order Invoice #${order.id.slice(-6)}`, 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Status: ${order.status}`, 20, 40);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Delivery Address:`, 20, 70);
    const addressLines = doc.splitTextToSize(order.address || 'N/A', 170);
    doc.text(addressLines, 20, 80);

    doc.text(`Items:`, 20, 100 + (addressLines.length * 5));
    let y = 110 + (addressLines.length * 5);
    items.forEach((item: any, idx: number) => {
      doc.text(`${idx + 1}. ${item.name || 'Product'} (Qty: ${item.quantity}) - Rs. ${item.price?.toLocaleString()}`, 20, y);
      y += 10;
    });

    doc.setFontSize(16);
    doc.text(`Total Amount: Rs. ${order.totalAmount?.toLocaleString()}`, 20, y + 10);

    doc.save(`Invoice_${order.id.slice(-6)}.pdf`);
  };

  const handleReturnRequest = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'Return Requested',
        returnRequestDate: Date.now(),
        updatedAt: Date.now()
      });

      // Add Admin Notification for return
      await addDoc(collection(db, 'notifications'), {
        type: 'return_request',
        orderId: order.id,
        userName: order.shippingDetails?.fullName || 'Customer',
        totalAmount: order.totalAmount,
        status: 'unread',
        createdAt: Date.now()
      });

      toast.success(`Return request submitted successfully`);
      onUpdate();
    } catch (err) {
      toast.error('Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const withinReturnWindow = () => {
    if (order.status !== 'Delivered') return false;
    
    // Fallback to updatedAt if deliveredAt is missing (for older orders)
    const referenceDate = order.deliveredAt || order.updatedAt || order.createdAt;
    if (!referenceDate) return true; // Default to allowing if no date info exists

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - referenceDate) < sevenDaysInMs;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-stone-200/80 overflow-hidden mb-4 relative hover:border-stone-450 transition-all">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={downloadPDF} className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer" title="Download Invoice">
           <Download size={16} />
        </button>
      </div>
      <div 
        className="p-5 relative cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start mb-3 pr-12 text-left">
          <div>
            <div className="text-[9px] text-stone-400 font-mono uppercase tracking-widest mb-1.5">Order Number #{order.id.slice(-6).toUpperCase()}</div>
            <div className="text-xl font-bold font-serif text-stone-900">₹{order.totalAmount?.toLocaleString()}</div>
          </div>
          <div className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${
            order.status === 'Placed' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
            order.status === 'Dispatched' ? 'bg-stone-100 text-stone-850 border-stone-200/80' :
            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
            order.status === 'Return Requested' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
            order.status === 'Returned' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
            'bg-red-50 text-red-650 border-red-200/50'
          }`}>
            {order.status}
          </div>
        </div>

        {/* Progress Tracker Horizontal */}
        <div className="mt-6 mb-4 px-2 text-left">
          <div className="relative flex justify-between items-center px-4">
            {/* Progress lines */}
            <div className="absolute top-5 left-8 right-8 h-[2px] bg-stone-100 -z-10 rounded-full"></div>
            <div className="absolute top-5 left-8 h-[2px] rounded-full -z-10 transition-all duration-500" style={{
              width: order.status === 'Delivered' || order.status === 'Return Requested' || order.status === 'Returned' ? 'calc(100% - 4rem)' : order.status === 'Dispatched' ? 'calc(50% - 2rem)' : '0%',
              backgroundColor: order.status === 'Cancelled' ? '#ef4444' : (order.status === 'Return Requested' || order.status === 'Returned' ? '#6366f1' : '#1c1917')
            }}></div>

            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ring-4 ring-white ${['Placed', 'Dispatched', 'Delivered', 'Return Requested', 'Returned'].includes(order.status) ? 'bg-stone-900 shadow-sm' : (order.status === 'Cancelled' ? 'bg-red-600 shadow-sm' : 'bg-stone-100 text-stone-400')}`}>
                <Package size={15} />
              </div>
              <p className="text-[9px] font-bold text-stone-800 uppercase tracking-widest mt-2 text-center">Placed</p>
            </div>
            
            <div className="relative flex flex-col items-center">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ring-4 ring-white ${['Dispatched', 'Delivered', 'Return Requested', 'Returned'].includes(order.status) ? 'bg-stone-900 shadow-sm' : 'bg-stone-100 text-stone-450'}`}>
                <Truck size={15} />
              </div>
              <p className={`text-[9px] font-bold mt-2 uppercase tracking-widest text-center ${['Dispatched', 'Delivered', 'Return Requested', 'Returned'].includes(order.status) ? 'text-stone-800' : 'text-stone-400'}`}>Dispatch</p>
            </div>
            
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ring-4 ring-white ${['Delivered', 'Return Requested', 'Returned'].includes(order.status) ? 'bg-emerald-600 shadow-sm' : 'bg-stone-100 text-stone-450'}`}>
                <CheckCircle size={15} />
              </div>
              <p className={`text-[9px] font-bold mt-2 uppercase tracking-widest text-center ${['Delivered', 'Return Requested', 'Returned'].includes(order.status) ? 'text-stone-800' : 'text-stone-400'}`}>Delivered</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] uppercase tracking-widest text-stone-900 font-bold flex items-center gap-1 hover:text-stone-600 cursor-pointer"
          >
            {expanded ? 'Hide Details' : 'View Order Details'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className="flex gap-2">
            {order.status === 'Placed' && (
              <button 
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate('Cancelled'); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                Cancel
              </button>
            )}
            {withinReturnWindow() && (
              <button 
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); handleReturnRequest(); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Return Items
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col gap-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Ordered Items</div>
          {items.map((item: any, i: number) => (
            <div key={item.productId || i} className="flex gap-3 bg-white p-2 border border-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium line-clamp-1">{item.name}</div>
                <div className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</div>
              </div>
              <div className="font-bold text-sm">
                ₹{(item.quantity * item.price)?.toLocaleString()}
              </div>
            </div>
          ))}
          <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
            <span>Order Date: {new Date(order.createdAt).toLocaleDateString()}</span>
            {order.address && <span>Delivery Address: {order.address}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrderPage() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  if (!user) return null;

  const activeOrders = orders.filter(o => ['Placed', 'Dispatched', 'Return Requested'].includes(o.status));
  const historyOrders = orders.filter(o => ['Delivered', 'Cancelled', 'Returned'].includes(o.status));
  
  const displayOrders = tab === 'active' ? activeOrders : historyOrders;

  return (
    <div className="px-6 py-8 bg-stone-50/50 min-h-screen max-w-2xl mx-auto w-full">
      <div className="mb-6 text-left">
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-amber-600/90 block mb-1">Order Status</span>
        <h2 className="font-serif text-3xl font-bold text-stone-900 tracking-wide">My Orders</h2>
      </div>
      
      {/* Premium Luxury Segment Tabs */}
      <div className="flex bg-stone-100 p-1.5 rounded-xl mb-6 border border-stone-200/60 shadow-inner">
        <button 
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 cursor-pointer ${tab === 'active' ? 'bg-stone-950 text-white shadow-sm font-medium' : 'text-stone-500 hover:text-stone-850'}`}
          onClick={() => setTab('active')}
        >
          Ongoing Orders
        </button>
        <button 
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 cursor-pointer ${tab === 'history' ? 'bg-stone-950 text-white shadow-sm font-medium' : 'text-stone-500 hover:text-stone-850'}`}
          onClick={() => setTab('history')}
        >
          Past Orders
        </button>
      </div>

      <div className="pb-16">
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-stone-200/80 text-center shadow-xs">
            <Package size={36} className="mx-auto text-stone-300 mb-4" />
            <h3 className="font-serif text-sm font-bold text-stone-900 uppercase tracking-wider">No Orders Found</h3>
            <p className="text-xs text-stone-450 mt-2 font-serif italic max-w-xs mx-auto leading-relaxed">You have not placed any orders yet. Once you place an order, it will appear here.</p>
          </div>
        ) : (
          displayOrders.map(order => <OrderItem key={order.id} order={order} onUpdate={fetchOrders} />)
        )}
      </div>
    </div>
  );
}
