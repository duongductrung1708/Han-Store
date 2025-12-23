import { useEffect, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import { useToast } from "../contexts/ToastContext";

interface OrderItem {
  name: string;
  quantity: number;
  product?: string; // ObjectId from backend
  productId?: string; // fallback if provided by API
  slug?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
}

const OrderHistoryPage = () => {
  const { showSuccess, showError } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [myReviews, setMyReviews] = useState<
    Record<
      string,
      { id: string; rating: number; comment?: string; images?: { url: string; publicId?: string }[] }
    >
  >({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string>("");
  const [reviewProductName, setReviewProductName] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    message: string;
    onConfirm?: () => Promise<void> | void;
  }>({ open: false, message: "" });
  const [cancellingId, setCancellingId] = useState<string>("");

  const CANCEL_WINDOW_MINUTES = 30;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/api/orders/me");
        setOrders(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <div>
        <h1 className="mb-4 text-xl font-semibold">Đơn hàng của tôi</h1>
        {loading ? (
          <p>Đang tải đơn hàng...</p>
        ) : !orders.length ? (
          <p className="text-sm text-slate-600">
            Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-lg border bg-white p-4 text-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">
                    Đơn #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="mb-1 text-xs text-slate-600">
                  Trạng thái:{" "}
                  <span className="font-medium">{order.status}</span>
                </p>
                {(() => {
                  const statusLower = (order.status || "").toLowerCase();
                  const canCancel =
                    (statusLower === "pending" || statusLower === "confirmed") &&
                    (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60) <=
                      CANCEL_WINDOW_MINUTES;
                  if (!canCancel) return null;
                  return (
                    <div className="mb-2">
                      <button
                        type="button"
                        disabled={!!cancellingId}
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            message: `Bạn có chắc muốn hủy đơn #${order._id.slice(-6).toUpperCase()}?`,
                            onConfirm: async () => {
                              try {
                                setCancellingId(order._id);
                                const res = await axiosClient.post(
                                  `/api/orders/${order._id}/cancel`,
                                );
                                const updated = res.data?.data;
                                if (updated) {
                                  setOrders((prev) =>
                                    prev.map((o) => (o._id === order._id ? updated : o)),
                                  );
                                }
                                showSuccess("Đã hủy đơn hàng");
                              } catch (error: any) {
                                const msg =
                                  error?.response?.data?.message ||
                                  "Không thể hủy đơn. Vui lòng thử lại.";
                                showError(msg);
                              } finally {
                                setCancellingId("");
                              }
                            },
                          })
                        }
                        className="rounded-md border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                      >
                        {cancellingId === order._id ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Có thể hủy trong {CANCEL_WINDOW_MINUTES} phút đầu nếu chưa giao.
                      </p>
                    </div>
                  );
                })()}
                <p className="mb-1 text-xs text-slate-600">
                  Sản phẩm:
                </p>
                <div className="mb-2 space-y-1">
                  {order.items.map((i, idx) => {
                    const statusLower = (order.status || "").toLowerCase();
                    const productIdOrSlug =
                      i.product ||
                      i.productId ||
                      i.slug ||
                      (i as any).product?._id ||
                      (i as any).product?.slug;
                    const canReview =
                      statusLower === "delivered" &&
                      !!productIdOrSlug;
                    const existingReview = productIdOrSlug
                      ? myReviews[productIdOrSlug]
                      : undefined;
                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <span>
                          {i.name} x{i.quantity}
                        </span>
                        {canReview && (
                          <button
                            onClick={async () => {
                              if (!productIdOrSlug) return;
                              setReviewProductId(productIdOrSlug);
                              setReviewProductName(i.name);

                              try {
                                const res = await axiosClient.get("/api/reviews/my", {
                                  params: { productId: productIdOrSlug },
                                });
                                const data = res.data?.data;
                                if (data && data._id) {
                                  setMyReviews((prev) => ({
                                    ...prev,
                                    [productIdOrSlug]: {
                                      id: data._id,
                                      rating: data.rating,
                                      comment: data.comment,
                                      images: data.images || [],
                                    },
                                  }));
                                  setReviewRating(data.rating || 5);
                                  setReviewComment(data.comment || "");
                                  if (data.images?.length) {
                                    setReviewImagePreviews(data.images.map((img: any) => img.url));
                                    setReviewImages([]); // do not store File objects from server
                                  } else {
                                    setReviewImages([]);
                                    setReviewImagePreviews([]);
                                  }
                                } else {
                                  // no review yet
                                  setReviewRating(5);
                                  setReviewComment("");
                                  setReviewImages([]);
                                  setReviewImagePreviews([]);
                                }
                              } catch (error) {
                                // ignore fetch error, open empty form
                                setReviewRating(5);
                                setReviewComment("");
                                setReviewImages([]);
                                setReviewImagePreviews([]);
                              }

                              setShowReviewModal(true);
                            }}
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                          >
                            {existingReview ? "Xem / chỉnh sửa" : "Viết đánh giá"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm font-semibold">
                  Tổng: {order.totalPrice.toLocaleString("vi-VN")}đ
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Viết đánh giá</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewImages([]);
                  setReviewImagePreviews([]);
                  setReviewComment("");
                  setReviewRating(5);
                }}
                className="rounded-full bg-slate-100 px-2 py-1 text-sm hover:bg-slate-200"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-600">{reviewProductName}</p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Đánh giá</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReviewRating(r)}
                    className="h-8 w-8 transition-transform duration-150 hover:scale-110 active:scale-95"
                    aria-label={`rating-${r}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-8 w-8 ${
                        r <= reviewRating ? "text-yellow-400" : "text-slate-300"
                      }`}
                      fill="currentColor"
                    >
                      <path d="M11.48 3.5c.2-.44.84-.44 1.04 0l2.1 4.6 5.02.44c.48.04.68.65.31.98l-3.8 3.37 1.15 4.9c.11.47-.4.84-.81.58L12 15.93l-4.39 2.44c-.41.26-.92-.11-.81-.58l1.15-4.9-3.8-3.37c-.37-.33-.17-.94.31-.98l5.02-.44 2.1-4.6Z" />
                    </svg>
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
                placeholder="Chia sẻ cảm nhận của bạn..."
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
                    <div
                      key={idx}
                      className="relative h-16 w-16 overflow-hidden rounded border"
                    >
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextFiles = reviewImages.filter((_, i) => i !== idx);
                          const nextPreviews = reviewImagePreviews.filter(
                            (_, i) => i !== idx,
                          );
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
            <div className="flex justify-end gap-2">
              {myReviews[reviewProductId]?.id && (
                <button
                  type="button"
                  disabled={submitting || deleting}
                  onClick={async () => {
                    const existing = myReviews[reviewProductId];
                    if (!existing?.id) return;
                    setConfirmDialog({
                      open: true,
                      message: "Bạn có chắc muốn xóa đánh giá này?",
                      onConfirm: async () => {
                        try {
                          setDeleting(true);
                          await axiosClient.delete(`/api/reviews/${existing.id}`);
                          setMyReviews((prev) => {
                            const next = { ...prev };
                            delete next[reviewProductId];
                            return next;
                          });
                          setShowReviewModal(false);
                          setReviewImages([]);
                          setReviewImagePreviews([]);
                          setReviewComment("");
                          setReviewRating(5);
                          showSuccess("Đã xóa đánh giá");
                        } catch (error: any) {
                          const msg =
                            error?.response?.data?.message ||
                            "Không thể xóa đánh giá. Vui lòng thử lại.";
                          showError(msg);
                        } finally {
                          setDeleting(false);
                        }
                      },
                    });
                  }}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleting ? "Đang xóa..." : "Xóa đánh giá"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewImages([]);
                  setReviewImagePreviews([]);
                  setReviewComment("");
                  setReviewRating(5);
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reviewProductId) return;
                  setSubmitting(true);
                  try {
                    let uploadedImages: { url: string; publicId?: string }[] = [];
                    if (reviewImages.length > 0) {
                      const formData = new FormData();
                      reviewImages.slice(0, 5).forEach((file) => {
                        formData.append("images", file);
                      });
                      const uploadRes = await axiosClient.post(
                        "/api/upload/review-images",
                        formData,
                        {
                          headers: { "Content-Type": "multipart/form-data" },
                        },
                      );
                      uploadedImages = uploadRes.data?.data || [];
                    }

                    let result;
                    const existing = myReviews[reviewProductId];
                    if (existing?.id) {
                      result = await axiosClient.put(`/api/reviews/${existing.id}`, {
                        rating: reviewRating,
                        comment: reviewComment || undefined,
                        images: uploadedImages.length ? uploadedImages : existing.images || [],
                      });
                    } else {
                      result = await axiosClient.post("/api/reviews", {
                        productId: reviewProductId,
                        rating: reviewRating,
                        comment: reviewComment || undefined,
                        images: uploadedImages,
                      });
                    }

                    const saved = result.data?.data;
                    if (saved?._id) {
                      setMyReviews((prev) => ({
                        ...prev,
                        [reviewProductId]: {
                          id: saved._id,
                          rating: saved.rating,
                          comment: saved.comment,
                          images: saved.images || [],
                        },
                      }));
                    }

                    showSuccess("Đã gửi đánh giá!");
                    setShowReviewModal(false);
                    setReviewImages([]);
                    setReviewImagePreviews([]);
                    setReviewComment("");
                    setReviewRating(5);

                    const res = await axiosClient.get("/api/orders/me");
                    setOrders(res.data.data);
                  } catch (error: any) {
                    const msg =
                      error?.response?.data?.message ||
                      "Không thể gửi đánh giá. Vui lòng thử lại.";
                    showError(msg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">Xác nhận</h3>
            <p className="mb-4 text-sm text-slate-700">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ open: false, message: "" })}
                className="rounded-md px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog({ open: false, message: "" });
                  if (fn) {
                    await fn();
                  }
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderHistoryPage;


