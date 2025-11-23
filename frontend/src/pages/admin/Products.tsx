import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type Product } from '../../types';
import { Plus } from 'lucide-react';

export function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { ToastContainer, success, error } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: { page: 1, page_size: 100, search },
      });
      setProducts(response.data.items);
    } catch (err) {
      error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/products/create');
  };

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/${product.id}/edit`);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      await api.delete(`/products/${selectedProduct.id}`);
      success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Name' },
    {
      key: 'price',
      header: 'Price',
      render: (product: Product) => {
        if (product.price === undefined || product.price === null) {
          return '$0.00';
        }
        const price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price);
        return `$${isNaN(price) || !isFinite(price) ? '0.00' : price.toFixed(2)}`;
      },
    },
    {
      key: 'stock_quantity',
      header: 'Stock',
      render: (product: Product) => (
        <span className={product.stock_quantity === 0 ? 'text-red-600' : 'text-green-600'}>
          {product.stock_quantity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (product: Product) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            product.status === 'active'
              ? 'bg-green-100 text-green-800'
              : product.status === 'draft'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {product.status}
        </span>
      ),
    },
    {
      key: 'is_featured',
      header: 'Featured',
      render: (product: Product) => (
        <span className={product.is_featured ? 'text-purple-600' : 'text-gray-400'}>
          {product.is_featured ? '★' : '☆'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>

        <DataTable
          data={products}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchValue={search}
          onSearchChange={setSearch}
          loading={loading}
          emptyMessage="No products found. Create your first product!"
          keyExtractor={(product) => product.id}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
}
