import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import { upsertCartItem } from "../../features/cart/cartSlice";
import { fetchProductDetail, Product } from "../../features/products/productSlice";
import { useToast } from "../../contexts/ToastContext";
import { XMarkIcon, ShoppingCartIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/20/solid";

interface QuickViewDialogProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewDialog = ({ productId, isOpen, onClose }: QuickViewDialogProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { items } = useAppSelector((s) => s.cart);
  const { showSuccess, showError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Kiểm tra sản phẩm có trong giỏ hàng không
  const cartItem = items.find((item) => item.product._id === productId);
  const quantityInCart = cartItem?.quantity || 0;

  // Tính stock
  const totalStock = product?.totalStock || 0;
  const availableStock = product?.variants
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : totalStock;
  const isOutOfStock = availableStock === 0;

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      dispatch(fetchProductDetail(productId))
        .unwrap()
        .then((data) => {
          setProduct(data);
          setSelectedImageIndex(0);
          // Set default size/color if available
          if (data.variants && data.variants.length > 0) {
            const firstVariant = data.variants[0];
            setSelectedSize(firstVariant.size || "");
            setSelectedColor(firstVariant.color || "");
          }
          setQuantity(1);
        })
        .catch(() => {
          showError("Không thể tải thông tin sản phẩm.");
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, productId, dispatch, onClose, showError]);

  // Close dialog on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleAddToCart = async () => {
    if (!product || !user) {
      navigate("/auth", { state: { from: window.location.pathname } });
      return;
    }

    if (isOutOfStock || availableStock === 0) {
      showError("Sản phẩm đã hết hàng.");
      return;
    }

    // Basic validation for size/color if variants exist
    if (product.variants && product.variants.length > 0) {
      const hasSizes = product.variants.some((v) => v.size);
      const hasColors = product.variants.some((v) => v.color);

      if (hasSizes && !selectedSize) {
        showError("Vui lòng chọn kích thước.");
        return;
      }
      if (hasColors && !selectedColor) {
        showError("Vui lòng chọn màu sắc.");
        return;
      }
    }

    try {
      await dispatch(
        upsertCartItem({
          productId: product._id,
          quantity: quantityInCart + quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        }),
      ).unwrap();
      showSuccess("Đã thêm vào giỏ hàng!");
      onClose();
    } catch (error) {
      showError("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  const handleViewDetail = () => {
    if (product) {
      navigate(`/products/${product.slug || product._id}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const discountPercent =
    product?.salePrice && product?.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const availableSizes = [
    ...new Set(product?.variants?.map((v) => v.size).filter(Boolean) || []),
  ];
  const availableColors = [
    ...new Set(product?.variants?.map((v) => v.color).filter(Boolean) || []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl transition-all duration-300 ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
          </div>
        ) : product ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-lg transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
              aria-label="Đóng"
            >
              <XMarkIcon className="h-5 w-5 transition-transform duration-200 hover:rotate-90" />
            </button>

            {/* Images */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-t-lg bg-slate-100 md:rounded-l-lg md:rounded-t-none">
                {product.images && product.images[selectedImageIndex] ? (
                  <img
                    src={product.images[selectedImageIndex].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
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
              </div>
              {product.images && product.images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto p-2">
                  {product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className={`h-16 w-16 cursor-pointer rounded-md border object-cover transition-all duration-200 hover:scale-110 ${
                        index === selectedImageIndex
                          ? "border-black ring-2 ring-black scale-105"
                          : "border-slate-300 hover:border-slate-500"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6">
              <h2 className="mb-2 text-2xl font-bold">{product.name}</h2>

              {/* Rating */}
              {product.averageRating && product.averageRating > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>
                        {i < Math.round(product.averageRating!) ? (
                          <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-slate-300" />
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">
                    {product.averageRating.toFixed(1)} ({product.totalReviews || 0} đánh giá)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                {product.salePrice ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-red-600">
                      {product.salePrice.toLocaleString("vi-VN")}đ
                    </span>
                    <span className="text-xl text-slate-400 line-through">
                      {product.price.toLocaleString("vi-VN")}đ
                    </span>
                    {discountPercent > 0 && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-slate-900">
                    {product.price.toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>

              {/* Variants */}
              {availableSizes.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold">Kích thước:</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-md border px-3 py-2 text-sm transition-all duration-200 ${
                          selectedSize === size
                            ? "border-black bg-black text-white scale-105"
                            : "border-slate-300 hover:bg-slate-100 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold">Màu sắc:</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-md border px-3 py-2 text-sm transition-all duration-200 ${
                          selectedColor === color
                            ? "border-black bg-black text-white scale-105"
                            : "border-slate-300 hover:bg-slate-100 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold">Số lượng:</h3>
                <div className="flex w-32 items-center justify-between rounded-md border">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-2 transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
                  >
                    -
                  </button>
                  <span className="text-sm transition-all duration-200">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((prev) =>
                        Math.min(availableStock - quantityInCart, prev + 1),
                      )
                    }
                    disabled={quantity >= availableStock - quantityInCart}
                    className="px-3 py-2 transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    +
                  </button>
                </div>
                {quantityInCart > 0 && (
                  <p className="mt-2 text-xs text-slate-600">
                    Đã có {quantityInCart} sản phẩm trong giỏ hàng
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold">Mô tả:</h3>
                  <div
                    className="prose prose-sm max-w-none text-sm text-slate-700 line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html:
                        product.description.length > 150
                          ? product.description.substring(0, 150) + "..."
                          : product.description,
                    }}
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || availableStock === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <ShoppingCartIcon className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
                  {isOutOfStock || availableStock === 0
                    ? "Hết hàng"
                    : "Thêm vào giỏ hàng"}
                </button>
                <button
                  onClick={handleViewDetail}
                  className="rounded-md border border-black px-4 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-96 items-center justify-center">
            <p className="text-slate-500">Không tìm thấy sản phẩm.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickViewDialog;

