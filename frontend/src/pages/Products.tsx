import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { type Product } from '../types';
import { ShoppingBag } from 'lucide-react';

// Helper function to format price safely
const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) || !isFinite(numPrice) ? '0.00' : numPrice.toFixed(2);
};

export function Products() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  // Get filters from URL
  const urlParams = new URLSearchParams(location.search);
  const categorySlug = urlParams.get('category');
  const searchQuery = urlParams.get('search') || '';
  const isFeatured = urlParams.get('is_featured') === 'true';
  const brandId = urlParams.get('brand_id');

  // Initialize search state from URL
  const [search, setSearch] = useState(searchQuery);

  // Update search when URL changes
  useEffect(() => {
    setSearch(searchQuery);
    setPage(1); // Reset to first page when search changes
  }, [searchQuery]);

  useEffect(() => {
    if (categorySlug) {
      api.get(`/categories/slug/${categorySlug}`)
        .then((response) => {
          setCategoryName(response.data?.name || null);
        })
        .catch(() => {
          setCategoryName(null);
        });
    } else {
      setCategoryName(null);
    }
  }, [categorySlug]);

  useEffect(() => {
    fetchProducts();
  }, [page, search, location.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '12',
      });
      if (search) params.append('search', search);
      if (isFeatured) params.append('is_featured', 'true');
      if (brandId) params.append('brand_id', brandId);
      if (categorySlug) {
        // Try to get category ID from slug
        try {
          const categoryResponse = await api.get(`/categories/slug/${categorySlug}`);
          if (categoryResponse.data?.id) {
            params.append('category_id', categoryResponse.data.id);
          }
        } catch (err) {
          // Category not found, continue without filter
        }
      }
      
      // Get category filter from URL (using already declared categorySlug)
      if (categorySlug) {
        // First, get category by slug to get its ID
        try {
          const categoryResponse = await api.get(`/categories/slug/${categorySlug}`);
          if (categoryResponse.data?.id) {
            params.append('category_id', categoryResponse.data.id);
          }
        } catch (err) {
          console.error('Failed to fetch category:', err);
        }
      }
      
      // Only show active products
      params.append('is_active', 'true');
      
      const response = await api.get(`/products?${params}`);
      setProducts(response.data.items);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {categoryName ? categoryName : 'Our Products'}
        </h1>
        <p className="text-gray-600">
          {categoryName 
            ? `Products in ${categoryName} category`
            : 'Discover our curated collection of beauty products'}
        </p>
        {categoryName && (
          <Link
            to="/products"
            className="inline-flex items-center space-x-1 text-pink-600 hover:text-pink-700 mt-2 text-sm font-medium"
          >
            <span>← Clear filter</span>
          </Link>
        )}
      </div>

      {/* Active Filters */}
      {(searchQuery || isFeatured || categoryName) && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-pink-100 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                Search: {searchQuery}
              </span>
            )}
            {isFeatured && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                Featured Products
              </span>
            )}
            {categoryName && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                Category: {categoryName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm animate-pulse">
              <div className="h-64 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="relative h-64 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                {product.is_featured && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full z-10">
                    Featured
                  </div>
                )}
                {product.image_url ? (
                  <img
                    src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:8000${product.image_url}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.placeholder-icon')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'placeholder-icon w-full h-full flex items-center justify-center';
                        placeholder.innerHTML = '<svg class="w-16 h-16 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-pink-300 group-hover:text-pink-400 transition-colors" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.short_description}</p>
                <div className="flex items-center justify-between">
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
                  {product.stock_quantity > 0 ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

