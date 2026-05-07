import { BrowserRouter, Routes, Route, Outlet, Navigate, NavLink, Link } from 'react-router';
import { AppProvider, useAppContext } from './context';
import { useEffect, useState } from 'react';
import { Home, Search, ShoppingCart, User as UserIcon, Menu, X, LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Globe, Ticket } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import OrderPage from './pages/OrderPage';
import ProductPage from './pages/ProductPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';

// Layout for general users
const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { cart } = useAppContext();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 overflow-x-hidden md:max-w-md md:mx-auto md:border-x md:border-gray-200 md:shadow-xl md:relative relative">
      {/* Header */}
      <header className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1"><Menu size={24} /></button>
          <h1 className="text-xl font-black tracking-tighter text-indigo-600">EVIA</h1>
        </div>
        <div className="flex items-center gap-4">
          <Search size={20} className="text-gray-600" />
        </div>
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-lg flex flex-col">
            <div className="p-4 bg-gray-50 flex items-center justify-between border-b">
              <h2 className="font-bold text-lg">Menu</h2>
              <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-gray-700">
              <Link to="/" className="font-medium hover:text-indigo-600" onClick={() => setSidebarOpen(false)}>Home</Link>
              <Link to="/order" className="font-medium hover:text-indigo-600" onClick={() => setSidebarOpen(false)}>My Orders</Link>
              <Link to="/profile" className="font-medium hover:text-indigo-600" onClick={() => setSidebarOpen(false)}>My Account</Link>
              <hr />
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Categories</div>
              <Link to="/?cat=electronics" className="hover:text-indigo-500" onClick={() => setSidebarOpen(false)}>Electronics</Link>
              <Link to="/?cat=fashion" className="hover:text-indigo-500" onClick={() => setSidebarOpen(false)}>Fashion</Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full md:w-full md:absolute bg-white border-t border-gray-200 flex justify-around py-3 pb-safe z-30 transition-all">
        <NavLink to="/" className={({isActive}) => `flex justify-center flex-col items-center gap-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}>
          <Home size={22} />
          <span className="text-[10px] font-bold">Home</span>
        </NavLink>
        <NavLink to="/cart" className={({isActive}) => `flex justify-center flex-col items-center gap-1 transition-colors relative ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}>
          <div className="relative">
            <ShoppingCart size={22} />
            {cart.length > 0 && <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">{cart.length}</div>}
          </div>
          <span className="text-[10px] font-bold">Cart</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `flex justify-center flex-col items-center gap-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}>
          <UserIcon size={22} />
          <span className="text-[10px] font-bold">Profile</span>
        </NavLink>
      </nav>
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

const AppContent = () => {
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
      <Routes>
        {/* User Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
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
