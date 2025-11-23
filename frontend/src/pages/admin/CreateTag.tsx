import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FormInput } from '../../components/admin/FormInput';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { generateSlug } from '../../utils/slug';
import { ArrowLeft } from 'lucide-react';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional().or(z.literal('')),
});

type TagFormData = z.infer<typeof tagSchema>;

export function CreateTag() {
  const navigate = useNavigate();
  const { ToastContainer, success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (nameValue) {
      const slug = generateSlug(nameValue);
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  const onSubmit = async (data: TagFormData) => {
    try {
      const payload = {
        ...data,
        color: data.color || null,
      };

      await api.post('/tags', payload);
      success('Tag created successfully');
      navigate('/admin/tags');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create tag');
    }
  };

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/tags')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Create Tag</h1>
            <p className="text-gray-600 mt-1">Add a new product tag</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <FormInput
            label="Tag Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., New, Bestseller, Vegan"
          />
          <FormInput
            label="Slug"
            {...register('slug')}
            error={errors.slug?.message}
            placeholder="tag-slug"
          />
          <FormInput
            label="Color (Hex)"
            {...register('color')}
            error={errors.color?.message}
            placeholder="#FF5733"
            helperText="Optional: Hex color code for UI display"
          />

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/tags')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

