import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type Brand } from '../../types';
import { Plus } from 'lucide-react';

export function AdminBrands() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const { ToastContainer, success, error } = useToast();

  useEffect(() => {
    fetchBrands();
  }, [search]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brands', {
        params: { page: 1, page_size: 100, search },
      });
      setBrands(response.data.items);
    } catch (err) {
      error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/brands/create');
  };

  const handleEdit = (brand: Brand) => {
    navigate(`/admin/brands/${brand.id}/edit`);
  };

  const handleDelete = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteDialogOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!selectedBrand) return;

    try {
      await api.delete(`/brands/${selectedBrand.id}`);
      success('Brand deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedBrand(null);
      fetchBrands();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete brand');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    {
      key: 'is_active',
      header: 'Status',
      render: (brand: Brand) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            brand.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {brand.is_active ? 'Active' : 'Inactive'}
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
            <h1 className="text-3xl font-bold text-gray-800">Brands</h1>
            <p className="text-gray-600 mt-1">Manage product brands</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Brand</span>
          </button>
        </div>

        <DataTable
          data={brands}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchValue={search}
          onSearchChange={setSearch}
          loading={loading}
          emptyMessage="No brands found. Create your first brand!"
          keyExtractor={(brand) => brand.id}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedBrand(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Delete Brand"
        message={`Are you sure you want to delete "${selectedBrand?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
}
