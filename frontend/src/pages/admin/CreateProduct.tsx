import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FormInput } from '../../components/admin/FormInput';
import { FormTextarea } from '../../components/admin/FormTextarea';
import { FormSelect } from '../../components/admin/FormSelect';
import { MultipleImageUpload } from '../../components/admin/MultipleImageUpload';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { generateSlug } from '../../utils/slug';
import { ArrowLeft } from 'lucide-react';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  compare_at_price: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  brand_id: z.string().optional(),
  stock_quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: 'Stock quantity must be a non-negative number',
  }),
  low_stock_threshold: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: 'Low stock threshold must be a non-negative number',
  }),
  status: z.enum(['draft', 'active', 'inactive', 'out_of_stock', 'discontinued']),
  is_featured: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function CreateProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [productImages, setProductImages] = useState<Array<{ id: string; url: string; isPrimary?: boolean; altText?: string }>>([]);
  const { ToastContainer, success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'draft',
      is_featured: false,
      stock_quantity: '0',
      low_stock_threshold: '10',
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    fetchCategories();
    fetchBrands();
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

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands', { params: { page: 1, page_size: 100 } });
      setBrands(response.data.items || []);
    } catch (err) {
      console.error('Failed to load brands');
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        compare_at_price: data.compare_at_price ? parseFloat(data.compare_at_price) : null,
        stock_quantity: parseInt(data.stock_quantity),
        low_stock_threshold: parseInt(data.low_stock_threshold),
        brand_id: data.brand_id || null,
      };

      const response = await api.post('/products', payload);
      const productId = response.data.id;
      success('Product created successfully');

      // Add images if any were uploaded
      if (productImages.length > 0) {
        try {
          for (const image of productImages) {
            try {
              await api.post(`/products/${productId}/images`, {
                image_url: image.url,
                is_primary: image.isPrimary || false,
                alt_text: image.altText || data.name,
              });
            } catch (imgErr: any) {
              console.error('Failed to add product image:', imgErr);
              error(`Failed to add image: ${imgErr.response?.data?.detail || imgErr.message}`);
            }
          }
        } catch (imgErr: any) {
          console.error('Failed to add product images:', imgErr);
          error(`Product created but failed to add some images: ${imgErr.response?.data?.detail || imgErr.message}`);
        }
      }

      // Navigate to products list
      navigate('/admin/products');
    } catch (err: any) {
      console.error('Failed to create product:', err);
      error(err.response?.data?.detail || 'Failed to create product');
    }
  };

  return (
    <AdminLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Create Product</h1>
            <p className="text-gray-600 mt-1">Add a new product to your catalog</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="SKU"
              {...register('sku')}
              error={errors.sku?.message}
              placeholder="Product SKU"
            />
            <FormInput
              label="Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Product name"
            />
          </div>

          <FormInput
            label="Slug"
            {...register('slug')}
            error={errors.slug?.message}
            placeholder="product-slug"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea
              label="Short Description"
              {...register('short_description')}
              error={errors.short_description?.message}
              placeholder="Brief product description"
              rows={3}
            />
            <FormTextarea
              label="Full Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Detailed product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Price"
              type="number"
              step="0.01"
              {...register('price')}
              error={errors.price?.message}
              placeholder="0.00"
            />
            <FormInput
              label="Compare At Price"
              type="number"
              step="0.01"
              {...register('compare_at_price')}
              error={errors.compare_at_price?.message}
              placeholder="Original price (optional)"
            />
            <FormInput
              label="Stock Quantity"
              type="number"
              {...register('stock_quantity')}
              error={errors.stock_quantity?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Category"
              {...register('category_id')}
              error={errors.category_id?.message}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <FormSelect
              label="Brand"
              {...register('brand_id')}
              error={errors.brand_id?.message}
              options={[{ value: '', label: 'No Brand' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Low Stock Threshold"
              type="number"
              {...register('low_stock_threshold')}
              error={errors.low_stock_threshold?.message}
            />
            <FormSelect
              label="Status"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'out_of_stock', label: 'Out of Stock' },
                { value: 'discontinued', label: 'Discontinued' },
              ]}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_featured"
              {...register('is_featured')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
              Featured Product
            </label>
          </div>

          <div className="pt-4">
            <MultipleImageUpload
              label="Product Images"
              images={productImages}
              onChange={(images) => {
                setProductImages(images);
              }}
              uploadEndpoint="/upload/product-image"
              maxSizeMB={10}
              maxImages={10}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

