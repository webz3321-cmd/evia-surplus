import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const OrderRow = ({ order, updateStatus }: { order: any, updateStatus: any, key?: any }) => {
  const [expanded, setExpanded] = useState(false);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Order Invoice #${order.id.slice(-6)}`, 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Customer: ${order.user_name}`, 20, 40);
    doc.text(`Status: ${order.status}`, 20, 50);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Delivery Address:`, 20, 80);
    const addressLines = doc.splitTextToSize(order.address || 'N/A', 170);
    doc.text(addressLines, 20, 90);

    doc.text(`Items:`, 20, 110 + (addressLines.length * 5));
    let y = 120 + (addressLines.length * 5);
    (order.items || []).forEach((item: any, idx: number) => {
      doc.text(`${idx + 1}. ${item.name || 'Product'} (Qty: ${item.quantity}) - Rs. ${item.price?.toLocaleString()}`, 20, y);
      y += 10;
    });

    doc.setFontSize(16);
    if (order.discount > 0) {
      doc.text(`Subtotal: Rs. ${order.subtotal?.toLocaleString()}`, 20, y + 10);
      doc.text(`Discount (${order.couponUsed || 'Coupon'}): -Rs. ${order.discount?.toLocaleString()}`, 20, y + 20);
      doc.text(`Total Amount: Rs. ${order.totalAmount?.toLocaleString()}`, 20, y + 30);
    } else {
      doc.text(`Total Amount: Rs. ${order.totalAmount?.toLocaleString()}`, 20, y + 10);
    }

    doc.save(`Invoice_${order.id.slice(-6)}.pdf`);
  };

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
        <td className="p-4 font-bold text-gray-800">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 hover:text-indigo-600">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            #{order.id.slice(-6)}
          </button>
        </td>
        <td className="p-4 font-medium text-gray-600">{order.user_name}</td>
        <td className="p-4 font-bold">₹{order.totalAmount?.toLocaleString()}</td>
        <td className="p-4 text-sm text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
        <td className="p-4 text-right flex justify-end items-center gap-3">
          <button onClick={downloadPDF} className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors" title="Download Invoice">
            <Download size={16} />
          </button>
          <select 
            value={order.status}
            onChange={(e) => updateStatus(order.id, e.target.value)}
            className={`text-xs font-bold rounded-lg px-3 py-1.5 border outline-none cursor-pointer ${
              order.status === 'Placed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              order.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <option value="Placed">Placed</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={5} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Delivery Address</h4>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-700">
                  {order.address ? <p className="whitespace-pre-wrap">{order.address}</p> : <p className="text-gray-400 italic">No address provided</p>}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Items</h4>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col gap-2 p-2">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-lg">
                      {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded bg-gray-100 border border-gray-200" />}
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-800">{item.name || 'Unknown Product'}</div>
                        <div className="text-xs text-gray-500">
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                          {item.size && <span className="ml-2 font-bold px-1.5 py-0.5 bg-gray-100 rounded text-[10px] uppercase">Size: {item.size}</span>}
                        </div>
                      </div>
                      <div className="font-bold text-sm text-indigo-600">
                        ₹{(item.quantity * item.price)?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal?.toLocaleString() || order.totalAmount?.toLocaleString()}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-bold">
                        <span>Discount ({order.couponUsed})</span>
                        <span>- ₹{order.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 mt-1 pt-1">
                      <span>Total</span>
                      <span className="text-indigo-600">₹{order.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    let usersMap = new Map<string, string>();

    // First get users to map names (users don't change as often, but we could listen to them too if needed)
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data().name]));
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers().then(() => {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (ordersSnap) => {
        const data = ordersSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          user_name: usersMap.get((d.data() as any).userId) || 'Unknown'
        }));
        setOrders(data);
        if (!ordersSnap.metadata.hasPendingWrites) setLoading(false);
      }, (err) => {
        console.error('Error listening to orders:', err);
        setLoading(false);
      });

      return () => unsub();
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const loadingToast = toast.loading('Updating status...');
    try {
      console.log('Updating order status...', { id, status });
      await updateDoc(doc(db, 'orders', id), { status });
      console.log('Order status updated successfully');
      toast.success(`Order status updated to ${status}`, { id: loadingToast });
    } catch(err:any) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status', { id: loadingToast });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-900">Manage Orders</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-500 flex justify-center"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No orders found.</td></tr>
              ) : orders.map(order => (
                <OrderRow key={order.id} order={order} updateStatus={updateStatus} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
