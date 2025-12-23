import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import HomePage from "../pages/HomePage";
import ProductListPage from "../pages/ProductListPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import AuthPage from "../pages/AuthPage";
import ProfilePage from "../pages/ProfilePage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminProductFormPage from "../pages/admin/AdminProductFormPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminLayout from "../components/admin/AdminLayout";
import BlogPage from "../pages/BlogPage";
import AboutPage from "../pages/AboutPage";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  if (!user) {
    // Lưu trang hiện tại vào state để redirect về sau khi login
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  if (!user) {
    // Lưu trang hiện tại vào state để redirect về sau khi login
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== "admin" && user.role !== "staff")
    return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrderHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductsPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductFormPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/:id/edit"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductFormPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminOrdersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminUsersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;


