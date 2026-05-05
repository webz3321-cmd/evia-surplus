import { useNavigate } from 'react-router';
import { useAppContext } from '../context';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, user } = useAppContext();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
          <Trash2 size={40} />
        </div>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="font-bold text-xl mb-4">Shopping Cart</h2>
      
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {cart.map((item, index) => (
          <div key={`${item.product.id}-${item.size || 'no-size'}-${index}`} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-sm text-gray-800 line-clamp-1">{item.product.name}</h3>
                <div className="flex gap-2 items-center">
                  <div className="font-bold text-indigo-600 mt-1">₹{item.product.price.toLocaleString()}</div>
                  {item.size && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">{item.size}</span>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center border border-gray-200 rounded text-sm w-fit">
                  <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.size)} className="px-2 py-1 bg-gray-50 text-gray-500"><Minus size={14}/></button>
                  <span className="px-3 font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)} className="px-2 py-1 bg-gray-50 text-gray-500"><Plus size={14}/></button>
                </div>
                <button onClick={() => removeFromCart(item.product.id, item.size)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center justify-between font-bold text-lg mb-4">
          <span>Total:</span>
          <span className="text-indigo-600">₹{cartTotal.toLocaleString()}</span>
        </div>
        <button 
          onClick={() => {
            if(!user) {
              navigate('/login');
            } else {
              navigate('/checkout');
            }
          }}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl transition-colors"
        >
          {user ? 'Proceed to Checkout' : 'Login to Checkout'}
        </button>
      </div>
    </div>
  );
}
