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

    try {
      setSeeding(true);
      const loadingToast = toast.loading("Syncing...");

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

      } catch (err: any) {
        console.error("Dashboard data load failure:", err);
        if (err.message?.includes('permission') || err.message?.includes('Insufficient')) {
          toast.error("Critical: Security rules preventing dashboard load. Confirm admin status.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-200 dark:border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-serif font-black text-foreground lowercase">command<span className="text-[#A38A5F]">.</span>center</h2>
          <p className="text-stone-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Active Operations Real-time Telemetry</p>
        </div>
        
        <div className="flex items-center gap-3 bg-stone-100/50 dark:bg-white/5 px-4 py-2 rounded-2xl border border-stone-200 dark:border-white/5">
          <div className="w-2 h-2 rounded-full bg-[#A38A5F] animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#A38A5F]">Status: Live Secure Node</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex p-20 justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-[#A38A5F]/20 rounded-full"></div>
            <div className="absolute inset-0 w-12 h-12 border-2 border-[#A38A5F] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Annual Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#A38A5F]', bg: 'bg-[#A38A5F]/5' },
              { label: 'Active Orders', value: stats.orders.toLocaleString(), icon: ShoppingCart, color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-white/5' },
              { label: 'Total Curations', value: stats.products.toLocaleString(), icon: Package, color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-white/5' },
              { label: 'Global Registry', value: stats.users.toLocaleString(), icon: Users, color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-white/5' },
            ].map((stat, i) => (
              <div key={i} className="group bg-white dark:bg-[#0D0D0D] p-8 rounded-[32px] shadow-sm border border-stone-200 dark:border-white/5 flex flex-col hover:border-[#A38A5F]/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                <div className={`p-4 ${stat.bg} w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={22} className={stat.color} />
                </div>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-serif font-black mt-2 text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#A38A5F]/20 blur-[100px] -mr-40 -mt-40 group-hover:bg-[#A38A5F]/30 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Database className="text-[#A38A5F]" size={20} />
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-[#A38A5F]">Catalog Synchronization</h3>
                </div>
                <h4 className="text-2xl font-serif font-black leading-tight">Master Ledger Reset</h4>
                <p className="text-[13px] opacity-60 max-w-2xl leading-relaxed font-medium">
                  Sync the global inventory archives with default specifications. 
                  This resets categories, products, and catalogs to factory defaults.
                </p>
              </div>
              <button
                disabled={seeding}
                onClick={runSeeder}
                className={`h-16 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
                  seeding 
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#A38A5F] hover:text-white cursor-pointer'
                }`}
              >
                <RefreshCw className={seeding ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"} size={16} />
                {seeding ? "Syncing..." : "Restore Master Ledger"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-[#0D0D0D] rounded-[32px] shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
              <div className="p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-serif font-black text-xl flex items-center gap-3 text-foreground">
                    <AlertTriangle size={20} className="text-[#A38A5F]" />
                    Tactical Shortage
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Critical Stock Thresholds</p>
                </div>
                <Link to="/admin.evia.3321/product" className="p-3 bg-stone-50 dark:bg-white/5 rounded-full hover:bg-[#A38A5F]/10 hover:text-[#A38A5F] transition-all">
                  <ArrowRight size={18}/>
                </Link>
              </div>
              <div className="p-4">
                {lowStock.length === 0 ? (
                  <p className="p-10 text-center text-xs text-stone-400 font-black uppercase tracking-widest">Inventory Fully Sustained</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-4 hover:bg-stone-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl border border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-black overflow-hidden group-hover:scale-105 transition-transform">
                            {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-sm text-foreground line-clamp-1">{p.name}</div>
                            <div className="text-[10px] font-black text-[#A38A5F] uppercase tracking-wider">₹{p.price?.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
                          {p.stock} units
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D0D0D] rounded-[32px] shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
              <div className="p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-serif font-black text-xl flex items-center gap-3 text-foreground">
                    <ShoppingCart size={20} className="text-[#A38A5F]" />
                    Recent Exchange
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Latest Acquisition Logs</p>
                </div>
                <Link to="/admin.evia.3321/order" className="p-3 bg-stone-50 dark:bg-white/5 rounded-full hover:bg-[#A38A5F]/10 hover:text-[#A38A5F] transition-all">
                  <ArrowRight size={18}/>
                </Link>
              </div>
              <div className="p-4">
                {recentOrders.length === 0 ? (
                  <p className="p-10 text-center text-xs text-stone-400 font-black uppercase tracking-widest">No Acquisition Records Found</p>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map(o => (
                      <div key={o.id} className="flex justify-between items-center p-4 hover:bg-stone-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
                        <div className="space-y-1">
                          <div className="font-serif font-black text-base text-foreground">#{o.id.slice(-6)}</div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">{o.user_name} • {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-black text-sm text-foreground">₹{o.totalAmount?.toLocaleString()}</div>
                          <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                            o.status === 'Placed' ? 'text-amber-500' :
                            o.status === 'Dispatched' ? 'text-indigo-500' :
                            o.status === 'Delivered' ? 'text-emerald-500' :
                            'text-rose-500'
                          }`}>
                            {o.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
