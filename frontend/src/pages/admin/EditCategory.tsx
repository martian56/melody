import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FormInput } from '../../components/admin/FormInput';
import { FormTextarea } from '../../components/admin/FormTextarea';
import { FormSelect } from '../../components/admin/FormSelect';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type Category } from '../../types';
import { ArrowLeft } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  image_url: z.string().optional(),
  icon_url: z.string().optional(),
  sort_order: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Sort order must be a number',
  }),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function EditCategory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { ToastContainer, success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      sort_order: '0',
    },
  });

  useEffect(() => {
    if (id) {
      fetchCategory();
      fetchCategories();
    }
  }, [id]);

  // Update form when category is loaded
  useEffect(() => {
    if (category && categories.length > 0) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent_id: category.parent_id || '',
        image_url: category.image_url || '',
        icon_url: category.icon_url || '',
        sort_order: category.sort_order.toString(),
      });
    }
  }, [category, categories, reset]);

  const fetchCategory = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/categories/${id}`);
      setCategory(response.data);
    } catch (err: any) {
      console.error('Failed to fetch category:', err);
      error(err.response?.data?.detail || 'Failed to load category');
      navigate('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories', { params: { page: 1, page_size: 100 } });
      setCategories(response.data.items || []);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!category) return;
    
    try {
      const payload = {
        ...data,
        parent_id: data.parent_id || null,
        sort_order: parseInt(data.sort_order),
        // Ensure image_url and icon_url are included even if empty strings
        image_url: data.image_url || null,
        icon_url: data.icon_url || null,
      };

      console.log('Submitting category update:', {
        categoryId: category.id,
        payload,
        formData: data,
        image_url_value: watch('image_url'),
        icon_url_value: watch('icon_url'),
      });

      await api.put(`/categories/${category.id}`, payload);
      success('Category updated successfully');
      navigate('/admin/categories');
    } catch (err: any) {
      console.error('Category update error:', err);
      console.error('Error response:', err.response?.data);
      error(err.response?.data?.detail || 'Failed to update category');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!category) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Category not found</p>
          <button
            onClick={() => navigate('/admin/categories')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Back to Categories
          </button>
        </div>
      </AdminLayout>
    );
  }

  const parentOptions = categories
    .filter((c) => c.id !== category.id)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/categories')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Edit Category</h1>
            <p className="text-gray-600 mt-1">Update category information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Category name"
            />
            <FormInput
              label="Slug"
              {...register('slug')}
              error={errors.slug?.message}
              placeholder="category-slug"
            />
          </div>

          <FormTextarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Category description"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Parent Category"
              {...register('parent_id')}
              error={errors.parent_id?.message}
              options={[{ value: '', label: 'None (Root Category)' }, ...parentOptions]}
            />
            <FormInput
              label="Sort Order"
              type="number"
              {...register('sort_order')}
              error={errors.sort_order?.message}
              helperText="Lower numbers appear first"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUpload
              label="Category Image"
              value={watch('image_url')}
              onChange={(url) => {
                console.log('ImageUpload onChange called with URL:', url);
                setValue('image_url', url, { shouldDirty: true, shouldValidate: false });
                // Verify the value was set
                setTimeout(() => {
                  console.log('Form image_url after setValue:', watch('image_url'));
                }, 100);
              }}
              uploadEndpoint="/upload/category-image"
            />
            <ImageUpload
              label="Category Icon"
              value={watch('icon_url')}
              onChange={(url) => {
                console.log('IconUpload onChange called with URL:', url);
                setValue('icon_url', url, { shouldDirty: true, shouldValidate: false });
                // Verify the value was set
                setTimeout(() => {
                  console.log('Form icon_url after setValue:', watch('icon_url'));
                }, 100);
              }}
              uploadEndpoint="/upload/category-image"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

