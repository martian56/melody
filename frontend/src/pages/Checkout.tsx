import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { ShoppingCart, MapPin, Phone, Mail, User, CreditCard, ArrowLeft } from 'lucide-react';

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

interface CheckoutFormData {
  customer_email: string;
  customer_phone: string;
  customer_first_name: string;
  customer_last_name: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_postal_code: string;
  notes: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart, syncCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_email: user?.email || '',
    customer_phone: '',
    customer_first_name: user?.first_name || '',
    customer_last_name: user?.last_name || '',
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_postal_code: '',
    notes: '',
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add items to your cart before checkout!</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Browse Products</span>
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.customer_email || !formData.customer_email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.customer_phone || formData.customer_phone.trim().length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!formData.delivery_address || formData.delivery_address.trim().length < 5) {
      setError('Please enter a valid delivery address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const subtotal = getTotalPrice();
      const tax = subtotal * 0.1; // 10% tax
      const shipping = 0; // Free shipping

      let orderData;

      if (isAuthenticated) {
        // Sync cart to backend first to ensure all items are saved
        await syncCart();
        
        // For authenticated users, create order from cart
        orderData = {
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          customer_first_name: formData.customer_first_name || undefined,
          customer_last_name: formData.customer_last_name || undefined,
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city || undefined,
          delivery_state: formData.delivery_state || undefined,
          delivery_postal_code: formData.delivery_postal_code || undefined,
          delivery_country: 'Azerbaijan', // Default to Azerbaijan
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          shipping: shipping.toString(),
          discount: '0.00',
          notes: formData.notes || undefined,
        };

        const orderResponse = await api.post('/orders/from-cart', orderData);
        const order = orderResponse.data;

        // Process mock payment
        await api.post(`/orders/${order.id}/payment?payment_method=mock`);

        // Clear cart
        clearCart();

        // Navigate to success page or order confirmation
        navigate(`/orders/${order.id}`, {
          state: { orderCreated: true, orderNumber: order.order_number },
        });
      } else {
        // For unauthenticated users, create order with items
        orderData = {
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          customer_first_name: formData.customer_first_name || undefined,
          customer_last_name: formData.customer_last_name || undefined,
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city || undefined,
          delivery_state: formData.delivery_state || undefined,
          delivery_postal_code: formData.delivery_postal_code || undefined,
          delivery_country: 'Azerbaijan', // Default to Azerbaijan
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price.toString(),
          })),
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          shipping: shipping.toString(),
          discount: '0.00',
          notes: formData.notes || undefined,
        };

        const orderResponse = await api.post('/orders', orderData);
        const order = orderResponse.data;

        // Process mock payment
        await api.post(`/orders/${order.id}/payment?payment_method=mock`);

        // Clear cart
        clearCart();

        // Navigate to success page or order confirmation
        navigate(`/orders/${order.id}`, {
          state: { orderCreated: true, orderNumber: order.order_number },
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(
        err.response?.data?.detail || err.message || 'Failed to process order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1;
  const shipping = 0;
  const total = subtotal + tax + shipping;

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/cart')}
          className="text-gray-600 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-4xl font-bold text-gray-800">Checkout</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <User className="w-6 h-6" />
              <span>Customer Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="customer_first_name"
                  value={formData.customer_first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="customer_last_name"
                  value={formData.customer_last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <MapPin className="w-6 h-6" />
              <span>Delivery Address</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="delivery_city"
                    value={formData.delivery_city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    name="delivery_state"
                    value={formData.delivery_state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="delivery_postal_code"
                    value={formData.delivery_postal_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Any special instructions for your order..."
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg overflow-hidden">
                    {item.product.image_url ? (
                      <img
                        src={getImageUrl(item.product.image_url)}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-pink-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold text-pink-600">
                      ${formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3 border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span>${formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">Payment Method</span>
              </div>
              <p className="text-sm text-gray-600">
                Mock payment will be processed. No actual charge will be made.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-medium text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

