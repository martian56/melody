import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import {
  CheckCircle,
  Package,
  MapPin,
  Mail,
  Calendar,
  ArrowLeft,
  Clock,
  DollarSign,
  Truck,
  XCircle,
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  customer_email: string;
  customer_phone: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  delivery_address: string;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_postal_code: string | null;
  delivery_country: string | null;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) || !isFinite(numPrice) ? '0.00' : numPrice.toFixed(2);
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'paid':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'processing':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'refunded':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return Clock;
    case 'paid':
      return DollarSign;
    case 'processing':
      return Package;
    case 'shipped':
      return Truck;
    case 'delivered':
      return CheckCircle;
    case 'cancelled':
      return XCircle;
    default:
      return Clock;
  }
};

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8000${url}`;
};

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [_orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.orderCreated) {
      setOrderCreated(true);
      setOrderNumber(location.state.orderNumber);
    }
  }, [location]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.response?.data?.detail || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Products</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {orderCreated && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-green-800">Order Placed Successfully!</h2>
              <p className="text-green-700 mt-1">
                Your order #{order.order_number} has been confirmed. You will receive an email confirmation shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="text-gray-600 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-4xl font-bold text-gray-800">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg overflow-hidden">
                    {item.product_image_url ? (
                      <img
                        src={getImageUrl(item.product_image_url)}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-pink-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{item.product_name}</h3>
                    {item.product_sku && (
                      <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                      <span className="text-sm text-gray-600">
                        Unit Price: ${formatPrice(item.unit_price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-pink-600">
                      ${formatPrice(item.total_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <MapPin className="w-6 h-6" />
              <span>Delivery Information</span>
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Address:</span> {order.delivery_address}
              </p>
              {(order.delivery_city || order.delivery_state || order.delivery_postal_code) && (
                <p className="text-gray-700">
                  {[order.delivery_city, order.delivery_state, order.delivery_postal_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {order.delivery_country && (
                <p className="text-gray-700">
                  <span className="font-semibold">Country:</span> {order.delivery_country}
                </p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <Mail className="w-6 h-6" />
              <span>Customer Information</span>
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Email:</span> {order.customer_email}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Phone:</span> {order.customer_phone}
              </p>
              {(order.customer_first_name || order.customer_last_name) && (
                <p className="text-gray-700">
                  <span className="font-semibold">Name:</span>{' '}
                  {[order.customer_first_name, order.customer_last_name].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <Package className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Order Number</p>
                  <p className="text-sm">{order.order_number}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Order Date</p>
                  <p className="text-sm">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {(() => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </>
                      );
                    })()}
                  </span>
                </div>
              </div>

              {order.payment_status && (
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="font-semibold text-gray-800">Payment Status</p>
                    <p className="text-sm text-green-600 font-medium capitalize">
                      {order.payment_status}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>${formatPrice(order.shipping)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span>${formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">Order Notes</p>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

