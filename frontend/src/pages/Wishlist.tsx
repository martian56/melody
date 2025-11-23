import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { Heart, ShoppingCart, ShoppingBag, Trash2 } from 'lucide-react';

// Helper function to format price safely
const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) || !isFinite(numPrice) ? '0.00' : numPrice.toFixed(2);
};

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8000${url}`;
};

export function Wishlist() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your wishlist is empty</h1>
          <p className="text-gray-600 mb-6">Start adding products to your wishlist!</p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-800">My Wishlist</h1>
        <button
          onClick={clearWishlist}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Clear Wishlist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <div
            key={product.id}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden group"
          >
            <Link to={`/products/${product.slug}`}>
              <div className="relative h-64 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                {product.is_featured && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full z-10">
                    Featured
                  </div>
                )}
                {product.image_url ? (
                  <img
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-pink-300" />
                  </div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <Link
                to={`/products/${product.slug}`}
                className="font-semibold text-gray-800 mb-1 line-clamp-2 hover:text-pink-600 transition-colors"
              >
                {product.name}
              </Link>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.short_description}</p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl font-bold text-pink-600">
                    ${formatPrice(product.price)}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ${formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product);
                  }}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isInCart(product.id) ? 'In Cart' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(product.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

