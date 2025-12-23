import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchCart, upsertCartItem, removeCartItem } from "../features/cart/cartSlice";
import { fetchProducts, Product } from "../features/products/productSlice";
import { useToast } from "../contexts/ToastContext";
import { axiosClient } from "../lib/axiosClient";
import { TrashIcon } from "@heroicons/react/24/outline";
import ProductCard from "../components/ui/ProductCard";

const CartPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, itemsPrice, loading } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const { showSuccess, showError } = useToast();
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cartSelectedKeys");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });
  const [note, setNote] = useState("");
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: "",
    taxCode: "",
    email: "",
    address: "",
  });
  const [saveInvoiceInfo, setSaveInvoiceInfo] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Fetch cart khi user đăng nhập
  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  // Đồng bộ lựa chọn với items
  useEffect(() => {
    const key = (it: typeof items[number]) =>
      `${it.product._id}||${it.size || ""}||${it.color || ""}`;
    const existingKeys = new Set(items.map((it) => key(it)));

    // Nếu chưa có lựa chọn, mặc định chọn tất cả
    setSelectedKeys((prev) => {
      if (!prev.length) {
        const allKeys = [...existingKeys];
        localStorage.setItem("cartSelectedKeys", JSON.stringify(allKeys));
        return allKeys;
      }
      // Giữ lại các key còn tồn tại
      const filtered = prev.filter((k) => existingKeys.has(k));
      localStorage.setItem("cartSelectedKeys", JSON.stringify(filtered));
      return filtered;
    });
  }, [items]);

  // Load note và invoiceInfo từ localStorage và user profile (chỉ 1 lần)
  useEffect(() => {
    if (!user) return;

    // Load từ localStorage
    const savedNote = localStorage.getItem("cartNote");
    const savedInvoiceInfo = localStorage.getItem("cartInvoiceInfo");
    const savedNeedInvoice = localStorage.getItem("cartNeedInvoice");
    
    if (savedNote) setNote(savedNote);
    if (savedNeedInvoice === "true") {
      setNeedInvoice(true);
      if (savedInvoiceInfo) {
        try {
          setInvoiceInfo(JSON.parse(savedInvoiceInfo));
        } catch (e) {
          // Ignore parse error
        }
      }
    }

    // Fetch invoiceInfo từ user profile nếu chưa có trong localStorage
    if (!savedInvoiceInfo) {
      axiosClient
        .get("/api/users/me")
        .then((res) => {
          if (res.data.data.invoiceInfo) {
            setInvoiceInfo(res.data.data.invoiceInfo);
          }
        })
        .catch(() => {
          // Ignore error
        });
    }
  }, [user]);

  // Fetch recommended products (chỉ khi items.length thay đổi, không phải items array)
  useEffect(() => {
    if (!user || items.length === 0) {
      setRecommendedProducts([]);
      return;
    }

    dispatch(fetchProducts({ limit: 20, sort: "createdAt", order: "desc" }))
      .unwrap()
      .then((products) => {
        // Filter out products already in cart
        const cartProductIds = items.map((item) => item.product._id);
        const recommended = products.filter(
          (p: Product) => !cartProductIds.includes(p._id),
        );
        setRecommendedProducts(recommended.slice(0, 4));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user, items.length]); // Chỉ phụ thuộc vào items.length, không phải items array

  const handleChangeQty = async (
    productId: string,
    qty: number,
    size?: string,
    color?: string,
  ) => {
    if (qty <= 0) {
      // Nếu số lượng <= 0, không làm gì (hoặc có thể xóa item)
      return;
    }
    try {
      await dispatch(
        upsertCartItem({ productId, quantity: qty, size, color }),
      ).unwrap();
    } catch (error) {
      showError("Không thể cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  const handleCheckout = () => {
    if (!items.length) return;

    // Lưu lựa chọn sản phẩm
    localStorage.setItem("cartSelectedKeys", JSON.stringify(selectedKeys));

    // Validate invoice info if needed
    if (needInvoice) {
      if (!invoiceInfo.companyName || !invoiceInfo.taxCode || !invoiceInfo.email || !invoiceInfo.address) {
        showError("Vui lòng điền đầy đủ thông tin hóa đơn.");
        return;
      }
    }

    // Lưu note và invoiceInfo vào localStorage để truyền sang CheckoutPage
    localStorage.setItem("cartNote", note);
    localStorage.setItem("cartNeedInvoice", needInvoice ? "true" : "false");
    if (needInvoice && invoiceInfo.companyName) {
      localStorage.setItem("cartInvoiceInfo", JSON.stringify(invoiceInfo));
      localStorage.setItem("cartSaveInvoiceInfo", saveInvoiceInfo ? "true" : "false");
    } else {
      localStorage.removeItem("cartInvoiceInfo");
      localStorage.removeItem("cartSaveInvoiceInfo");
    }

    navigate("/checkout");
  };

  const handleRemoveItem = async (
    productId: string,
    size?: string,
    color?: string,
  ) => {
    if (!productId) return;
    try {
      await dispatch(removeCartItem({ productId, size, color })).unwrap();
      showSuccess("Đã xóa sản phẩm khỏi giỏ hàng!");
    } catch (error) {
      showError("Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  };

  const keyOf = (item: typeof items[number]) =>
    `${item.product._id}||${item.size || ""}||${item.color || ""}`;

  const toggleItem = (item: typeof items[number]) => {
    const k = keyOf(item);
    setSelectedKeys((prev) =>
      prev.includes(k) ? prev.filter((p) => p !== k) : [...prev, k],
    );
  };

  useEffect(() => {
    localStorage.setItem("cartSelectedKeys", JSON.stringify(selectedKeys));
  }, [selectedKeys]);

  const allSelected = items.length > 0 && selectedKeys.length === items.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(items.map((it) => keyOf(it)));
    }
  };

  const selectedItems = items.filter((it) => selectedKeys.includes(keyOf(it)));
  const selectedItemsPrice = selectedItems.reduce(
    (sum, it) => sum + (it.product.salePrice || it.product.price) * it.quantity,
    0,
  );

  // Nếu chưa đăng nhập, hiển thị thông báo yêu cầu đăng nhập
  if (!user) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-semibold">Giỏ hàng</h1>
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="mb-3 text-sm text-slate-600">
            Vui lòng đăng nhập để xem giỏ hàng của bạn.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/auth"
              className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Đăng nhập
            </Link>
            <Link
              to="/products"
              className="inline-flex rounded-md border border-black px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Giỏ hàng</h1>

      {loading ? (
        <p>Đang tải giỏ hàng...</p>
      ) : !items.length ? (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="mb-3 text-sm text-slate-600">Giỏ hàng đang trống.</p>
          <Link
            to="/products"
            className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span className="font-medium">Chọn tất cả</span>
              </div>
              <span className="text-slate-600">
                Đã chọn {selectedItems.length}/{items.length}
              </span>
            </div>
            {items.map((item, index) => (
              <div
                key={`${item.product._id}-${item.size || ""}-${item.color || ""}-${index}`}
                className="flex items-center gap-3 rounded-lg border bg-white p-3 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedKeys.includes(keyOf(item))}
                  onChange={() => toggleItem(item)}
                />
                {item.product.images && item.product.images[0] ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-slate-100" />
                )}
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-slate-500">
                    {(item.product.salePrice || item.product.price).toLocaleString(
                      "vi-VN",
                    )}
                    đ{" "}
                    {item.size || item.color
                      ? `• ${item.size || ""} ${item.color || ""}`
                      : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-7 w-7 rounded border text-sm transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
                    onClick={() =>
                      handleChangeQty(
                        item.product._id,
                        Math.max(1, item.quantity - 1),
                        item.size,
                        item.color,
                      )
                    }
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm transition-all duration-200">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="h-7 w-7 rounded border text-sm transition-all duration-200 hover:bg-slate-100 hover:scale-110 active:scale-95"
                    onClick={() =>
                      handleChangeQty(
                        item.product._id,
                        item.quantity + 1,
                        item.size,
                        item.color,
                      )
                    }
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveItem(
                        item.product._id,
                        item.size,
                        item.color,
                      )
                    }
                    className="ml-2 rounded p-1.5 text-red-600 transition-all duration-200 hover:bg-red-50 hover:scale-110 active:scale-95"
                    aria-label="Xóa sản phẩm"
                  >
                    <TrashIcon className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-lg border bg-white p-4 text-sm">
            <h2 className="mb-3 text-base font-semibold">Tóm tắt đơn</h2>
            <div className="mb-2 flex justify-between">
              <span>Tạm tính</span>
              <span>{selectedItemsPrice.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="mb-2 flex justify-between text-slate-500">
              <span>Phí vận chuyển (ước tính)</span>
              <span>30.000đ</span>
            </div>
            <div className="mb-4 flex justify-between font-semibold">
              <span>Tổng (ước tính)</span>
              <span>{(selectedItemsPrice + 30000).toLocaleString("vi-VN")}đ</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!selectedItems.length}
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
            >
              Tiến hành thanh toán
            </button>
            {!selectedItems.length && (
              <p className="mt-2 text-xs text-slate-500">
                Vui lòng chọn sản phẩm muốn thanh toán.
              </p>
            )}
          </aside>
        </div>
      )}

      {/* Ghi chú đơn hàng - chỉ hiển thị khi có items */}
      {items.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white p-4">
          <h2 className="mb-2 text-base font-semibold">Ghi chú đơn hàng</h2>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
            placeholder="Ghi chú cho đơn hàng (nếu có)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {/* Thông tin hóa đơn - chỉ hiển thị khi có items */}
      {items.length > 0 && (
        <div className="mt-4 rounded-lg border bg-white p-4">
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={needInvoice}
              onChange={(e) => setNeedInvoice(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="font-semibold">Xuất hóa đơn cho đơn hàng</span>
          </label>
          {needInvoice && (
            <div className="mt-3 space-y-3 rounded-md border bg-slate-50 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Tên công ty *</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={invoiceInfo.companyName}
                  onChange={(e) =>
                    setInvoiceInfo({ ...invoiceInfo, companyName: e.target.value })
                  }
                  required={needInvoice}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Mã số thuế *</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={invoiceInfo.taxCode}
                  onChange={(e) =>
                    setInvoiceInfo({ ...invoiceInfo, taxCode: e.target.value })
                  }
                  required={needInvoice}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Email *</label>
                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={invoiceInfo.email}
                  onChange={(e) =>
                    setInvoiceInfo({ ...invoiceInfo, email: e.target.value })
                  }
                  required={needInvoice}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Địa chỉ công ty *</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                  value={invoiceInfo.address}
                  onChange={(e) =>
                    setInvoiceInfo({ ...invoiceInfo, address: e.target.value })
                  }
                  required={needInvoice}
                />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={saveInvoiceInfo}
                  onChange={(e) => setSaveInvoiceInfo(e.target.checked)}
                  className="h-3 w-3"
                />
                <span>Lưu thông tin</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Có thể bạn sẽ thích */}
      {recommendedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Có thể bạn sẽ thích</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {recommendedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;


