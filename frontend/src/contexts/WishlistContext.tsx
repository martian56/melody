import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Product } from '../types';
import { useAuth } from './AuthContext';
import api from '../lib/api';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'melody_wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist on mount and when auth state changes
  useEffect(() => {
    loadWishlist();
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    if (isAuthenticated) {
      // Load from backend
      try {
        setLoading(true);
        const response = await api.get('/wishlist');
        const wishlistProducts: Product[] = response.data.items.map((item: any) => item.product);
        setItems(wishlistProducts);
        // Also save to localStorage for offline access
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
        
        // If backend wishlist is empty, check localStorage and sync
        if (wishlistProducts.length === 0) {
          const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
          if (saved) {
            try {
              const localItems = JSON.parse(saved);
              if (localItems.length > 0) {
                // Sync localStorage to backend
                await api.post('/wishlist/sync', localItems.map((item: Product) => item.id));
                // Reload from backend
                const syncResponse = await api.get('/wishlist');
                const syncedProducts: Product[] = syncResponse.data.items.map((item: any) => item.product);
                setItems(syncedProducts);
                localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(syncedProducts));
              }
            } catch (syncError) {
              console.error('Failed to sync wishlist:', syncError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load wishlist from backend:', error);
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
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
        const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
        setItems(saved ? JSON.parse(saved) : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  };



  // Save to localStorage whenever items change (for unauthenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const addToWishlist = async (product: Product) => {
    if (isAuthenticated) {
      // Add to backend
      try {
        await api.post(`/wishlist/items/${product.id}`);
        // Reload wishlist from backend
        await loadWishlist();
      } catch (error: any) {
        // If already in wishlist (409), just reload
        if (error.response?.status === 409) {
          await loadWishlist();
        } else {
          console.error('Failed to add to wishlist:', error);
          // Fallback to local state
          setItems((prevItems) => {
            if (prevItems.some((item) => item.id === product.id)) {
              return prevItems;
            }
            return [...prevItems, product];
          });
        }
      }
    } else {
      // Add to localStorage for unauthenticated users
      setItems((prevItems) => {
        if (prevItems.some((item) => item.id === product.id)) {
          return prevItems;
        }
        return [...prevItems, product];
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (isAuthenticated) {
      // Remove from backend
      try {
        await api.delete(`/wishlist/items/${productId}`);
        // Reload wishlist from backend
        await loadWishlist();
      } catch (error) {
        console.error('Failed to remove from wishlist:', error);
        // Fallback to local state
        setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
      }
    } else {
      // Remove from localStorage for unauthenticated users
      setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    }
  };

  const clearWishlist = async () => {
    if (isAuthenticated) {
      // Clear from backend
      try {
        await api.delete('/wishlist');
        setItems([]);
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear wishlist:', error);
        setItems([]);
      }
    } else {
      // Clear from localStorage for unauthenticated users
      setItems([]);
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        toggleWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
