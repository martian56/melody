import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FormInput } from '../../components/admin/FormInput';
import { FormTextarea } from '../../components/admin/FormTextarea';
import { FormSelect } from '../../components/admin/FormSelect';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { type Category } from '../../types';
import { generateSlug } from '../../utils/slug';
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

export function CreateCategory() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const { ToastContainer, success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      sort_order: '0',
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue) {
      const slug = generateSlug(nameValue);
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories', { params: { page: 1, page_size: 100 } });
      setCategories(response.data.items || []);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const payload = {
        ...data,
        parent_id: data.parent_id || null,
        sort_order: parseInt(data.sort_order),
      };

      await api.post('/categories', payload);
      success('Category created successfully');
      navigate('/admin/categories');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create category');
    }
  };

  const parentOptions = categories.map((c) => ({ value: c.id, label: c.name }));

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
            <h1 className="text-3xl font-bold text-gray-800">Create Category</h1>
            <p className="text-gray-600 mt-1">Add a new category to organize products</p>
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
              onChange={(url) => setValue('image_url', url)}
              uploadEndpoint="/upload/category-image"
            />
            <ImageUpload
              label="Category Icon"
              value={watch('icon_url')}
              onChange={(url) => setValue('icon_url', url)}
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
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

