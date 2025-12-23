import { FormEvent, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { fetchCart } from "../features/cart/cartSlice";
import { axiosClient } from "../lib/axiosClient";
import { useToast } from "../contexts/ToastContext";
import {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  vietnamAddresses,
} from "../data/vietnamAddresses";
import { getShippingFee } from "../data/shippingFees";

interface Address {
  fullName: string;
  phone: string;
  street: string;
  ward?: string;
  district?: string;
  city: string;
  isDefault: boolean;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const { showWarning } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [districtText, setDistrictText] = useState("");
  const [wardText, setWardText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MOMO">("COD");
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [note, setNote] = useState("");
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: "",
    taxCode: "",
    email: "",
    address: "",
  });
  const [saveInvoiceInfo, setSaveInvoiceInfo] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cartSelectedKeys");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {
      // ignore
    }
    return [];
  });

  const provinces = getProvinces();
  const districts = provinceCode ? getDistrictsByProvince(provinceCode) : [];
  const wards = provinceCode && districtCode ? getWardsByDistrict(provinceCode, districtCode) : [];
  
  // Kiểm tra xem tỉnh có dữ liệu chi tiết không
  const hasDistrictData = districts.length > 0;
  const hasWardData = wards.length > 0;

  // Tính phí ship dựa trên province code (trụ sở ở Hà Nội)
  const shippingFee = getShippingFee(provinceCode);

  const keyOf = (item: typeof items[number]) =>
    `${item.product._id}||${item.size || ""}||${item.color || ""}`;

  useEffect(() => {
    if (!items.length) return;
    if (selectedKeys.length === 0) {
      const allKeys = items.map((it) => keyOf(it));
      setSelectedKeys(allKeys);
      localStorage.setItem("cartSelectedKeys", JSON.stringify(allKeys));
    } else {
      const existingKeys = new Set(items.map((it) => keyOf(it)));
      const filtered = selectedKeys.filter((k) => existingKeys.has(k));
      const changed =
        filtered.length !== selectedKeys.length ||
        filtered.some((k, idx) => k !== selectedKeys[idx]);
      if (changed) {
        setSelectedKeys(filtered);
        localStorage.setItem("cartSelectedKeys", JSON.stringify(filtered));
      }
    }
  }, [items, selectedKeys]);

  const selectedItems = useMemo(() => {
    if (!items.length) return [];
    if (selectedKeys.length === 0) return items;
    const keys = new Set(selectedKeys);
    return items.filter((it) => keys.has(keyOf(it)));
  }, [items, selectedKeys]);

  const itemsPrice = useMemo(
    () =>
      selectedItems.reduce(
        (sum, it) => sum + (it.product.salePrice || it.product.price) * it.quantity,
        0,
      ),
    [selectedItems],
  );

  // Fetch cart khi component mount và user đã đăng nhập
  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  // Fetch addresses khi component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      
      try {
        setLoadingAddresses(true);
        const res = await axiosClient.get("/api/users/me/addresses");
        const userAddresses = res.data.data || [];
        setAddresses(userAddresses);
        
        // Nếu chưa có địa chỉ, redirect đến profile
        if (userAddresses.length === 0) {
          showWarning("Vui lòng thêm địa chỉ giao hàng trước khi thanh toán.");
          navigate("/profile?tab=addresses", {
            state: { from: "/checkout" },
          });
          return;
        }
        
        // Tự động chọn địa chỉ mặc định hoặc địa chỉ đầu tiên
        const defaultIndex = userAddresses.findIndex((addr: Address) => addr.isDefault);
        const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
        setSelectedAddressIndex(indexToSelect);
        setUseSavedAddress(true);
        
        // Tự động điền form với địa chỉ được chọn
        const selectedAddr = userAddresses[indexToSelect];
        setFullName(selectedAddr.fullName);
        setPhone(selectedAddr.phone);
        setStreet(selectedAddr.street || "");
        setProvinceCode(selectedAddr.provinceCode || "");
        setDistrictCode(selectedAddr.districtCode || "");
        
        // Nếu có wardCode, sử dụng nó
        // Nếu không có wardCode nhưng có ward (tên), thử tìm wardCode từ tên
        if (selectedAddr.wardCode) {
          setWardCode(selectedAddr.wardCode);
          setWardText("");
        } else if (selectedAddr.ward && selectedAddr.provinceCode && selectedAddr.districtCode) {
          // Tìm wardCode từ tên ward
          const provinceFull = vietnamAddresses.find((p) => p.code === selectedAddr.provinceCode);
          if (provinceFull?.districts) {
            const district = provinceFull.districts.find((d) => d.code === selectedAddr.districtCode);
            if (district?.wards) {
              const ward = district.wards.find((w) => w.name === selectedAddr.ward);
              if (ward) {
                setWardCode(ward.code);
                setWardText("");
              } else {
                // Không tìm thấy wardCode, sử dụng wardText
                setWardCode("");
                setWardText(selectedAddr.ward);
              }
            } else {
              setWardCode("");
              setWardText(selectedAddr.ward);
            }
          } else {
            setWardCode("");
            setWardText(selectedAddr.ward);
          }
        } else {
          setWardCode("");
          setWardText(selectedAddr.ward || "");
        }
        
        setDistrictText(selectedAddr.district || "");

        // Load note và invoiceInfo từ localStorage (được lưu từ CartPage)
        const savedNote = localStorage.getItem("cartNote");
        const savedInvoiceInfo = localStorage.getItem("cartInvoiceInfo");
        const savedNeedInvoice = localStorage.getItem("cartNeedInvoice");
        const savedSaveInvoiceInfo = localStorage.getItem("cartSaveInvoiceInfo");

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
          if (savedSaveInvoiceInfo === "true") {
            setSaveInvoiceInfo(true);
          }
        }

        // Nếu không có từ localStorage, fetch từ user profile
        if (!savedInvoiceInfo) {
          try {
            const profileRes = await axiosClient.get("/api/users/me");
            if (profileRes.data.data.invoiceInfo) {
              setInvoiceInfo(profileRes.data.data.invoiceInfo);
            }
          } catch (error) {
            // Ignore error
          }
        }

      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [user, navigate, showWarning]);

  // Khi chọn địa chỉ từ danh sách
  useEffect(() => {
    if (useSavedAddress && selectedAddressIndex !== null && addresses.length > 0) {
      const selectedAddr = addresses[selectedAddressIndex];
      if (selectedAddr) {
        setFullName(selectedAddr.fullName);
        setPhone(selectedAddr.phone);
        setStreet(selectedAddr.street || "");
        setProvinceCode(selectedAddr.provinceCode || "");
        setDistrictCode(selectedAddr.districtCode || "");
        
        // Nếu có wardCode, sử dụng nó
        // Nếu không có wardCode nhưng có ward (tên), thử tìm wardCode từ tên
        if (selectedAddr.wardCode) {
          setWardCode(selectedAddr.wardCode);
          setWardText("");
        } else if (selectedAddr.ward && selectedAddr.provinceCode && selectedAddr.districtCode) {
          // Tìm wardCode từ tên ward
          const provinceFull = vietnamAddresses.find((p) => p.code === selectedAddr.provinceCode);
          if (provinceFull?.districts) {
            const district = provinceFull.districts.find((d) => d.code === selectedAddr.districtCode);
            if (district?.wards) {
              const ward = district.wards.find((w) => w.name === selectedAddr.ward);
              if (ward) {
                setWardCode(ward.code);
                setWardText("");
              } else {
                // Không tìm thấy wardCode, sử dụng wardText
                setWardCode("");
                setWardText(selectedAddr.ward);
              }
            } else {
              setWardCode("");
              setWardText(selectedAddr.ward);
            }
          } else {
            setWardCode("");
            setWardText(selectedAddr.ward);
          }
        } else {
          setWardCode("");
          setWardText(selectedAddr.ward || "");
        }
        
        setDistrictText(selectedAddr.district || "");
      }
    }
  }, [selectedAddressIndex, useSavedAddress, addresses]);

  // Đảm bảo selectedAddressIndex luôn hợp lệ khi useSavedAddress được bật
  useEffect(() => {
    if (useSavedAddress && addresses.length > 0) {
      // Chỉ set lại nếu selectedAddressIndex không hợp lệ
      if (
        selectedAddressIndex === null ||
        selectedAddressIndex >= addresses.length ||
        selectedAddressIndex < 0
      ) {
        const defaultIndex = addresses.findIndex((addr) => addr.isDefault);
        const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
        setSelectedAddressIndex(indexToSelect);
      }
    }
  }, [useSavedAddress, addresses.length, selectedAddressIndex]); // Thêm selectedAddressIndex vào dependency nhưng có điều kiện check để tránh loop

  // Reset district và ward khi province thay đổi
  useEffect(() => {
    setDistrictCode("");
    setWardCode("");
    setDistrictText("");
    setWardText("");
  }, [provinceCode]);

  // Reset ward khi district thay đổi (chỉ khi districtCode thực sự thay đổi)
  const prevDistrictCodeRef = useRef(districtCode);
  useEffect(() => {
    if (prevDistrictCodeRef.current !== districtCode && prevDistrictCodeRef.current !== "") {
      console.log("District changed, resetting ward. Old:", prevDistrictCodeRef.current, "New:", districtCode);
      setWardCode("");
      setWardText("");
    }
    prevDistrictCodeRef.current = districtCode;
  }, [districtCode]);


  const handleValidateVoucher = async () => {
    if (!voucherCode) return;
    try {
      setError(null);
      const res = await axiosClient.post("/api/vouchers/validate", {
        code: voucherCode,
        orderAmount: itemsPrice,
      });
      if (!res.data.data.canUse) {
        setDiscount(0);
        setError("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher.");
      } else {
        const v = res.data.data.voucher;
        const value =
          v.discountType === "PERCENT"
            ? Math.min(
                (itemsPrice * v.discountValue) / 100,
                v.maxDiscountAmount || Number.MAX_SAFE_INTEGER,
              )
            : v.discountValue;
        setDiscount(value);
      }
    } catch {
      setDiscount(0);
      setError("Voucher không hợp lệ hoặc đã hết hạn.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      setError("Giỏ hàng đang trống.");
      return;
    }
    if (!selectedItems.length) {
      setError("Vui lòng chọn sản phẩm để thanh toán.");
      return;
    }

    // Validate invoice info if needed
    if (needInvoice) {
      if (!invoiceInfo.companyName || !invoiceInfo.taxCode || !invoiceInfo.email || !invoiceInfo.address) {
        setError("Vui lòng điền đầy đủ thông tin hóa đơn.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Lấy tên tỉnh, quận, phường từ code hoặc giá trị nhập thủ công
      // Lấy từ vietnamAddresses để có đầy đủ dữ liệu districts và wards
      const provinceFull = vietnamAddresses.find((p) => p.code === provinceCode);
      if (!provinceFull) {
        setError("Tỉnh/Thành phố không hợp lệ");
        setLoading(false);
        return;
      }

      let districtName = districtText || "";
      let wardName = wardText || "";
      
      // Chỉ lấy từ code nếu tỉnh có dữ liệu chi tiết
      if (districtCode && provinceFull.districts && provinceFull.districts.length > 0) {
        const district = provinceFull.districts.find((d) => d.code === districtCode);
        if (district) {
          districtName = district.name;
        }
      }
      
      if (wardCode && districtCode && provinceFull.districts && provinceFull.districts.length > 0) {
        const district = provinceFull.districts.find((d) => d.code === districtCode);
        if (district && district.wards && district.wards.length > 0) {
          const ward = district.wards.find((w) => w.code === wardCode);
          if (ward) {
            wardName = ward.name;
          }
        }
      }

      console.log("Checkout - Final values:", {
        districtCode,
        wardCode,
        districtName,
        wardName,
        districtText,
        wardText,
        hasWardData,
        wardsCount: wards.length,
        provinceDistricts: provinceFull.districts?.length || 0,
      });

      // Validate shipping address
      if (!provinceFull || !provinceFull.name) {
        setError("Vui lòng chọn Tỉnh/Thành phố");
        setLoading(false);
        return;
      }

      if (!districtName || districtName.trim() === "") {
        setError("Vui lòng chọn hoặc nhập Quận/Huyện");
        setLoading(false);
        return;
      }

      // Kiểm tra xem có cần Phường/Xã không
      // Nếu tỉnh có dữ liệu chi tiết và đã chọn districtCode, thì phải chọn wardCode
      // Nếu không có dữ liệu chi tiết, thì phải nhập wardText
      const selectedDistrict = districtCode 
        ? provinceFull.districts?.find((d) => d.code === districtCode)
        : null;
      const hasWardsForDistrict = selectedDistrict?.wards && selectedDistrict.wards.length > 0;
      
      console.log("Validation check:", {
        districtCode,
        wardCode,
        wardText,
        hasWardsForDistrict,
        selectedDistrictName: selectedDistrict?.name,
        wardsCount: selectedDistrict?.wards?.length || 0,
      });
      
      if (hasWardsForDistrict) {
        // Nếu có dữ liệu chi tiết, phải chọn từ dropdown
        if (!wardCode || wardCode.trim() === "") {
          setError("Vui lòng chọn Phường/Xã từ danh sách");
          setLoading(false);
          return;
        }
        // Đảm bảo wardName được set từ wardCode
        const ward = selectedDistrict.wards.find((w) => w.code === wardCode);
        if (ward) {
          wardName = ward.name;
          console.log("Found ward from code:", wardName);
        } else {
          setError("Phường/Xã không hợp lệ. Vui lòng chọn lại.");
          setLoading(false);
          return;
        }
      } else {
        // Nếu không có dữ liệu chi tiết, phải nhập thủ công
        if (!wardText || wardText.trim() === "") {
          setError("Vui lòng nhập Phường/Xã");
          setLoading(false);
          return;
        }
        wardName = wardText.trim();
      }
      
      // Final check: wardName phải có giá trị
      if (!wardName || wardName.trim() === "") {
        setError("Vui lòng chọn hoặc nhập Phường/Xã");
        setLoading(false);
        return;
      }
      
      console.log("After validation - wardName:", wardName);

      const shippingAddress = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: provinceFull.name, // Backend yêu cầu 'city' không phải 'province'
        district: districtName.trim() || undefined,
        ward: wardName.trim() || undefined,
        provinceCode: provinceCode || undefined,
        districtCode: districtCode || undefined,
        wardCode: wardCode || undefined,
      };

      const orderPayload: any = {
        shippingAddress,
        paymentMethod,
        voucherCode: voucherCode || undefined,
        selectedItems: selectedItems.map((it) => ({
          productId: it.product._id,
          size: it.size,
          color: it.color,
        })),
      };

      if (note) {
        orderPayload.note = note;
      }

      if (needInvoice && invoiceInfo.companyName) {
        orderPayload.invoiceInfo = invoiceInfo;
        orderPayload.saveInvoiceInfo = saveInvoiceInfo;
      }

      if (paymentMethod === "COD") {
        await axiosClient.post("/api/orders", orderPayload);
        // Clear localStorage sau khi tạo đơn thành công
        localStorage.removeItem("cartNote");
        localStorage.removeItem("cartInvoiceInfo");
        localStorage.removeItem("cartNeedInvoice");
        localStorage.removeItem("cartSaveInvoiceInfo");
        localStorage.removeItem("cartSelectedKeys");
        navigate("/orders");
      } else if (paymentMethod === "MOMO") {
        const res = await axiosClient.post("/api/payments/momo", orderPayload);
        const payUrl: string | undefined = res.data?.data?.payUrl;
        if (payUrl) {
          // Clear localStorage trước khi redirect
          localStorage.removeItem("cartNote");
          localStorage.removeItem("cartInvoiceInfo");
          localStorage.removeItem("cartNeedInvoice");
          localStorage.removeItem("cartSaveInvoiceInfo");
          localStorage.removeItem("cartSelectedKeys");
          window.location.href = payUrl;
        } else {
          setError("Không nhận được liên kết thanh toán MoMo.");
        }
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAddresses) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-semibold">Thanh toán</h1>
        <p className="text-center text-slate-500">Đang tải...</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    // Nếu chưa có địa chỉ, sẽ redirect trong useEffect, nhưng vẫn render để tránh flash
    return null;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Thanh toán</h1>

      <form
        className="grid gap-6 md:grid-cols-[2fr,1fr]"
        onSubmit={handleSubmit}
      >
        <div className="space-y-4 rounded-lg border bg-white p-4 text-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Địa chỉ giao hàng</h2>
            <button
              type="button"
              onClick={() => navigate("/profile?tab=addresses")}
              className="text-xs text-accent hover:underline"
            >
              Quản lý địa chỉ
            </button>
          </div>

          {/* Chọn địa chỉ đã lưu */}
          {addresses.length > 0 && (
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useSavedAddress}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseSavedAddress(checked);
                    // Khi bật checkbox, tự động chọn địa chỉ mặc định hoặc địa chỉ đầu tiên
                    if (checked && selectedAddressIndex === null && addresses.length > 0) {
                      const defaultIndex = addresses.findIndex((addr) => addr.isDefault);
                      const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
                      setSelectedAddressIndex(indexToSelect);
                    }
                  }}
                  className="h-4 w-4"
                />
                Sử dụng địa chỉ đã lưu
              </label>
              {useSavedAddress && (
                <select
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                  value={selectedAddressIndex !== null ? selectedAddressIndex : ""}
                  onChange={(e) => {
                    const index = Number(e.target.value);
                    setSelectedAddressIndex(index);
                  }}
                >
                  {addresses.map((addr, index) => (
                    <option key={index} value={index}>
                      {addr.fullName} - {addr.phone} - {addr.street}, {addr.city}
                      {addr.isDefault ? " (Mặc định)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Form nhập địa chỉ */}
          <div>
            <label className="mb-1 block text-xs font-medium">Họ tên *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={useSavedAddress}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Số điện thoại *</label>
            <input
              type="tel"
              className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={useSavedAddress}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Địa chỉ (số nhà, đường) *
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Ví dụ: 123 Đường ABC"
              required
              disabled={useSavedAddress}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Tỉnh/Thành phố *</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              required
              disabled={useSavedAddress}
            >
              <option value="">Chọn Tỉnh/Thành phố</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Quận/Huyện *</label>
            {hasDistrictData ? (
              <select
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                value={districtCode}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("District selected:", value);
                  setDistrictCode(value);
                  setDistrictText("");
                }}
                required
                disabled={useSavedAddress || !provinceCode}
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                value={districtText}
                onChange={(e) => {
                  setDistrictText(e.target.value);
                  setDistrictCode("");
                }}
                placeholder="Nhập Quận/Huyện"
                required
                disabled={useSavedAddress || !provinceCode}
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Phường/Xã *</label>
            {hasWardData ? (
              <select
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                value={wardCode || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("Ward selected:", value, "Current districtCode:", districtCode);
                  setWardCode(value);
                  setWardText("");
                  // Force a small delay to ensure state is updated
                  setTimeout(() => {
                    console.log("After setWardCode - wardCode should be:", value);
                  }, 0);
                }}
                required
                disabled={useSavedAddress || !districtCode || !hasWardData}
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                value={wardText}
                onChange={(e) => {
                  setWardText(e.target.value);
                  setWardCode("");
                }}
                placeholder="Nhập Phường/Xã"
                required
                disabled={useSavedAddress || !provinceCode || (hasDistrictData && !districtCode)}
              />
            )}
          </div>

          <div className="mt-4">
            <h2 className="mb-2 text-base font-semibold">
              Phương thức thanh toán
            </h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payment"
                  value="MOMO"
                  checked={paymentMethod === "MOMO"}
                  onChange={() => setPaymentMethod("MOMO")}
                />
                Ví MoMo
              </label>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="mb-2 text-base font-semibold">Voucher</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border px-3 py-2 text-sm uppercase"
                placeholder="Mã giảm giá"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button
                type="button"
                onClick={handleValidateVoucher}
                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Áp dụng
              </button>
            </div>
            {discount > 0 && (
              <p className="mt-1 text-xs text-emerald-600">
                Đã áp dụng voucher, giảm{" "}
                {discount.toLocaleString("vi-VN")}
                đ.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-3 rounded-lg border bg-white p-4 text-sm">
          <h2 className="text-base font-semibold">Tóm tắt đơn</h2>
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span>{itemsPrice.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Phí vận chuyển</span>
            <span>{shippingFee.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Giảm giá</span>
            <span>-{discount.toLocaleString("vi-VN")}đ</span>
          </div>
          <hr />
          <div className="flex justify-between text-base font-semibold">
            <span>Tổng thanh toán</span>
            <span>
              {(itemsPrice + shippingFee - discount).toLocaleString("vi-VN")}đ
            </span>
          </div>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {loading ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
          </button>
        </aside>
      </form>
    </div>
  );
};

export default CheckoutPage;


