import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Categories } from './pages/Categories';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderDetail } from './pages/OrderDetail';
import { MyOrders } from './pages/MyOrders';
import { Wishlist } from './pages/Wishlist';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OAuthCallback } from './pages/OAuthCallback';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { CreateProduct } from './pages/admin/CreateProduct';
import { EditProduct } from './pages/admin/EditProduct';
import { AdminCategories } from './pages/admin/Categories';
import { CreateCategory } from './pages/admin/CreateCategory';
import { EditCategory } from './pages/admin/EditCategory';
import { AdminBrands } from './pages/admin/Brands';
import { CreateBrand } from './pages/admin/CreateBrand';
import { EditBrand } from './pages/admin/EditBrand';
import { AdminTags } from './pages/admin/Tags';
import { CreateTag } from './pages/admin/CreateTag';
import { EditTag } from './pages/admin/EditTag';
import { AdminAttributes } from './pages/admin/Attributes';
import { CreateAttribute } from './pages/admin/CreateAttribute';
import { EditAttribute } from './pages/admin/EditAttribute';
import { AdminUsers } from './pages/admin/Users';
import { AdminOrders } from './pages/admin/Orders';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route
                  path="/"
                  element={
                    <Layout>
                      <Home />
                    </Layout>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <Layout>
                      <Products />
                    </Layout>
                  }
                />
                <Route
                  path="/products/:slug"
                  element={
                    <Layout>
                      <ProductDetail />
                    </Layout>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <Layout>
                      <Cart />
                    </Layout>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <Layout>
                      <Checkout />
                    </Layout>
                  }
                />
                <Route
                  path="/orders/:orderId"
                  element={
                    <Layout>
                      <OrderDetail />
                    </Layout>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <Layout>
                      <MyOrders />
                    </Layout>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <Layout>
                      <Wishlist />
                    </Layout>
                  }
                />
            <Route
              path="/categories"
              element={
                <Layout>
                  <Categories />
                </Layout>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute adminOnly>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/create"
              element={
                <ProtectedRoute adminOnly>
                  <CreateProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <EditProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/create"
              element={
                <ProtectedRoute adminOnly>
                  <CreateCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <EditCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/brands"
              element={
                <ProtectedRoute adminOnly>
                  <AdminBrands />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/brands/create"
              element={
                <ProtectedRoute adminOnly>
                  <CreateBrand />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/brands/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <EditBrand />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tags"
              element={
                <ProtectedRoute adminOnly>
                  <AdminTags />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tags/create"
              element={
                <ProtectedRoute adminOnly>
                  <CreateTag />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tags/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <EditTag />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attributes"
              element={
                <ProtectedRoute adminOnly>
                  <AdminAttributes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attributes/create"
              element={
                <ProtectedRoute adminOnly>
                  <CreateAttribute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attributes/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <EditAttribute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute adminOnly>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
