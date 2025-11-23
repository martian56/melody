import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type Tag } from '../../types';
import { Plus } from 'lucide-react';

export function AdminTags() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { ToastContainer, success, error } = useToast();

  useEffect(() => {
    fetchTags();
  }, [search]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tags', {
        params: { page: 1, page_size: 100, search },
      });
      setTags(response.data.items);
    } catch (err) {
      error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/tags/create');
  };

  const handleEdit = (tag: Tag) => {
    navigate(`/admin/tags/${tag.id}/edit`);
  };

  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!selectedTag) return;

    try {
      await api.delete(`/tags/${selectedTag.id}`);
      success('Tag deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
      fetchTags();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete tag');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (tag: Tag) => (
        <div className="flex items-center space-x-2">
          {tag.color && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
          )}
          <span>{tag.name}</span>
        </div>
      ),
    },
    { key: 'slug', header: 'Slug' },
    {
      key: 'is_active',
      header: 'Status',
      render: (tag: Tag) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            tag.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {tag.is_active ? 'Active' : 'Inactive'}
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
            <h1 className="text-3xl font-bold text-gray-800">Tags</h1>
            <p className="text-gray-600 mt-1">Manage product tags</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Tag</span>
          </button>
        </div>

        <DataTable
          data={tags}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchValue={search}
          onSearchChange={setSearch}
          loading={loading}
          emptyMessage="No tags found. Create your first tag!"
          keyExtractor={(tag) => tag.id}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedTag(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Delete Tag"
        message={`Are you sure you want to delete "${selectedTag?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
}
