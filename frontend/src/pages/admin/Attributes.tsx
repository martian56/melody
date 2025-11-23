import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type Attribute } from '../../types';
import { Plus } from 'lucide-react';

export function AdminAttributes() {
  const navigate = useNavigate();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const { ToastContainer, success, error } = useToast();

  useEffect(() => {
    fetchAttributes();
  }, [search]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attributes', {
        params: { page: 1, page_size: 100, search },
      });
      setAttributes(response.data.items);
    } catch (err) {
      error('Failed to load attributes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/attributes/create');
  };

  const handleEdit = (attribute: Attribute) => {
    navigate(`/admin/attributes/${attribute.id}/edit`);
  };

  const handleDelete = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsDeleteDialogOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!selectedAttribute) return;

    try {
      await api.delete(`/attributes/${selectedAttribute.id}`);
      success('Attribute deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedAttribute(null);
      fetchAttributes();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete attribute');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    {
      key: 'attribute_type',
      header: 'Type',
      render: (attribute: Attribute) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {attribute.attribute_type}
        </span>
      ),
    },
    {
      key: 'is_filterable',
      header: 'Filterable',
      render: (attribute: Attribute) => (
        <span className={attribute.is_filterable ? 'text-green-600' : 'text-gray-400'}>
          {attribute.is_filterable ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (attribute: Attribute) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            attribute.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {attribute.is_active ? 'Active' : 'Inactive'}
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
            <h1 className="text-3xl font-bold text-gray-800">Attributes</h1>
            <p className="text-gray-600 mt-1">Manage product attributes (Skin Type, Hair Type, etc.)</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Attribute</span>
          </button>
        </div>

        <DataTable
          data={attributes}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchValue={search}
          onSearchChange={setSearch}
          loading={loading}
          emptyMessage="No attributes found. Create your first attribute!"
          keyExtractor={(attribute) => attribute.id}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedAttribute(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Delete Attribute"
        message={`Are you sure you want to delete "${selectedAttribute?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
}
