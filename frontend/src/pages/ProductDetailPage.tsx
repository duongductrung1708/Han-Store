import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchProductDetail, Product } from "../features/products/productSlice";
import { upsertCartItem } from "../features/cart/cartSlice";
import { axiosClient } from "../lib/axiosClient";
import { useToast } from "../contexts/ToastContext";

interface Review {
  _id: string;
  user: { name: string };
  rating: number;
  comment?: string;
  createdAt: string;
  images?: { url: string; publicId?: string }[];
}

const ProductDetailPage = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const { showSuccess, showError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [canReview, setCanReview] = useState(false);
  const [checkingCanReview, setCheckingCanReview] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);

  // Đóng modal ảnh khi nhấn ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowImageModal(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (!idOrSlug) return;

    setLoading(true);
    dispatch(fetchProductDetail(idOrSlug))
      .unwrap()
      .then((data) => {
        setProduct(data);
        // Set default size/color if available
        if (data.variants && data.variants.length > 0) {
          const firstVariant = data.variants[0];
          if (firstVariant.size) setSelectedSize(firstVariant.size || "");
          if (firstVariant.color) setSelectedColor(firstVariant.color || "");
        }
        setLoading(false);

        // Fetch reviews
        axiosClient
          .get(`/api/reviews/product/${data._id}`)
          .then((res) => setReviews(res.data.data || []))
          .catch(() => {});

        // Check if user can review this product
        if (user) {
          setCheckingCanReview(true);
          axiosClient
            .get(`/api/reviews/product/${data._id}/can-review`)
            .then((res) => {
              setCanReview(res.data.data.canReview || false);
            })
            .catch(() => {
              setCanReview(false);
            })
            .finally(() => {
              setCheckingCanReview(false);
            });
        } else {
          setCanReview(false);
        }

        // Fetch related products (same category, or latest products if no category)
        const fetchRelated = async () => {
          try {
            if (data.categories && data.categories.length > 0) {
              // Try to get products from same category first
              const res = await axiosClient.get(
                `/api/products?category=${data.categories[0]._id}&limit=8&sort=createdAt&order=desc`,
              );
              const related = res.data.data.filter(
                (p: Product) => p._id !== data._id,
              );
              if (related.length >= 4) {
                setRelatedProducts(related.slice(0, 4));
                return;
              }
            }
            // Fallback: get latest products if no category or not enough related products
            const res = await axiosClient.get(
              `/api/products?limit=8&sort=createdAt&order=desc`,
            );
            const related = res.data.data.filter(
              (p: Product) => p._id !== data._id,
            );
            setRelatedProducts(related.slice(0, 4));
          } catch (error) {
            console.error("Error fetching related products:", error);
          }
        };
        fetchRelated();
      })
      .catch(() => setLoading(false));
  }, [dispatch, idOrSlug, user]);

  // Check if description needs expand/collapse button
  useEffect(() => {
    if (product?.description && descriptionRef.current) {
      const element = descriptionRef.current;
      // Check if content height exceeds 6 lines (approximately 144px)
      const lineHeight = 24; // prose-sm line height
      const maxHeight = lineHeight * 6;
      setShowExpandButton(element.scrollHeight > maxHeight);
    }
  }, [product?.description]);

  const handleAddToCart = async () => {
    if (!product || !user) {
      navigate("/auth", { state: { from: location.pathname } });
      return;
    }

    setAddingToCart(true);
    try {
      await dispatch(
        upsertCartItem({
          productId: product._id,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        }),
      ).unwrap();
      showSuccess("Đã thêm vào giỏ hàng!");
    } catch (error) {
      showError("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || !user) {
      navigate("/auth", { state: { from: location.pathname } });
      return;
    }

    setAddingToCart(true);
    try {
      await dispatch(
        upsertCartItem({
          productId: product._id,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        }),
      ).unwrap();
      // Redirect to checkout after adding to cart
      navigate("/checkout");
    } catch (error) {
      showError("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!product || !user || !reviewRating) return;

    setSubmittingReview(true);
    try {
      let uploadedImages: { url: string; publicId?: string }[] = [];

      if (reviewImages.length > 0) {
        const formData = new FormData();
        reviewImages.slice(0, 5).forEach((file) => {
          formData.append("images", file);
        });
        const uploadRes = await axiosClient.post("/api/upload/review-images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImages = uploadRes.data?.data || [];
      }

      await axiosClient.post("/api/reviews", {
        productId: product._id,
        rating: reviewRating,
        comment: reviewComment || undefined,
        images: uploadedImages,
      });
      showSuccess("Đã gửi đánh giá!");
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
      setReviewImagePreviews([]);
      setCanReview(false); // Đã đánh giá rồi, không thể đánh giá nữa
      // Reload reviews
      const res = await axiosClient.get(`/api/reviews/product/${product._id}`);
      setReviews(res.data.data || []);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.";
      showError(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6 h-8 w-64 rounded bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="aspect-square rounded bg-slate-200" />
          <div className="space-y-4">
            <div className="h-8 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Sản phẩm không tồn tại.</p>
        <Link to="/products" className="mt-4 text-accent hover:underline">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const discountPercent =
    product.salePrice && product.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const availableSizes = [
    ...new Set(product.variants?.map((v) => v.size).filter(Boolean) || []),
  ];
  const availableColors = [
    ...new Set(product.variants?.map((v) => v.color).filter(Boolean) || []),
  ];

  const currentPrice = product.salePrice || product.price;

  return (
    <>
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-600">
        <Link to="/" className="hover:text-accent">
          Trang chủ
        </Link>
        {" / "}
        <Link to="/products" className="hover:text-accent">
          Sản phẩm
        </Link>
        {product.categories && product.categories[0] && (
          <>
            {" / "}
            <span>{product.categories[0].name}</span>
          </>
        )}
        {" / "}
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          <div
            className="group relative mb-4 aspect-square overflow-hidden rounded-lg bg-slate-100 cursor-zoom-in"
            onClick={() => setShowImageModal(true)}
          >
            {product.images && product.images[selectedImageIndex] ? (
              <img
                src={product.images[selectedImageIndex].url}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <svg
                  className="h-24 w-24"
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
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Nhấn để phóng to
            </span>
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setShowImageModal(true);
                    }}
                    className={`aspect-square w-20 overflow-hidden rounded border-2 transition-all duration-200 hover:scale-105 ${
                    selectedImageIndex === index
                      ? "border-black scale-105"
                      : "border-transparent hover:border-slate-400"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          {product.averageRating && product.averageRating > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={i < Math.round(product.averageRating!) ? "text-yellow-400" : "text-slate-300"}
                  >
                    ⭐
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
                  <span className="rounded-full bg-red-500 px-2 py-1 text-sm font-semibold text-white">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-3xl font-bold">
                {product.price.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>

          {/* Variants */}
          {availableSizes.length > 0 && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Size</label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size || "")}
                    className={`rounded border px-4 py-2 text-sm transition-all duration-200 ${
                      selectedSize === size
                        ? "border-black bg-black text-white scale-105"
                        : "border-slate-300 bg-white hover:border-black hover:scale-105 active:scale-95"
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
              <label className="mb-2 block text-sm font-medium">Màu sắc</label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color || "")}
                    className={`rounded border px-4 py-2 text-sm transition-all duration-200 ${
                      selectedColor === color
                        ? "border-black bg-black text-white scale-105"
                        : "border-slate-300 bg-white hover:border-black hover:scale-105 active:scale-95"
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
            <label className="mb-2 block text-sm font-medium">Số lượng</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded border px-3 py-2 transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
              >
                -
              </button>
              <span className="w-12 text-center transition-all duration-200">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="rounded border px-3 py-2 transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart & Buy Now */}
          <div className="mb-8 flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 rounded-md border-2 border-black bg-white px-6 py-3 font-semibold text-black transition-all duration-200 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={addingToCart}
              className="flex-1 rounded-md bg-black px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {addingToCart ? "Đang xử lý..." : "Mua ngay"}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Mô tả sản phẩm
              </h2>
              <div className="relative">
                <div
                  ref={descriptionRef}
                  className={`prose prose-sm max-w-none text-slate-700 transition-all duration-300 ${
                    !descriptionExpanded && showExpandButton
                      ? "line-clamp-6 overflow-hidden"
                      : ""
                  }`}
                  style={{
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
                {/* Expand/Collapse button */}
                {showExpandButton && (
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-accent hover:text-orange-600 transition-colors"
                  >
                    {descriptionExpanded ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        Xem thêm
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">Đánh giá sản phẩm</h2>

        {/* Submit Review Form */}
        {user ? (
          checkingCanReview ? (
            <div className="mb-8 rounded-lg border bg-slate-50 p-6 text-center text-slate-500">
              Đang kiểm tra...
            </div>
          ) : canReview ? (
            <div className="mb-8 rounded-lg border bg-slate-50 p-6">
              <h3 className="mb-4 font-semibold">Viết đánh giá</h3>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Đánh giá</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className={`text-2xl ${
                        rating <= reviewRating ? "text-yellow-400" : "text-slate-300"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Bình luận</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Ảnh (tối đa 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 5);
                    setReviewImages(files);
                    setReviewImagePreviews(files.map((f) => URL.createObjectURL(f)));
                  }}
                  className="text-sm"
                />
                {reviewImagePreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reviewImagePreviews.map((src, idx) => (
                      <div key={idx} className="relative h-20 w-20 overflow-hidden rounded border">
                        <img
                          src={src}
                          alt={`preview-${idx}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextFiles = reviewImages.filter((_, i) => i !== idx);
                            const nextPreviews = reviewImagePreviews.filter((_, i) => i !== idx);
                            setReviewImages(nextFiles);
                            setReviewImagePreviews(nextPreviews);
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/70 px-1 text-[10px] font-semibold text-white"
                          aria-label="Xóa ảnh"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          ) : (
            <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận
                hàng thành công.
              </p>
            </div>
          )
        ) : (
          <div className="mb-8 rounded-lg border bg-slate-50 p-6 text-center">
            <p className="mb-3 text-sm text-slate-600">
              Vui lòng <Link to="/auth" className="text-accent hover:underline">đăng nhập</Link> để
              đánh giá sản phẩm.
            </p>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-slate-500">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{review.user.name}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? "text-yellow-400" : "text-slate-300"}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-slate-700">{review.comment}</p>
                )}
                {review.images && review.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`review-${idx}`}
                        className="h-20 w-20 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      <div className="mt-12 border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">Sản phẩm liên quan</h2>
        {relatedProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {relatedProducts.map((p) => {
              const discountPercent =
                p.salePrice && p.price
                  ? Math.round(
                      ((p.price - p.salePrice) / p.price) * 100,
                    )
                  : 0;

              return (
                <Link
                  key={p._id}
                  to={`/products/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    {p.images && p.images[0] ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="line-clamp-2 text-sm font-medium group-hover:text-accent">
                      {p.name}
                    </span>
                    <div className="mt-auto flex items-center gap-2">
                      {p.salePrice ? (
                        <>
                          <span className="text-sm font-semibold text-red-600">
                            {p.salePrice.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {p.price.toLocaleString("vi-VN")}đ
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold">
                          {p.price.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                    {p.averageRating && p.averageRating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>⭐</span>
                        <span>{p.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <p>Đang tải sản phẩm liên quan...</p>
          </div>
        )}
      </div>
    </div>
    {showImageModal &&
      product &&
      product.images &&
      product.images[selectedImageIndex] && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={() => setShowImageModal(false)}
      >
        <div
          className="relative max-h-[90vh] max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute -right-2 -top-2 rounded-full bg-black/80 px-3 py-1 text-sm font-semibold text-white hover:bg-black"
            aria-label="Đóng"
          >
            ×
          </button>
          <img
            src={product.images[selectedImageIndex].url}
            alt={product.name}
            className="h-full max-h-[85vh] w-full max-w-[85vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      </div>
    )}
    </>
  );
};

export default ProductDetailPage;
