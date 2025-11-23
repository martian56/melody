import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Star, Package, Truck, Shield, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { type Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

// Helper function to format price safely
const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) || !isFinite(numPrice) ? '0.00' : numPrice.toFixed(2);
};

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<Array<{ id: string; image_url: string; is_primary: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [_loadingImages, setLoadingImages] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/products/slug/${slug}`);
      setProduct(response.data);
      
      // Fetch all product images
      if (response.data.id) {
        await fetchProductImages(response.data.id);
        fetchRelatedProducts(response.data.id);
      }
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      setError(err.response?.data?.detail || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async (productId: string) => {
    try {
      setLoadingImages(true);
      const response = await api.get(`/products/${productId}/images`, {
        params: { page: 1, page_size: 100 }
      });
      const images = response.data.items || [];
      setProductImages(images);
      
      // Set primary image or first image as selected
      const primaryImage = images.find((img: any) => img.is_primary) || images[0];
      if (primaryImage) {
        setSelectedImage(primaryImage.image_url);
      } else if (product?.image_url) {
        setSelectedImage(product.image_url);
      }
    } catch (err) {
      console.error('Failed to fetch product images:', err);
      // Fallback to product.image_url if available
      if (product?.image_url) {
        setSelectedImage(product.image_url);
      }
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchRelatedProducts = async (productId: string) => {
    try {
      setLoadingRelated(true);
      const response = await api.get(`/products/${productId}/related`, {
        params: { limit: 8 }
      });
      setRelatedProducts(response.data.items || []);
    } catch (err) {
      console.error('Failed to fetch related products:', err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Show success message (you can add a toast notification here)
      alert(`Added ${quantity} ${product.name} to cart!`);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(quantity + delta, product?.stock_quantity || 1));
    setQuantity(newQuantity);
  };

  const getImageUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl overflow-hidden">
                {selectedImage ? (
                  <img
                    src={getImageUrl(selectedImage)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-pink-300" />
                  </div>
                )}
                {product.is_featured && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm px-3 py-1 rounded-full">
                    Featured
                  </div>
                )}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discount}%
                  </div>
                )}
              </div>
              
              {/* Additional images gallery */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === img.image_url
                          ? 'border-pink-500 ring-2 ring-pink-200'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {img.is_primary && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded z-10">
                          Primary
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
                <p className="text-gray-600 text-lg">{product.short_description}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-bold text-pink-600">
                  ${formatPrice(product.price)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-2xl text-gray-400 line-through">
                    ${formatPrice(product.compare_at_price)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div>
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Package className="w-5 h-5" />
                    <span className="font-medium">
                      {product.stock_quantity} in stock
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <Package className="w-5 h-5" />
                    <span className="font-medium">Out of stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">Quantity:</label>
                <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isInCart(product.id) ? 'Update Cart' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`px-6 py-4 rounded-lg border-2 transition-all ${
                    isInWishlist(product.id)
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-300 hover:border-pink-300 text-gray-700'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`}
                  />
                </button>
                <button className="px-6 py-4 rounded-lg border-2 border-gray-300 hover:border-pink-300 text-gray-700 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Truck className="w-6 h-6 text-pink-500" />
                  <div>
                    <p className="font-medium text-gray-800">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-pink-500" />
                  <div>
                    <p className="font-medium text-gray-800">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% secure</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-6 h-6 text-pink-500" />
                  <div>
                    <p className="font-medium text-gray-800">Quality Guarantee</p>
                    <p className="text-sm text-gray-600">Premium products</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="border-t border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
              <div
                className="prose max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Additional Info */}
          <div className="border-t border-gray-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">SKU</h3>
              <p className="text-gray-600">{product.sku}</p>
            </div>
            {product.weight && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Weight</h3>
                <p className="text-gray-600">{product.weight} kg</p>
              </div>
            )}
            {product.dimensions && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Dimensions</h3>
                <p className="text-gray-600">{product.dimensions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">You May Also Like</h2>
            {loadingRelated ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    to={`/products/${relatedProduct.slug}`}
                    className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden group"
                  >
                    <div className="relative h-64 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                      {relatedProduct.is_featured && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full z-10">
                          Featured
                        </div>
                      )}
                      {relatedProduct.image_url ? (
                        <img
                          src={getImageUrl(relatedProduct.image_url)}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-pink-300 group-hover:text-pink-400 transition-colors" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {relatedProduct.name}
                      </h3>
                      {relatedProduct.short_description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {relatedProduct.short_description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xl font-bold text-pink-600">
                            ${formatPrice(relatedProduct.price)}
                          </span>
                          {relatedProduct.compare_at_price && relatedProduct.compare_at_price > relatedProduct.price && (
                            <span className="text-sm text-gray-400 line-through">
                              ${formatPrice(relatedProduct.compare_at_price)}
                            </span>
                          )}
                        </div>
                      </div>
                      {relatedProduct.stock_quantity === 0 && (
                        <p className="text-xs text-red-600 mt-2">Out of stock</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

