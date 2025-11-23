import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { type Category } from '../types';
import { Package, ChevronRight } from 'lucide-react';

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8000${url}`;
};

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories?page_size=100&is_active=true');
      setCategories(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories;

  // Group categories by parent (top-level categories first)
  const topLevelCategories = filteredCategories.filter((cat) => !cat.parent_id);
  const childCategories = filteredCategories.filter((cat) => cat.parent_id);

  // Organize categories hierarchically
  const organizedCategories = topLevelCategories.map((parent) => ({
    ...parent,
    children: childCategories.filter((child) => child.parent_id === parent.id),
  }));

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Categories</h1>
          <p className="text-gray-600">Browse our product categories</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Categories</h1>
        <p className="text-gray-600">Browse our product categories</p>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No categories found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top-level categories */}
          {organizedCategories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
                <Link
                  to={`/products?category=${category.slug}`}
                  className="text-pink-600 hover:text-pink-700 flex items-center space-x-1 text-sm font-medium"
                >
                  <span>View all</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Parent category card */}
                <Link
                  to={`/products?category=${category.slug}`}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={getImageUrl(category.image_url)}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-pink-300 group-hover:text-pink-400 transition-colors" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                    )}
                  </div>
                </Link>

                {/* Child categories */}
                {category.children && category.children.length > 0 && (
                  <>
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/products?category=${child.slug}`}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                          {child.image_url ? (
                            <img
                              src={getImageUrl(child.image_url)}
                              alt={child.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-16 h-16 text-pink-300 group-hover:text-pink-400 transition-colors" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{child.name}</h3>
                          {child.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{child.description}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Categories without parent (if any) */}
          {filteredCategories.filter((cat) => !cat.parent_id && !organizedCategories.find((org) => org.id === cat.id)).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories
                .filter((cat) => !cat.parent_id && !organizedCategories.find((org) => org.id === cat.id))
                .map((category) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                      {category.image_url ? (
                        <img
                          src={getImageUrl(category.image_url)}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-pink-300 group-hover:text-pink-400 transition-colors" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

