import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type CartItem, type Product } from '../types';
import { useAuth } from './AuthContext';
import api from '../lib/api';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: string) => boolean;
  loading: boolean;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'melody_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart on mount and when auth state changes
  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const loadCart = async () => {
    if (isAuthenticated) {
      // Load from backend
      try {
        setLoading(true);
        const response = await api.get('/cart');
        const cartItems: CartItem[] = response.data.items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity,
        }));
        setItems(cartItems);
        // Also save to localStorage for offline access
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        
        // If backend cart is empty, check localStorage and sync
        if (cartItems.length === 0) {
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            try {
              const localItems = JSON.parse(saved);
              if (localItems.length > 0) {
                // Sync localStorage to backend
                await api.post('/cart/sync', localItems.map((item: CartItem) => ({
                  product_id: item.product.id,
                  quantity: item.quantity,
                })));
                // Reload from backend
                const syncResponse = await api.get('/cart');
                const syncedItems: CartItem[] = syncResponse.data.items.map((item: any) => ({
                  product: item.product,
                  quantity: item.quantity,
                }));
                setItems(syncedItems);
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(syncedItems));
              }
            } catch (syncError) {
              console.error('Failed to sync cart:', syncError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load cart from backend:', error);
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            setItems(JSON.parse(saved));
          }
        } catch {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Load from localStorage for unauthenticated users
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        setItems(saved ? JSON.parse(saved) : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  };



  // Save to localStorage whenever items change (as backup for authenticated users too)
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (isAuthenticated) {
      // Add to backend
      try {
        const existingItem = items.find((item) => item.product.id === product.id);
        if (existingItem) {
          // Update quantity
          await api.put(`/cart/items/${product.id}`, {
            quantity: existingItem.quantity + quantity,
          });
        } else {
          // Add new item
          await api.post('/cart/items', {
            product_id: product.id,
            quantity: quantity,
          });
        }
        // Reload cart from backend
        await loadCart();
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Fallback to local state
        setItems((prevItems) => {
          const existingItem = prevItems.find((item) => item.product.id === product.id);
          if (existingItem) {
            return prevItems.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            return [...prevItems, { product, quantity }];
          }
        });
      }
    } else {
      // Add to localStorage for unauthenticated users
      setItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.product.id === product.id);
        if (existingItem) {
          return prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevItems, { product, quantity }];
        }
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (isAuthenticated) {
      // Remove from backend
      try {
        await api.delete(`/cart/items/${productId}`);
        // Reload cart from backend
        await loadCart();
      } catch (error) {
        console.error('Failed to remove from cart:', error);
        // Fallback to local state
        setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
      }
    } else {
      // Remove from localStorage for unauthenticated users
      setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
      // Update in backend
      try {
        await api.put(`/cart/items/${productId}`, { quantity });
        // Reload cart from backend
        await loadCart();
      } catch (error) {
        console.error('Failed to update cart quantity:', error);
        // Fallback to local state
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      }
    } else {
      // Update in localStorage for unauthenticated users
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      // Clear from backend
      try {
        await api.delete('/cart');
        setItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear cart:', error);
        setItems([]);
      }
    } else {
      // Clear from localStorage for unauthenticated users
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const isInCart = (productId: string) => {
    return items.some((item) => item.product.id === productId);
  };

  const syncCart = async () => {
    if (!isAuthenticated) return;

    try {
      // Get current localStorage items
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const localItems = JSON.parse(saved);
        if (localItems.length > 0) {
          // Sync with backend
          await api.post('/cart/sync', localItems.map((item: CartItem) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })));
          // Reload from backend
          await loadCart();
        }
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isInCart,
        loading,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
