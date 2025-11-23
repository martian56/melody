export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  role: 'admin' | 'user';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  category_id: string;
  brand_id?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  is_active: boolean;
  is_featured: boolean;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  weight?: number;
  dimensions?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  attribute_type: 'text' | 'select' | 'multi_select' | 'boolean' | 'number';
  description?: string;
  is_filterable: boolean;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  values?: AttributeValue[];
  created_at: string;
  updated_at: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
