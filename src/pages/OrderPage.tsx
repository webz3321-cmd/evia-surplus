import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context';
import { Package, Truck, CheckCircle, ChevronDown, ChevronUp, Download, XCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const OrderItem = ({ order, onUpdate }: { order: any, onUpdate: () => void, key?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const items = order.items || [];

  const handleStatusUpdate = async (newStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'Cancelled' ? 'cancel' : 'return'} this order?`)) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      toast.success(`Order ${newStatus === 'Cancelled' ? 'cancelled' : 'return requested'} successfully`);
      onUpdate();
    } catch (err) {
      toast.error('Failed to update order status');
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={downloadPDF} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Download Invoice">
           <Download size={18} />
        </button>
      </div>
      <div 
        className="p-4 relative cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start mb-3 pr-12">
          <div>
            <div className="text-xs text-gray-500 font-medium mb-0.5">Order #{order.id.slice(-6)}</div>
            <div className="font-bold text-gray-900">₹{order.totalAmount?.toLocaleString()}</div>
          </div>
          <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
            order.status === 'Placed' ? 'bg-amber-50 text-amber-600' :
            order.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-600' :
            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
            'bg-red-50 text-red-600'
          }`}>
            {order.status}
          </div>
        </div>

        {/* Progress Tracker Horizontal */}
        <div className="mt-5 mb-4 px-2">
          <div className="relative flex justify-between items-center px-4">
            {/* Progress lines */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div className="absolute top-5 left-8 h-1 rounded-full -z-10 transition-all duration-500" style={{
              width: order.status === 'Delivered' ? 'calc(100% - 4rem)' : order.status === 'Dispatched' ? 'calc(50% - 2rem)' : '0%',
              backgroundColor: order.status === 'Cancelled' ? '#ef4444' : '#4f46e5'
            }}></div>

            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-4 ring-white ${['Placed', 'Dispatched', 'Delivered'].includes(order.status) ? 'bg-indigo-600 shadow-md' : (order.status === 'Cancelled' ? 'bg-red-500 shadow-md' : 'bg-gray-100 text-gray-400')}`}>
                <Package size={16} />
              </div>
              <p className="text-[10px] font-bold text-gray-900 mt-2">Placed</p>
            </div>
            
            <div className="relative flex flex-col items-center">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-4 ring-white ${['Dispatched', 'Delivered'].includes(order.status) ? 'bg-indigo-600 shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                <Truck size={16} />
              </div>
              <p className={`text-[10px] font-bold mt-2 ${['Dispatched', 'Delivered'].includes(order.status) ? 'text-gray-900' : 'text-gray-400'}`}>Dispatched</p>
            </div>
            
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-4 ring-white ${order.status === 'Delivered' ? 'bg-emerald-500 shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                <CheckCircle size={16} />
              </div>
              <p className={`text-[10px] font-bold mt-2 ${order.status === 'Delivered' ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] uppercase tracking-wider text-indigo-600 font-black flex items-center gap-1"
          >
            {expanded ? 'Hide Details' : 'View Details'}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
            {order.status === 'Delivered' && (
              <button 
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate('Return Requested'); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Return
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
    <div className="p-4 bg-gray-50 min-h-full">
      <h2 className="font-bold text-2xl mb-4 tracking-tight">My Orders</h2>
      
      {/* Tabs */}
      <div className="flex bg-gray-100/80 p-1 rounded-2xl mb-6 shadow-inner">
        <button 
          className={`flex-1 py-2.5 text-xs font-black tracking-wide uppercase rounded-xl transition-all ${tab === 'active' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('active')}
        >
          Active Orders
        </button>
        <button 
          className={`flex-1 py-2.5 text-xs font-black tracking-wide uppercase rounded-xl transition-all ${tab === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('history')}
        >
          Order History
        </button>
      </div>

      <div className="pb-10">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-700">No {tab} orders found.</h3>
            <p className="text-sm text-gray-500 mt-1">When you place an order, it will appear here.</p>
          </div>
        ) : (
          displayOrders.map(order => <OrderItem key={order.id} order={order} onUpdate={fetchOrders} />)
        )}
      </div>
    </div>
  );
}
