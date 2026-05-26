import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Download, Package, Calendar, User, CreditCard, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const OrderRow = ({ order, updateStatus }: any) => {
  const [expanded, setExpanded] = useState(false);

  const downloadLabel = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(order.id);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150]
      });

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EVIA SURPLUS /', 50, 15, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.line(10, 25, 90, 25);

      // Order info
      doc.setFontSize(8);
      doc.text('DEP-LOG ID:', 10, 32);
      doc.setFontSize(10);
      doc.text(`#${order.id.toUpperCase()}`, 10, 37);

      doc.setFontSize(8);
      doc.text('DATE:', 70, 32);
      doc.setFontSize(10);
      doc.text(new Date(order.createdAt).toLocaleDateString(), 70, 37);

      // Recipient
      doc.setLineWidth(0.2);
      doc.line(10, 42, 90, 42);
      
      doc.setFontSize(8);
      doc.text('CONSIGNEE:', 10, 49);
      doc.setFontSize(12);
      doc.text(order.shippingDetails?.fullName || order.user_name || 'N/A', 10, 55);

      doc.setFontSize(8);
      doc.text('DELIVERY COORDINATES:', 10, 65);
      doc.setFontSize(10);
      const addrLines = doc.splitTextToSize(order.address || 'N/A', 80);
      doc.text(addrLines, 10, 71);

      // Manifest
      let nextY = 71 + (addrLines.length * 5) + 5;
      doc.setLineWidth(0.2);
      doc.line(10, nextY - 3, 90, nextY - 3);
      
      doc.setFontSize(8);
      doc.text('MANIFEST CONTENT:', 10, nextY);
      nextY += 6;
      doc.setFontSize(9);
      (order.items || []).slice(0, 4).forEach((item: any) => {
        doc.text(`${item.quantity}x ${item.name?.slice(0, 30)}`, 10, nextY);
        nextY += 5;
      });

      // QR Code
      doc.addImage(qrDataUrl, 'PNG', 30, 105, 40, 40);
      
      doc.setFontSize(14);
      doc.text(`TOTAL: Rs. ${order.totalAmount?.toLocaleString()}`, 50, 100, { align: 'center' });

      doc.save(`Label_${order.id.slice(-6)}.pdf`);
    } catch (err) {
      console.error('Label generation error:', err);
      toast.error('Failed to generate tactical label');
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Order Invoice #${order.id.slice(-6)}`, 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Customer: ${order.shippingDetails?.fullName || order.user_name}`, 20, 40);
    doc.text(`Phone: ${order.shippingDetails?.phone || 'N/A'}`, 20, 50);
    doc.text(`Status: ${order.status}`, 20, 60);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 20, 70);
    
    doc.setFontSize(12);
    doc.text(`Delivery Address:`, 20, 90);
    const fullAddress = order.address || 'N/A';
    const addressLines = doc.splitTextToSize(fullAddress, 170);
    doc.text(addressLines, 20, 100);

    doc.text(`Items:`, 20, 120 + (addressLines.length * 5));
    let y = 130 + (addressLines.length * 5);
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

  const statusColors: Record<string, string> = {
    'Placed': 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200/50',
    'Dispatched': 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border-indigo-200/50',
    'Delivered': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200/50',
    'Return Requested': 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 border-purple-200/50',
    'Returned': 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-600 border-fuchsia-200/50',
    'Cancelled': 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-200/50',
    'Failed': 'bg-red-50 dark:bg-red-950/20 text-red-700 border-red-200/50'
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/5 rounded-3xl overflow-hidden mb-4 hover:shadow-lg transition-all group">
      {/* Desktop & Mobile Main Header Row */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 dark:bg-white/5 flex items-center justify-center shrink-0 border border-stone-100 dark:border-white/5">
              <Package className="text-[#A38A5F]" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-black text-foreground">ORDER-#{order.id.slice(-6).toUpperCase()}</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[order.status] || 'bg-stone-100 text-stone-600'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-stone-400 font-extrabold uppercase tracking-widest">
                <Calendar size={12} />
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Customer Profile</p>
              <div className="flex items-center gap-2">
                <User size={14} className="text-[#A38A5F]" />
                <span className="text-sm font-black text-foreground">{order.shippingDetails?.fullName || order.user_name}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Transaction Value</p>
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-[#A38A5F]" />
                <span className="text-sm font-black text-foreground">₹{order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={downloadLabel} 
                className="p-3 bg-stone-50 dark:bg-white/5 text-[#A38A5F] hover:bg-[#A38A5F]/10 border border-stone-100 dark:border-white/5 rounded-2xl transition-all"
                title="Download Shipping Label"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <Download size={14} />
                  <span className="text-[7px] font-black uppercase">Label</span>
                </div>
              </button>
              <button 
                onClick={downloadPDF} 
                className="p-3 bg-stone-50 dark:bg-white/5 text-stone-400 hover:text-[#A38A5F] border border-stone-100 dark:border-white/5 rounded-2xl transition-all"
                title="Archival Download"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <Download size={14} />
                  <span className="text-[7px] font-black uppercase">Invoice</span>
                </div>
              </button>
              <button 
                onClick={() => setExpanded(!expanded)}
                className={`p-3 border border-stone-100 dark:border-white/5 rounded-2xl transition-all ${expanded ? 'bg-[#A38A5F] text-white' : 'bg-stone-50 dark:bg-white/5 text-stone-400'}`}
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] p-6 md:p-10 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Control & Logistics */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#A38A5F]" />
                  Command Authority
                </h4>
                <div className="p-1.5 bg-white dark:bg-black rounded-3xl border border-stone-200 dark:border-white/10 shadow-sm">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="w-full bg-transparent p-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer text-foreground"
                  >
                    <option value="Placed">Placed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Return Requested">Return Requested</option>
                    <option value="Returned">Returned</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Deployment Coordinates</h4>
                <div className="bg-white dark:bg-black p-6 rounded-3xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Logistics ID</p>
                    <p className="text-xs font-bold text-foreground">{order.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Deployment Address</p>
                    <p className="text-xs font-bold text-foreground leading-relaxed">{order.address}</p>
                  </div>
                  {order.shippingDetails?.phone && (
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Secure Comms</p>
                      <p className="text-xs font-bold text-foreground">{order.shippingDetails.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Asset Manifest */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Manifest Overview</h4>
              <div className="bg-white dark:bg-black rounded-[40px] border border-stone-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="divide-y divide-stone-100 dark:divide-white/5">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="p-6 flex items-center gap-6 hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/5 shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm text-foreground mb-1 flex items-center gap-3">
                          {item.name || 'Unknown Asset'}
                          {item.size && <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-white/10 text-[9px] font-black uppercase tracking-widest">S: {item.size}</span>}
                        </div>
                        <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                          Quantity: {item.quantity} × ₹{item.price?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-foreground">₹{(item.quantity * item.price)?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-stone-50 dark:bg-white/[0.03] p-8 space-y-4 border-t border-stone-100 dark:border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                    <span>Base Valuation</span>
                    <span className="text-foreground">₹{order.subtotal?.toLocaleString() || order.totalAmount?.toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                      <span>Tactical Discount ({order.couponUsed})</span>
                      <span>- ₹{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-stone-200 dark:border-white/10 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-stone-400">Financial Closure</span>
                    <span className="text-2xl font-serif font-black lowercase text-[#A38A5F]">₹{order.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setLoading(true);
    let usersMap = new Map<string, string>();

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

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.shippingDetails?.fullName || o.user_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    const loadingToast = toast.loading('Dispatching orders...');
    try {
      const updateData: any = { status };
      if (status === 'Delivered') {
        updateData.deliveredAt = Date.now();
      }
      await updateDoc(doc(db, 'orders', id), updateData);
      
      if (status === 'Failed') {
        await addDoc(collection(db, 'notifications'), {
          type: 'order_failed',
          orderId: id,
          userName: orders.find(o => o.id === id)?.shippingDetails?.fullName || 'Customer',
          totalAmount: orders.find(o => o.id === id)?.totalAmount,
          status: 'unread',
          createdAt: Date.now()
        });
      }
      
      toast.success(`Protocol Updated: ${status}`, { id: loadingToast });
    } catch(err:any) {
      console.error('Error updating status:', err);
      toast.error('Authority Failed', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-black lowercase text-foreground">deployment<span className="text-[#A38A5F]">.</span>logs</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Order Manifest & Fulfillment Center</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search by ID, Customer, or Status..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-[#A38A5F] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        </div>
      </div>

      <div>
        {loading ? null : filteredOrders.length === 0 ? (
          <div className="p-20 text-center space-y-4 bg-white dark:bg-[#0D0D0D] rounded-[40px] border border-stone-200 dark:border-white/5">
            <Package className="mx-auto text-stone-200" size={48} />
            <p className="text-xs text-stone-400 font-black uppercase tracking-widest">No active logs in tactical registry.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredOrders.map(order => (
              <OrderRow key={order.id} order={order} updateStatus={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
