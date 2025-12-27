import { useState, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { upsertCartItem } from "../../features/cart/cartSlice";
import type { Product } from "../../features/products/productSlice";
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../contexts/ToastContext";
import QuickViewDialog from "./QuickViewDialog";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const { showSuccess, showError } = useToast();
  const [showQuickView, setShowQuickView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const discountPercent =
    product.salePrice && product.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  // Kiểm tra sản phẩm có trong giỏ hàng không (không phân biệt size/color)
  const cartItem = items.find((item) => item.product._id === product._id);
  const quantityInCart = cartItem?.quantity || 0;

  // Kiểm tra stock
  const totalStock = product.totalStock || 0;
  const isOutOfStock = totalStock === 0;

  // Tính stock còn lại (nếu có variants thì tính tổng, nếu không thì dùng totalStock)
  const availableStock = product.variants
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : totalStock;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/auth", { state: { from: window.location.pathname } });
      return;
    }

    if (isOutOfStock || availableStock === 0) {
      showError("Sản phẩm đã hết hàng.");
      return;
    }

    try {
      await dispatch(
        upsertCartItem({
          productId: product._id,
          quantity: quantityInCart + 1,
        }),
      ).unwrap();
      showSuccess("Đã thêm vào giỏ hàng!");
    } catch (error) {
      showError("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  const handleIncreaseQty = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quantityInCart >= availableStock) {
      showError("Đã đạt số lượng tối đa có sẵn.");
      return;
    }

    try {
      await dispatch(
        upsertCartItem({
          productId: product._id,
          quantity: quantityInCart + 1,
          size: cartItem?.size,
          color: cartItem?.color,
        }),
      ).unwrap();
    } catch (error) {
      showError("Không thể cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  const handleDecreaseQty = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quantityInCart <= 1) {
      // Nếu giảm xuống 0, có thể xóa khỏi giỏ hàng hoặc giữ lại 1
      return;
    }

    try {
      await dispatch(
        upsertCartItem({
          productId: product._id,
          quantity: quantityInCart - 1,
          size: cartItem?.size,
          color: cartItem?.color,
        }),
      ).unwrap();
    } catch (error) {
      showError("Không thể cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <div
        className="group relative flex flex-col rounded-lg border bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link
          to={`/products/${product.slug || product._id}`}
          className="flex flex-col flex-1"
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-100">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {discountPercent > 0 && (
              <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                -{discountPercent}%
              </span>
            )}
            {/* Quick View Button - hiển thị khi hover */}
            <button
              onClick={handleQuickView}
              className={`absolute left-2 top-2 z-10 flex items-center justify-center rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 ${
                isHovered
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
              aria-label="Xem nhanh"
              title="Xem nhanh"
            >
              <EyeIcon className="h-5 w-5 text-slate-900 transition-transform duration-200 hover:scale-125" />
            </button>
          </div>
          <div className="flex flex-1 flex-col p-3">
            <h3 className="mb-2 line-clamp-2 text-sm font-medium text-slate-900 transition-colors duration-200 group-hover:text-accent">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              {product.salePrice ? (
                <>
                  <span className="text-base font-bold text-red-600">
                    {product.salePrice.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    {product.price.toLocaleString("vi-VN")}đ
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-900">
                  {product.price.toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>
            {product.averageRating && product.averageRating > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                <span>⭐</span>
                <span>{product.averageRating.toFixed(1)}</span>
                {product.totalReviews && (
                  <span className="text-slate-400">({product.totalReviews})</span>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* Nút thêm vào giỏ hàng / Tăng giảm số lượng */}
        <div className="border-t p-3">
          {isOutOfStock || availableStock === 0 ? (
            <button
              disabled
              className="w-full rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-500"
            >
              Hết hàng
            </button>
          ) : quantityInCart > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleDecreaseQty}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
                aria-label="Giảm số lượng"
              >
                <MinusIcon className="h-4 w-4 transition-transform duration-200" />
              </button>
              <span className="flex-1 text-center text-sm font-medium transition-all duration-200">
                {quantityInCart}
              </span>
              <button
                onClick={handleIncreaseQty}
                disabled={quantityInCart >= availableStock}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Tăng số lượng"
              >
                <PlusIcon className="h-4 w-4 transition-transform duration-200" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingCartIcon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
              Thêm vào giỏ hàng
            </button>
          )}
        </div>
      </div>

      {/* Quick View Dialog */}
      <QuickViewDialog
        productId={product._id}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(ProductCard);

