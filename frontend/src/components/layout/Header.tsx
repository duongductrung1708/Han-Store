import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBagIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { clearCart } from "../../features/cart/cartSlice";
import { useToast } from "../../contexts/ToastContext";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const { showSuccess } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      dispatch(clearCart());
      showSuccess("Đăng xuất thành công");
      navigate("/");
      setShowUserMenu(false);
    } catch (error) {
      // Logout vẫn clear local state ngay cả khi API fail
      dispatch(clearCart());
      navigate("/");
      setShowUserMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur transition-all duration-300">
      <div className="container-page flex items-center justify-between py-3">
        <Link
          to="/"
          className="flex items-center gap-2 transition-transform duration-200 hover:scale-105"
        >
          <span className="rounded bg-black px-2 py-1 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800">
            HAN
          </span>
          <span className="text-lg font-semibold tracking-wide transition-colors duration-200">
            Store
          </span>
        </Link>

        <nav className="hidden gap-4 text-sm md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `transition-all duration-200 hover:text-accent hover:scale-105 ${
                isActive ? "font-semibold text-accent" : ""
              }`
            }
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `transition-all duration-200 hover:text-accent hover:scale-105 ${
                isActive ? "font-semibold text-accent" : ""
              }`
            }
          >
            Sản phẩm
          </NavLink>
          <NavLink
            to="/blog"
            className={({ isActive }) =>
              `transition-all duration-200 hover:text-accent hover:scale-105 ${
                isActive ? "font-semibold text-accent" : ""
              }`
            }
          >
            Blog
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `transition-all duration-200 hover:text-accent hover:scale-105 ${
                isActive ? "font-semibold text-accent" : ""
              }`
            }
          >
            Giới thiệu
          </NavLink>
          {user ? (
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `transition-all duration-200 hover:text-accent hover:scale-105 ${
                  isActive ? "font-semibold text-accent" : ""
                }`
              }
            >
              Đơn hàng
            </NavLink>
          ) : null}
          {user?.role === "admin" || user?.role === "staff" ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `transition-all duration-200 hover:text-accent hover:scale-105 ${
                  isActive ? "font-semibold text-accent" : ""
                }`
              }
            >
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <ShoppingBagIcon className="h-6 w-6 transition-transform duration-200" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 animate-in fade-in scale-in rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            <div className="relative inline-flex items-center" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="inline-flex items-center justify-center p-0 transition-transform duration-200 hover:scale-110 active:scale-95"
                aria-label="User menu"
                type="button"
              >
                <UserCircleIcon className="h-7 w-7 transition-transform duration-200" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm font-medium text-slate-700 border-b">
                      {user.name}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors duration-200"
                    >
                      Tài khoản
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors duration-200"
                    >
                      Đơn hàng
                    </Link>
                    {user.role === "admin" || user.role === "staff" ? (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors duration-200"
                      >
                        Quản trị
                      </Link>
                    ) : null}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors duration-200 mt-1"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
            >
              <UserCircleIcon className="h-7 w-7 transition-transform duration-200" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;


