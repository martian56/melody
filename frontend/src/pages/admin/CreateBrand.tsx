import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FormInput } from '../../components/admin/FormInput';
import { FormTextarea } from '../../components/admin/FormTextarea';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { generateSlug } from '../../utils/slug';
import { ArrowLeft } from 'lucide-react';

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type BrandFormData = z.infer<typeof brandSchema>;

export function CreateBrand() {
  const navigate = useNavigate();
  const { ToastContainer, success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      logo_url: '',
      website_url: '',
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (nameValue) {
      const slug = generateSlug(nameValue);
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  const onSubmit = async (data: BrandFormData) => {
    try {
      const payload = {
        ...data,
        logo_url: data.logo_url || null,
        website_url: data.website_url || null,
      };

      await api.post('/brands', payload);
      success('Brand created successfully');
      navigate('/admin/brands');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create brand');
    }
  };

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/brands')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Create Brand</h1>
            <p className="text-gray-600 mt-1">Add a new product brand</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Brand Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Brand name"
            />
            <FormInput
              label="Slug"
              {...register('slug')}
              error={errors.slug?.message}
              placeholder="brand-slug"
            />
          </div>

          <FormTextarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Brand description"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUpload
              label="Brand Logo"
              value={watch('logo_url')}
              onChange={(url) => {
                setValue('logo_url', url, { shouldValidate: true, shouldDirty: true });
              }}
              uploadEndpoint="/upload/brand-logo"
            />
            <input type="hidden" {...register('logo_url')} />
            <FormInput
              label="Website URL"
              type="url"
              {...register('website_url')}
              error={errors.website_url?.message}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/brands')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

