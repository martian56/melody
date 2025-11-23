import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Package, Users, ShoppingBag, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface Stats {
  total_products: number;
  total_users: number;
  total_orders: number;
  revenue: number;
  low_stock: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total_products: 0,
    total_users: 0,
    total_orders: 0,
    revenue: 0,
    low_stock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, you'd have a stats endpoint
      // For now, we'll fetch counts from existing endpoints
      const [productsRes, usersRes] = await Promise.all([
        api.get('/products?page=1&page_size=1'),
        api.get('/users/admin/all?page=1&page_size=1'),
      ]);

      setStats({
        total_products: productsRes.data.total || 0,
        total_users: usersRes.data.total || 0,
        total_orders: 0, // Would come from orders endpoint
        revenue: 0, // Would come from orders endpoint
        low_stock: 0, // Would come from products endpoint with filter
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.total_products,
      icon: Package,
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
    },
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Total Orders',
      value: stats.total_orders,
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Low Stock',
      value: stats.low_stock,
      icon: AlertCircle,
      color: 'from-orange-500 to-red-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your store and track performance</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/products"
            className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
          >
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-700 font-medium">Manage Products</span>
          </Link>
          <Link
            to="/admin/categories"
            className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
          >
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-700 font-medium">Manage Categories</span>
          </Link>
          <Link
            to="/admin/users"
            className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
          >
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-700 font-medium">Manage Users</span>
          </Link>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}

