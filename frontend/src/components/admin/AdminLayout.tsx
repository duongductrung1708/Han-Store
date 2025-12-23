import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { clearCart } from "../../features/cart/cartSlice";
import {
  HomeIcon,
  Squares2X2Icon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      dispatch(clearCart());
      navigate("/");
    } catch (error) {
      dispatch(clearCart());
      navigate("/");
    }
  };

  const menuItems = [
    { path: "/admin", icon: Squares2X2Icon, label: "Tổng quan" },
    { path: "/admin/products", icon: CubeIcon, label: "Sản phẩm" },
    { path: "/admin/orders", icon: ShoppingBagIcon, label: "Đơn hàng" },
    { path: "/admin/users", icon: UsersIcon, label: "Người dùng" },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="rounded bg-black px-2 py-1 text-sm font-semibold text-white">
                HAN
              </span>
              <span className="text-lg font-semibold">Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-black text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Link
              to="/"
              className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100"
            >
              <HomeIcon className="h-5 w-5" />
              Về trang chủ
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-700 hover:text-slate-900"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-600">
            Quản trị hệ thống
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

