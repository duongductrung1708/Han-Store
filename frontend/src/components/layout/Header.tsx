import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBagIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Đóng mobile menu khi click vào link
  const handleMobileLinkClick = () => {
    setShowMobileMenu(false);
  };

  // Ngăn scroll body khi mobile menu mở
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMobileMenu]);

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
    <>
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

          {/* Desktop Navigation */}
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
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="mobile-menu-button md:hidden inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:bg-slate-100 active:scale-95"
              aria-label="Toggle menu"
              type="button"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-6 w-6 transition-all duration-300 rotate-0 hover:rotate-90" />
              ) : (
                <Bars3Icon className="h-6 w-6 transition-all duration-300 hover:rotate-90" />
              )}
            </button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
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

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-3">
              <Link
                to="/cart"
                className="relative inline-flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
                onClick={handleMobileLinkClick}
              >
                <ShoppingBagIcon className="h-6 w-6 transition-transform duration-200" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 animate-in fade-in scale-in rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              {user ? (
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
                  onClick={handleMobileLinkClick}
                >
                  <UserCircleIcon className="h-7 w-7 transition-transform duration-200" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
                  onClick={handleMobileLinkClick}
                >
                  <UserCircleIcon className="h-7 w-7 transition-transform duration-200" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="mobile-menu-backdrop fixed inset-0 bg-black/50"
            onClick={() => setShowMobileMenu(false)}
          />
          {/* Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="mobile-menu-drawer fixed inset-y-0 left-0 w-64 bg-white shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b shadow-sm">
                <Link
                  to="/"
                  onClick={handleMobileLinkClick}
                  className="mobile-menu-logo flex items-center gap-2 transition-transform duration-300 hover:scale-105"
                >
                  <span className="rounded bg-black px-2 py-1 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800">
                    HAN
                  </span>
                  <span className="text-lg font-semibold tracking-wide">Store</span>
                </Link>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-full transition-all duration-300 hover:scale-110 hover:bg-slate-100 active:scale-95"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-6 w-6 transition-transform duration-300 hover:rotate-90" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto py-4">
                <NavLink
                  to="/"
                  onClick={handleMobileLinkClick}
                  className={({ isActive }) =>
                    `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                        : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                    }`
                  }
                >
                  Trang chủ
                </NavLink>
                <NavLink
                  to="/products"
                  onClick={handleMobileLinkClick}
                  className={({ isActive }) =>
                    `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                        : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                    }`
                  }
                >
                  Sản phẩm
                </NavLink>
                <NavLink
                  to="/blog"
                  onClick={handleMobileLinkClick}
                  className={({ isActive }) =>
                    `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                        : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                    }`
                  }
                >
                  Blog
                </NavLink>
                <NavLink
                  to="/about"
                  onClick={handleMobileLinkClick}
                  className={({ isActive }) =>
                    `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                        : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                    }`
                  }
                >
                  Giới thiệu
                </NavLink>
                {user ? (
                  <>
                    <NavLink
                      to="/orders"
                      onClick={handleMobileLinkClick}
                      className={({ isActive }) =>
                        `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                          isActive
                            ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                            : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                        }`
                      }
                    >
                      Đơn hàng
                    </NavLink>
                    <NavLink
                      to="/profile"
                      onClick={handleMobileLinkClick}
                      className={({ isActive }) =>
                        `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                          isActive
                            ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                            : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                        }`
                      }
                    >
                      Tài khoản
                    </NavLink>
                    {user.role === "admin" || user.role === "staff" ? (
                      <NavLink
                        to="/admin"
                        onClick={handleMobileLinkClick}
                        className={({ isActive }) =>
                          `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                            isActive
                              ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                              : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                          }`
                        }
                      >
                        Quản trị
                      </NavLink>
                    ) : null}
                    <div className="border-t my-2 mobile-menu-item" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="mobile-menu-item w-full flex items-center gap-2 px-4 py-3 text-base font-medium text-red-600 transition-all duration-300 hover:bg-red-50 hover:translate-x-1 active:scale-95"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <NavLink
                    to="/auth"
                    onClick={handleMobileLinkClick}
                    className={({ isActive }) =>
                      `mobile-menu-item block px-4 py-3 text-base font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-accent/10 text-accent border-l-4 border-accent transform translate-x-1"
                          : "text-slate-700 hover:bg-slate-50 hover:translate-x-1"
                      }`
                    }
                  >
                    Đăng nhập
                  </NavLink>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;


