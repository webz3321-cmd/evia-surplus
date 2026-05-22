import { useEffect, useState } from 'react';
import { Users, ShoppingCart, DollarSign, Package, AlertTriangle, ArrowRight, Database, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Link } from 'react-router';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, products: 0 });
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const runSeeder = async () => {
    if (seeding) return;
    if (!window.confirm("WARNING: Truncating database. This will delete all existing products, categories, coupons, and active offers, and replace them with the official Evia Surplus 2026 Vintage military-grade defaults. Proceed?")) return;

    try {
      setSeeding(true);
      const loadingToast = toast.loading("Executing Database Curation Protocol...");

      // Get snapshot of existing items of previous catalogs
      const catSnap = await getDocs(collection(db, 'categories'));
      const prodSnap = await getDocs(collection(db, 'products'));
      const offerSnap = await getDocs(collection(db, 'offers'));
      const couponSnap = await getDocs(collection(db, 'coupons'));

      // Delete categories
      for (const d of catSnap.docs) {
        await deleteDoc(doc(db, 'categories', d.id));
      }
      // Delete products
      for (const d of prodSnap.docs) {
        await deleteDoc(doc(db, 'products', d.id));
      }
      // Delete offers
      for (const d of offerSnap.docs) {
        await deleteDoc(doc(db, 'offers', d.id));
      }
      // Delete coupons
      for (const d of couponSnap.docs) {
        await deleteDoc(doc(db, 'coupons', d.id));
      }

      // Seed Military Categories
      const categoriesToSeed = [
        { name: 'Outerwear & Parkas', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=600' },
        { name: 'Utility Shirts & Tops', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600' },
        { name: 'Combat Trousers', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600' },
        { name: 'Field Tactical Gear', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600' },
      ];

      const catIds: Record<string, string> = {};
      for (const cat of categoriesToSeed) {
        const docRef = await addDoc(collection(db, 'categories'), {
          name: cat.name,
          image: cat.image,
          createdAt: Date.now()
        });
        catIds[cat.name] = docRef.id;
      }

      // Seed products
      const productsToSeed = [
        {
          name: "1968 Pattern US Army M-65 Field Jacket",
          catId: catIds["Outerwear & Parkas"],
          price: 14500,
          stock: 5,
          image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["S", "M", "L", "XL"],
          productType: "buy",
          description: "An authentic, heavy-duty olive drab combat jacket with solid brass Rapid zippers, packable hood, and original cold-weather government contract labels. Engineered to withstand harsh military operations."
        },
        {
          name: "WWII Marine Corps Herringbone Fatigue Pants",
          catId: catIds["Combat Trousers"],
          price: 11200,
          stock: 4,
          image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["30", "32", "34", "36"],
          productType: "buy",
          description: "Crafted in heavy-duty 8oz vintage olive drab herringbone twill (HBT) cotton. Features custom laurel-leaf brass buttons, traditional high-rise pattern, and deep square bellows pockets."
        },
        {
          name: "1950s British Army Wool Combat Shirt",
          catId: catIds["Utility Shirts & Tops"],
          price: 8900,
          stock: 8,
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["M", "L", "XL"],
          productType: "buy",
          description: "Sourced from vintage cold-weather combat gear stock. Exceptional 100% heavyweight wool construction with cross-stitched utility epaulets, flapped bellows chest pockets, and genuine urea buttons."
        },
        {
          name: "USAF Sage Green MA-1 Flight Jacket",
          catId: catIds["Outerwear & Parkas"],
          price: 16800,
          stock: 3,
          image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["M", "L", "XL"],
          productType: "buy",
          description: "1980s military-issue high-grade nylon aviator jacket in sage green. Features thick heavy-duty ribbed cuffs, reversible bright emergency orange lining, and signature utility pen pocket on left sleeve."
        },
        {
          name: "US Navy Steel-Toe Leather Combat Boots",
          catId: catIds["Field Tactical Gear"],
          price: 13500,
          stock: 2,
          image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["8", "9", "10", "11"],
          productType: "buy",
          description: "Genuine waterproof oil-treated steerhide leather combat boot with non-slip neoprene lug soles. Features iconic brass speed-lacing eyelets, raw leather lining, and reinforced cap toe."
        },
        {
          name: "1960s OG-107 Swiss Mountain Rucksack",
          catId: catIds["Field Tactical Gear"],
          price: 6400,
          stock: 9,
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["Standard"],
          productType: "buy",
          description: "Heavy cotton canvas Swiss mountaineering rucksack. Reinforced vulcanized base, adjustable premium saddle-leather shoulder straps, and modular side straps for original field tool attachments."
        },
        {
          name: "French Foreign Legion Denim Utility Shorts",
          catId: catIds["Combat Trousers"],
          price: 5800,
          stock: 6,
          image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600",
          secondaryImages: [
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600"
          ],
          sizes: ["30", "32", "34", "36"],
          productType: "buy",
          description: "Heavyweight indigo dyed cotton denim combat shorts from vintage military stock. High waist, double-pleat front, button fly, and wider cuffs for exceptional retro service aesthetic."
        }
      ];

      for (const prod of productsToSeed) {
        await addDoc(collection(db, 'products'), {
          ...prod,
          createdAt: Date.now()
        });
      }

      // Seed offers
      await addDoc(collection(db, 'offers'), {
        title: "VINTAGE SURPLUS ACQUISITION",
        text: "Spend ₹15,000 or more to receive an authentic deadstock military utility cap with your order.",
        active: true,
        createdAt: Date.now()
      });

      // Seed coupons
      await addDoc(collection(db, 'coupons'), {
        code: "SURPLUS10",
        type: "percentage",
        value: 10,
        minAmount: 5000,
        isActive: true,
        createdAt: Date.now()
      });

      // Update counters in states
      const uSnap = await getDocs(collection(db, 'users'));
      const pSnap2 = await getDocs(collection(db, 'products'));
      const oSnap = await getDocs(collection(db, 'orders'));
      let rev = 0;
      oSnap.forEach(doc => { rev += (doc.data().totalAmount || 0); });
      setStats({
        users: uSnap.size,
        products: pSnap2.size,
        orders: oSnap.size,
        revenue: rev
      });

      // Reset localstorage key as safely seeded
      localStorage.setItem('evia_surplus_seeded_v10', 'true');
      toast.success("Database Purged & Default Curated Militaria Catalog Restored!", { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to restore default catalog: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

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

          {/* Curator Database & Sourcing Master Control Console */}
          <div className="bg-stone-900 border border-stone-800 text-stone-100 p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Database className="text-[#f97316] animate-pulse" size={18} />
                <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-[#f97316]">Evia Sourcing System • Master Database Console</h3>
              </div>
              <h4 className="text-lg font-bold mb-1">Militaria Ledger Curation Protocol</h4>
              <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
                Manually control the inventory archive. You can reset and re-seed the digital ledger back to the original Evia 2026 military-grade defaults anytime. Custom entries you manually create in the Products panel are fully persistent and won't be replaced otherwise.
              </p>
            </div>
            <button
              disabled={seeding}
              onClick={runSeeder}
              className={`px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all ${
                seeding 
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-750'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg active:scale-95 cursor-pointer'
              }`}
            >
              <RefreshCw className={seeding ? "animate-spin" : ""} size={16} />
              {seeding ? "Executing Reset Protocol..." : "Reset Catalog to Defaults"}
            </button>
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
