import { useEffect, useState } from 'react';
import { Users, ShoppingCart, DollarSign, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { Link } from 'react-router';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, products: 0 });
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        const pSnap = await getDocs(collection(db, 'products'));
        const oSnap = await getDocs(collection(db, 'orders'));
        
        let rev = 0;
        oSnap.forEach(doc => { rev += (doc.data().totalAmount || 0); });
        
        setStats({
          users: uSnap.size,
          products: pSnap.size,
          orders: oSnap.size,
          revenue: rev
        });

        // Top 5 low stock products (stock <= 10)
        let lowProducts: any[] = [];
        pSnap.docs.forEach(d => {
          const data = d.data();
          if (data.stock <= 10) {
            lowProducts.push({ id: d.id, ...data });
          }
        });
        setLowStock(lowProducts.sort((a,b) => a.stock - b.stock).slice(0, 5));

        // Top 5 recent orders
        const usersMap = new Map(uSnap.docs.map(d => [d.id, d.data().name]));
        const recentOrdersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const roSnap = await getDocs(recentOrdersQ);
        setRecentOrders(roSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          user_name: usersMap.get(d.data().userId) || 'Unknown'
        })));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">EVIA <span className="text-indigo-600 font-medium text-lg">Admin Central</span></h2>
          <p className="text-gray-500 text-sm">Monitoring active operations in real-time</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex p-10 justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <DollarSign size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-black mt-1 text-gray-900">₹{stats.revenue.toLocaleString()}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-black mt-1 text-gray-900">{stats.orders.toLocaleString()}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Package size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-black mt-1 text-gray-900">{stats.products.toLocaleString()}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-black mt-1 text-gray-900">{stats.users.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Low Stock Inventory
                </h3>
                <Link to="/admin/product" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">View All <ArrowRight size={14}/></Link>
              </div>
              <div className="p-2">
                {lowStock.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500 font-medium">No low stock items.</p>
                ) : (
                  lowStock.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 overflow-hidden">
                          {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 line-clamp-1">{p.name}</div>
                          <div className="text-xs text-gray-500">₹{p.price?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-black">
                        {p.stock} left
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-emerald-500" />
                  Recent Orders
                </h3>
                <Link to="/admin/order" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">View All <ArrowRight size={14}/></Link>
              </div>
              <div className="p-2">
                {recentOrders.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500 font-medium">No recent orders.</p>
                ) : (
                  recentOrders.map(o => (
                    <div key={o.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div>
                        <div className="font-bold text-sm text-gray-900">#{o.id.slice(-6)}</div>
                        <div className="text-xs text-gray-500">{o.user_name} • {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-gray-900">₹{o.totalAmount?.toLocaleString()}</div>
                        <div className={`text-[10px] font-black uppercase tracking-wider ${
                          o.status === 'Placed' ? 'text-amber-600' :
                          o.status === 'Dispatched' ? 'text-indigo-600' :
                          o.status === 'Delivered' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {o.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
