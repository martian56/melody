import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Sparkles, ChevronLeft, ChevronRight, ArrowRight, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { type Product, type Brand, type Category } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8000${url}`;
};

export function Home() {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch featured products for hero slider (6 products)
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products', {
          params: { page: 1, page_size: 6, is_featured: true, is_active: true, status: 'active' }
        });
        setFeaturedProducts(response.data.items || []);
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/brands', {
          params: { page: 1, page_size: 12, is_active: true }
        });
        setBrands(response.data.items || []);
      } catch (err) {
        console.error('Failed to fetch brands:', err);
      }
    };

    fetchBrands();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories', {
          params: { page: 1, page_size: 8, is_active: true }
        });
        setCategories(response.data.items || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch new arrivals (recently created products)
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await api.get('/products', {
          params: { page: 1, page_size: 8, is_active: true, status: 'active' }
        });
        // Sort by created_at descending to get newest first
        const sorted = (response.data.items || []).sort((a: Product, b: Product) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNewArrivals(sorted.slice(0, 8));
      } catch (err) {
        console.error('Failed to fetch new arrivals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  // Auto-rotate hero slider
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const nextSlide = () => {
    setHeroIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevSlide = () => {
    setHeroIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section with Featured Products Slider */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 shadow-2xl min-h-[500px]">
        {featuredProducts.length > 0 ? (
          <>
            {/* Slider Content */}
            <div className="relative h-full min-h-[500px]">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12 items-center h-full">
                    {/* Product Info */}
                    <div className="text-white z-20">
                      <div className="flex items-center space-x-2 mb-4">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Featured Product</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        {product.name}
                      </h1>
                      <p className="text-lg md:text-xl mb-6 text-pink-100 line-clamp-2">
                        {product.short_description || product.description || 'Premium quality product'}
                      </p>
                      <div className="flex items-center space-x-4 mb-8">
                        <span className="text-3xl font-bold">${formatPrice(product.price)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-xl text-pink-200 line-through">
                            ${formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <Link
                          to={`/products/${product.slug}`}
                          className="inline-flex items-center space-x-2 bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-all transform hover:scale-105 shadow-lg"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          <span>Shop Now</span>
                        </Link>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all border border-white/30"
                        >
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>

                    {/* Product Image */}
                    <div className="relative h-96 lg:h-full flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center">
                          <ShoppingBag className="w-32 h-32 text-white/30" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Controls */}
            {featuredProducts.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Slider Indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
                  {featuredProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setHeroIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === heroIndex
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[500px] text-white p-12">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Beauty</h1>
              <p className="text-xl md:text-2xl mb-8 text-pink-100">
                Premium makeup, skincare, and haircare products curated just for you
              </p>
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-white text-pink-600 px-8 py-4 rounded-lg font-semibold hover:bg-pink-50 transition-all transform hover:scale-105 shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Shop Now</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Shop by Category</h2>
              <p className="text-gray-600">Explore our curated collections</p>
            </div>
            <Link
              to="/categories"
              className="hidden md:flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/categories?category=${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-pink-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-square relative">
                  {category.image_url ? (
                    <img
                      src={getImageUrl(category.image_url)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-pink-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg">{category.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link
              to="/categories"
              className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked favorites from our collection</p>
            </div>
            <Link
              to="/products?is_featured=true"
              className="hidden md:flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const discount = product.compare_at_price && product.compare_at_price > product.price
                ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <Link to={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-pink-300" />
                        </div>
                      )}
                      {product.is_featured && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          Featured
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{discount}%
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product);
                        }}
                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
                          isInWishlist(product.id)
                            ? 'bg-pink-500 text-white'
                            : 'bg-white/90 text-gray-600 hover:bg-pink-500 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-bold text-pink-600">
                          ${formatPrice(product.price)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ${formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">4.8</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full mx-4 mb-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link
              to="/products?is_featured=true"
              className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold"
            >
              <span>View All Featured</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-pink-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Our Brands</h2>
              <p className="text-gray-600">Trusted partners in beauty</p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {brands.slice(0, 12).map((brand) => (
              <Link
                key={brand.id}
                to={`/products?brand_id=${brand.id}`}
                className="group flex items-center justify-center p-4 bg-white/80 rounded-xl border border-pink-100 shadow-sm hover:shadow-md transition-all"
              >
                {brand.logo_url ? (
                  <img
                    src={getImageUrl(brand.logo_url)}
                    alt={brand.name}
                    className="max-w-full max-h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-pink-600 transition-colors">
                    {brand.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-pink-600" />
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">New Arrivals</h2>
                <p className="text-gray-600">Fresh products just added</p>
              </div>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold"
            >
              <span>View All</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => {
              const discount = product.compare_at_price && product.compare_at_price > product.price
                ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <Link to={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-pink-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        New
                      </div>
                      {discount > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{discount}%
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product);
                        }}
                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
                          isInWishlist(product.id)
                            ? 'bg-pink-500 text-white'
                            : 'bg-white/90 text-gray-600 hover:bg-pink-500 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-bold text-pink-600">
                          ${formatPrice(product.price)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ${formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full mx-4 mb-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
