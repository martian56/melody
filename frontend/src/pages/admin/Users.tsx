import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type User } from '../../types';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { ToastContainer, success, error } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/admin/all', {
        params: { page: 1, page_size: 100 },
      });
      setUsers(response.data.items);
    } catch (err) {
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = (user: User) => {
    setSelectedUser(user);
    setIsActivateDialogOpen(true);
  };

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setIsDeactivateDialogOpen(true);
  };

  const onActivateConfirm = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/users/admin/${selectedUser.id}/activate`);
      success('User activated successfully');
      setIsActivateDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to activate user');
    }
  };

  const onDeactivateConfirm = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/users/admin/${selectedUser.id}/deactivate`);
      success('User deactivated successfully');
      setIsDeactivateDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.email} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
              {user.first_name?.[0] || user.email[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{user.email}</p>
            {user.first_name && (
              <p className="text-sm text-gray-500">
                {user.first_name} {user.last_name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'is_verified',
      header: 'Verified',
      render: (user: User) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {user.is_verified ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user: User) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts</p>
        </div>

        <DataTable
          data={users}
          columns={columns}
          searchValue={search}
          onSearchChange={setSearch}
          loading={loading}
          emptyMessage="No users found"
          keyExtractor={(user) => user.id}
          onEdit={(user) => {
            if (user.is_active) {
              handleDeactivate(user);
            } else {
              handleActivate(user);
            }
          }}
        />
      </div>

      {/* Activate Confirmation */}
      <ConfirmDialog
        isOpen={isActivateDialogOpen}
        onClose={() => {
          setIsActivateDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={onActivateConfirm}
        title="Activate User"
        message={`Are you sure you want to activate "${selectedUser?.email}"?`}
        confirmText="Activate"
        variant="info"
      />

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => {
          setIsDeactivateDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={onDeactivateConfirm}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${selectedUser?.email}"? They will not be able to access the system.`}
        confirmText="Deactivate"
        variant="warning"
      />
    </AdminLayout>
  );
}

