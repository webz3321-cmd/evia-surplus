import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  fullName?: string;
  addressLine?: string;
  address?: string;
  landmark?: string;
  taluq?: string;
  state?: string;
  pincode?: string;
  avatarUrl?: string;
};

type CartItem = {
  product: any;
  quantity: number;
  size?: string;
};

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: any, quantity: number, size?: string) => void;
  removeFromCart: (productId: any, size?: string) => void;
  updateQuantity: (productId: any, quantity: number, size?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  wishlist: any[];
  addToWishlist: (product: any) => void;
  removeFromWishlist: (productId: any) => void;
  isInWishlist: (productId: any) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    // Initial load from storage to prevent flicker
    const storedUser = localStorage.getItem('evia_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch(e) {}
    }
    // Storage load is synchronous, but we'll still wait for Auth sync in App.tsx
    // so we don't set loading=false here if we expect an auth sync
    
    const storedCart = localStorage.getItem('evia_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch(e) {}
    }
    const storedWishlist = localStorage.getItem('evia_wishlist');
    if (storedWishlist) {
      try {
        setWishlist(JSON.parse(storedWishlist));
      } catch(e) {}
    }
    // We let App.tsx set loading to false after auth check
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('evia_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('evia_user');
    sessionStorage.removeItem('evia_vault_unsealed');
  };

  const addToCart = (product: any, quantity: number, size?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.size === size);
      let newCart;
      if (existingIndex > -1) {
        newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
      } else {
        newCart = [...prev, { product, quantity, size }];
      }
      localStorage.setItem('evia_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (productId: any, size?: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => !(item.product.id === productId && item.size === size));
      localStorage.setItem('evia_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (productId: any, quantity: number, size?: string) => {
    setCart(prev => {
      const newCart = prev.map(item => (item.product.id === productId && item.size === size) ? { ...item, quantity } : item);
      localStorage.setItem('evia_cart', JSON.stringify(newCart));
      return newCart;
    });
  };
  
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('evia_cart');
  };

  const addToWishlist = (product: any) => {
    setWishlist(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      const newWishlist = [...prev, product];
      localStorage.setItem('evia_wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const removeFromWishlist = (productId: any) => {
    setWishlist(prev => {
      const newWishlist = prev.filter(item => item.id !== productId);
      localStorage.setItem('evia_wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const isInWishlist = (productId: any) => {
    return wishlist.some(item => item.id === productId);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return (
    <AppContext.Provider value={{ 
      user, loading, login, logout, cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal,
      wishlist, addToWishlist, removeFromWishlist, isInWishlist,
      setLoading // Expose setLoading to App.tsx for auth sync
    } as any}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
