import { BrowserRouter, Routes, Route, Outlet, Navigate, NavLink, Link, useLocation } from 'react-router';
import { AppProvider, useAppContext } from './context';
import { useEffect, useState, useMemo } from 'react';
import { Home, Search, ShoppingCart, User as UserIcon, Menu, X, LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Globe, Ticket, Sparkles, Heart } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import OrderPage from './pages/OrderPage';
import ProductPage from './pages/ProductPage';
import WishlistPage from './pages/WishlistPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOffers from './pages/admin/AdminOffers';
import AdminSettings, { AVAILABLE_FONTS } from './pages/admin/AdminSettings';

// Layout for general users
const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const { cart, user, wishlist } = useAppContext();
  const location = useLocation();

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      console.warn("Categories listener failed or was interrupted:", error);
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    }, (error) => {
      console.warn("Global settings listener failed or was interrupted:", error);
    });

    return () => {
      unsubCats();
      unsubSettings();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Editorial Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-4 md:gap-10">
            {/* Mobile Menu trigger */}
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden rounded-full p-2 hover:bg-secondary transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            
            <Link to="/" className="font-display text-2xl tracking-tight text-foreground hover:opacity-90 transition-opacity flex items-center gap-3">
              {settings?.logoImage ? (
                <img src={settings.logoImage} alt="logo" className="h-12 w-12 rounded-full object-cover shrink-0 border border-border shadow-xs" />
              ) : null}
              {(!settings?.logoImage || settings?.showTextWithImage) && (
                <span>
                  {settings?.logoText || 'evia surplus'}
                  <span className="text-accent">/</span>
                </span>
              )}
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
              <Link to="/" className="transition-colors hover:text-foreground">Shop all</Link>
              {categories.slice(0, 4).map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/?cat=${cat.name}`} 
                  className="transition-colors hover:text-foreground uppercase tracking-wider text-[11px]"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              aria-label="Search" 
              className="rounded-full p-2 transition-colors hover:bg-secondary text-foreground flex items-center justify-center"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
            
            {user ? (
              <Link 
                to="/profile" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-foreground transition-all text-[11px] font-bold uppercase tracking-wider border border-border bg-background/50 hover:border-foreground/40"
              >
                <UserIcon className="h-4 w-4 text-accent" />
                <span className="truncate max-w-[70px] sm:max-w-[120px]">
                  {user.name ? `${user.name.split(' ')[0]}` : 'Profile'}
                </span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-foreground transition-all text-[11px] font-bold uppercase tracking-wider border border-border bg-background/50 hover:border-foreground/40"
              >
                <UserIcon className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            <Link 
              to="/wishlist" 
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-foreground transition-all text-[11px] font-bold uppercase tracking-wider border border-border bg-background/50 hover:border-foreground/40 animate-none hover:scale-105"
              title="Saved Items / Whistel"
            >
              <Heart className={`h-4 w-4 ${wishlist?.length > 0 ? 'text-red-500 fill-red-500' : 'text-stone-550'}`} />
              <span className="hidden sm:inline">Saved</span>
              {wishlist?.length > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-red-550 px-1 text-[9px] font-black text-white leading-none">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            <Link 
              to="/cart" 
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-foreground transition-all text-[11px] font-bold uppercase tracking-wider border border-border bg-accent/5 hover:border-foreground/40"
            >
              <ShoppingBag className="h-4 w-4 text-accent" />
              <span>Cart</span>
              {cart.length > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-black text-accent-foreground leading-none animate-bounce">
                  {cart.length}
                </span>
              ) : (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-muted/20 px-1 text-[9px] font-black text-muted-foreground leading-none">
                  0
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Styled Side Drawer Card */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative w-[280px] xs:w-80 bg-background h-full shadow-2xl flex flex-col border-r border-border animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <Link to="/" className="font-display text-2xl tracking-tight flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                {settings?.logoImage ? (
                  <img src={settings.logoImage} alt="logo" className="h-12 w-12 rounded-full object-cover shrink-0 border border-border shadow-xs" />
                ) : null}
                {(!settings?.logoImage || settings?.showTextWithImage) && (
                  <span>
                    {settings?.logoText || 'evia surplus'}
                    <span className="text-accent">/</span>
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-1.5 hover:bg-secondary text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-foreground">
              <div className="flex flex-col gap-3">
                <Link to="/" className="font-display text-xl text-foreground hover:text-accent transition-colors" onClick={() => setSidebarOpen(false)}>Home / Shop All</Link>
                <Link to="/wishlist" className="font-display text-xl text-foreground hover:text-accent transition-colors" onClick={() => setSidebarOpen(false)}>Saved Items (Whistel)</Link>
                <Link to="/order" className="font-display text-xl text-foreground hover:text-accent transition-colors" onClick={() => setSidebarOpen(false)}>My Orders</Link>
                <Link to="/profile" className="font-display text-xl text-foreground hover:text-accent transition-colors" onClick={() => setSidebarOpen(false)}>My Account</Link>
              </div>
              
              <div className="h-[1px] bg-border my-2"></div>
              
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em]">Explore Categories</span>
                <div className="flex flex-col gap-3">
                  {categories.map((cat: any) => (
                    <Link 
                      key={cat.id} 
                      to={`/?cat=${cat.name}`} 
                      className="text-sm font-medium text-foreground hover:text-accent transition-colors capitalize" 
                      onClick={() => setSidebarOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Widescreen Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Premium Site Footer */}
      <footer className="border-t border-border bg-surface mt-auto">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
          <div>
            <Link to="/" className="font-display text-2xl tracking-tight text-foreground flex items-center gap-3">
              {settings?.logoImage ? (
                <img src={settings.logoImage} alt="logo" className="h-12 w-12 rounded-full object-cover shrink-0 border border-border shadow-xs" />
              ) : null}
              {(!settings?.logoImage || settings?.showTextWithImage) && (
                <span>
                  {settings?.logoText || 'evia surplus'}
                  <span className="text-accent">/</span>
                </span>
              )}
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Genuine vintage military issue, heavy-duty utility workwear, and salvage-grade surplus apparel.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">Explore Store</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="transition-colors hover:text-foreground">Shop All</Link></li>
              {categories.slice(0, 3).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/?cat=${cat.name}`} className="transition-colors hover:text-foreground capitalize">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">Support</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/wishlist" className="transition-colors hover:text-foreground font-bold text-accent">Saved Index (Whistel)</Link></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Carbon Neutral Shipping</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">30-day Free Returns</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Lifetime Support & Repair</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">Contact Team</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">Letters from the studio</h4>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              New releases, restocks, and studio stories. No spam or noise.
            </p>
            <form className="mt-4 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); alert("Subscribed!"); }}>
              <input 
                type="email" 
                required 
                placeholder="you@example.com"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs outline-none focus:border-foreground transition-all" 
              />
              <button className="rounded-full bg-primary px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-[10px] uppercase tracking-wider text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} Evia Surplus & Co. All rights reserved.</p>
            <p>Carbon-neutral delivery worldwide · easy returns</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAppContext();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
          <span className="text-xl font-black tracking-tighter text-indigo-600">EVIA Admin</span>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 bg-white w-64 shadow-xl z-40 transform transition-transform duration-300 md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-2xl text-gray-900 tracking-tight">EVIA <span className="text-indigo-600 font-medium text-lg">Admin</span></h2>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>
        <nav className="p-2 flex flex-col gap-1 h-[calc(100vh-140px)] overflow-y-auto">
          <NavLink to="/admin" end className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><LayoutDashboard size={20} /> Dashboard</NavLink>
          <NavLink to="/admin/category" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><Package size={20} /> Categories</NavLink>
          <NavLink to="/admin/product" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><ShoppingBag size={20} /> Products</NavLink>
          <NavLink to="/admin/order" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><ShoppingCart size={20} /> Orders</NavLink>
          <NavLink to="/admin/user" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><Users size={20} /> Users</NavLink>
          <NavLink to="/admin/coupons" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><Ticket size={20} /> Coupons</NavLink>
          <NavLink to="/admin/offers" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><Sparkles size={20} /> Offers</NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => `flex items-center gap-2 p-2 rounded-xl font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'}`}><Settings size={20} /> Brand Settings</NavLink>
          
          <div className="mt-auto pt-4 flex flex-col gap-1">
            <div className={`mx-2 p-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${isOnline ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isOnline ? 'Network Online' : 'Network Offline'}
            </div>
            <Link to="/" className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors border-t"><Globe size={20} /> View Site</Link>
            <div className="mt-1 text-center pb-2">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors"><LogOut size={20} /> Logout</button>
            </div>
          </div>
        </nav>
      </div>
      
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

import AdminCoupons from './pages/admin/AdminCoupons';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(data);
        
        // Dynamic Tab/Google Tab Title Update
        if (data.logoText) {
          const capitalizedBrand = data.logoText.toUpperCase().trim();
          document.title = `${capitalizedBrand} | Premium Curations & Surplus`;
        } else {
          document.title = 'EVIA | Premium Lifestyle Shopping Store';
        }

        // Extremely robust Dynamic Favicon Update to match uploaded logoImage in google and browser tabs
        const currentLogoUrl = data.logoImage && data.logoImage.trim() !== '' 
          ? data.logoImage.trim() 
          : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="30" fill="%23121110"/><circle cx="50" cy="50" r="38" stroke="%23A38A5F" stroke-width="2.5"/><text x="50%" y="54%" font-family="serif, Georgia, Times" font-weight="950" font-size="44" fill="%23A38A5F" dominant-baseline="middle" text-anchor="middle">E</text><circle cx="50" cy="22" r="3" fill="%23A38A5F"/><circle cx="50" cy="78" r="3" fill="%23A38A5F"/></svg>`;

        // Remove any pre-existing favicon declarations to avoid type conflicts or caching issues
        const iconSelects = document.querySelectorAll("link[rel*='icon']");
        iconSelects.forEach(node => node.parentNode?.removeChild(node));

        // Create a new master icon node
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = currentLogoUrl;

        // Auto-assign matching Mime type if applicable
        if (currentLogoUrl.startsWith('data:image/svg+xml')) {
          newFavicon.type = 'image/svg+xml';
        } else if (currentLogoUrl.endsWith('.png')) {
          newFavicon.type = 'image/png';
        } else if (currentLogoUrl.endsWith('.jpg') || currentLogoUrl.endsWith('.jpeg')) {
          newFavicon.type = 'image/jpeg';
        } else if (currentLogoUrl.endsWith('.gif')) {
          newFavicon.type = 'image/gif';
        } else if (currentLogoUrl.endsWith('.ico')) {
          newFavicon.type = 'image/x-icon';
        }
        
        document.head.appendChild(newFavicon);

        // Append a shortcut icon fallback link for older browser standards
        const newShortcut = document.createElement('link');
        newShortcut.rel = 'shortcut icon';
        newShortcut.href = currentLogoUrl;
        document.head.appendChild(newShortcut);
        
        // Dynamic styling injection
        const fontObj = AVAILABLE_FONTS.find(f => f.name === data.headerFont);
        const fontId = 'dynamic-google-font';
        let fontLink = document.getElementById(fontId) as HTMLLinkElement;
        if (fontObj) {
          if (!fontLink) {
            fontLink = document.createElement('link');
            fontLink.id = fontId;
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
          }
          fontLink.href = `https://fonts.googleapis.com/css2?${fontObj.import}&display=swap`;
        }

        const styleId = 'dynamic-theme-styles';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }

        const fontFamily = fontObj ? fontObj.css : '"Instrument Serif", serif';
        const siteBg = data.siteBgColor || '#faf8f5';
        const heroBg = data.heroBgColor || '#f6f3ed';
        const accent = data.accentColor || '#9f3a38';
        const textColor = data.textColor || '#1c1c1c';
        const btnRadius = data.buttonRadius || '9999px';

        styleTag.innerHTML = `
          :root {
            --font-display: ${fontFamily} !important;
            --color-background: ${siteBg} !important;
            --color-surface: ${heroBg} !important;
            --color-accent: ${accent} !important;
            --color-ring: ${accent} !important;
            --color-foreground: ${textColor} !important;
          }
          html, body {
            background-color: ${siteBg} !important;
            color: ${textColor} !important;
          }
          h1, h2, h3, h4, .font-display, [class*="font-display"] {
            font-family: ${fontFamily} !important;
            letter-spacing: ${data.headerTracking || '-0.02em'} !important;
            text-transform: ${data.headerUppercase ? 'uppercase' : 'none'} !important;
          }
          /* Dynamic button corner rounded control */
          button:not([disabled]), .btn-rounded {
            border-radius: ${btnRadius} !important;
          }
          .custom-hero-bg, .bg-surface {
            background-color: ${heroBg} !important;
          }
          .custom-site-bg, .bg-background {
            background-color: ${siteBg} !important;
          }
          .text-accent {
            color: ${accent} !important;
          }
          .bg-accent {
            background-color: ${accent} !important;
          }
        `;
      }
    }, (error) => {
      console.warn("Dynamic layout settings collection observer failed:", error);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // Disable right click, text selection, zoom
    const disableRightClick = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', disableRightClick);
    
    // Add global css for no-select
    document.body.classList.add('select-none');
    
    // Disable pinch zoom (naive approach for touch devices)
    const disablePinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', disablePinchZoom, { passive: false });

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('touchmove', disablePinchZoom);
      document.body.classList.remove('select-none');
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* User Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="category" element={<AdminCategories />} />
          <Route path="product" element={<AdminProducts />} />
          <Route path="order" element={<AdminOrders />} />
          <Route path="user" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" />
      <AppContent />
    </AppProvider>
  );
}
