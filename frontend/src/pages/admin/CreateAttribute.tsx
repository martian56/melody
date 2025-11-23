import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FormInput } from '../../components/admin/FormInput';
import { FormTextarea } from '../../components/admin/FormTextarea';
import { FormSelect } from '../../components/admin/FormSelect';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { generateSlug } from '../../utils/slug';
import { ArrowLeft } from 'lucide-react';

const attributeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  attribute_type: z.enum(['text', 'select', 'multi_select', 'boolean', 'number']),
  description: z.string().optional(),
  is_filterable: z.boolean(),
  is_required: z.boolean(),
  sort_order: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Sort order must be a number',
  }),
});

type AttributeFormData = z.infer<typeof attributeSchema>;

export function CreateAttribute() {
  const navigate = useNavigate();
  const { ToastContainer, success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      attribute_type: 'select',
      is_filterable: true,
      is_required: false,
      sort_order: '0',
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (nameValue) {
      const slug = generateSlug(nameValue);
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  const onSubmit = async (data: AttributeFormData) => {
    try {
      const payload = {
        ...data,
        sort_order: parseInt(data.sort_order),
      };

      await api.post('/attributes', payload);
      success('Attribute created successfully');
      navigate('/admin/attributes');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create attribute');
    }
  };

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/attributes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Create Attribute</h1>
            <p className="text-gray-600 mt-1">Add a new product attribute</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Attribute Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Skin Type, Hair Type"
            />
            <FormInput
              label="Slug"
              {...register('slug')}
              error={errors.slug?.message}
              placeholder="attribute-slug"
            />
          </div>

          <FormTextarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Attribute description"
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Attribute Type"
              {...register('attribute_type')}
              error={errors.attribute_type?.message}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'select', label: 'Select (Single)' },
                { value: 'multi_select', label: 'Multi-Select' },
                { value: 'boolean', label: 'Boolean' },
                { value: 'number', label: 'Number' },
              ]}
            />
            <FormInput
              label="Sort Order"
              type="number"
              {...register('sort_order')}
              error={errors.sort_order?.message}
              helperText="Lower numbers appear first"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_filterable"
                {...register('is_filterable')}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="is_filterable" className="text-sm font-medium text-gray-700">
                Filterable (users can filter products by this attribute)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_required"
                {...register('is_required')}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="is_required" className="text-sm font-medium text-gray-700">
                Required (products must have this attribute)
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/attributes')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Attribute'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

