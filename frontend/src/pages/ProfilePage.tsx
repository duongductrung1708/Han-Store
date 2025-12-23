import { useEffect, useState, FormEvent, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { axiosClient } from "../lib/axiosClient";
import PasswordInput from "../components/ui/PasswordInput";
import { useToast } from "../contexts/ToastContext";
import {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  vietnamAddresses,
} from "../data/vietnamAddresses";
import {
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  ward?: string;
  district?: string;
  city: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  isDefault: boolean;
}

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tabFromUrl = searchParams.get("tab") as "profile" | "password" | "addresses" | null;
  const from = (location.state as { from?: string })?.from;
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "addresses">(
    tabFromUrl || "profile",
  );

  // Cập nhật tab khi URL thay đổi
  useEffect(() => {
    if (tabFromUrl && ["profile", "password", "addresses"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Profile state
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: "",
    phone: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    provinceCode: "",
    districtCode: "",
    wardCode: "",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const provinces = getProvinces();
  const districts = addressForm.provinceCode
    ? getDistrictsByProvince(addressForm.provinceCode)
    : [];
  const wards =
    addressForm.provinceCode && addressForm.districtCode
      ? getWardsByDistrict(addressForm.provinceCode, addressForm.districtCode)
      : [];
  
  // Kiểm tra xem tỉnh có dữ liệu chi tiết không
  const hasDistrictData = districts.length > 0;
  const hasWardData = wards.length > 0;

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/users/me");
        const userData = res.data.data;
        setName(userData.name || "");
        setGender(userData.gender || "");
        setDateOfBirth(
          userData.dateOfBirth
            ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
            : "",
        );
        setAvatarUrl(userData.avatarUrl || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (user) {
      fetchProfile();
      fetchAddresses();
    }
  }, [user]);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await axiosClient.get("/api/users/me/addresses");
      setAddresses(res.data.data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const res = await axiosClient.put("/api/users/me", {
        name,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      setProfileMessage("Cập nhật thông tin thành công!");
      // Update Redux store if needed
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (error: any) {
      setProfileError(
        error.response?.data?.message || "Không thể cập nhật thông tin. Vui lòng thử lại.",
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Vui lòng chọn file hình ảnh");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const res = await axiosClient.post("/api/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url;
      if (url) {
        setAvatarUrl(url);
        showSuccess("Đã tải ảnh đại diện");
      } else {
        showError("Không lấy được URL ảnh. Vui lòng thử lại.");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Không thể tải ảnh. Vui lòng thử lại hoặc nhập URL thủ công.";
      showError(msg);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Change password
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setChangingPassword(true);
    try {
      await axiosClient.put("/api/users/me/password", {
        currentPassword,
        newPassword,
      });
      setPasswordMessage("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Save address
  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const editingIndex = editingAddress
        ? addresses.findIndex(
            (addr, idx) =>
              addr.fullName === editingAddress.fullName &&
              addr.phone === editingAddress.phone &&
              addr.street === editingAddress.street,
          )
        : null;

      // Validate required fields
      if (!addressForm.provinceCode) {
        showError("Vui lòng chọn Tỉnh/Thành phố");
        setSavingAddress(false);
        return;
      }

      // Lấy tên từ codes hoặc sử dụng giá trị nhập thủ công
      // Lấy từ vietnamAddresses để có đầy đủ dữ liệu districts
      const provinceFull = vietnamAddresses.find((p) => p.code === addressForm.provinceCode);
      if (!provinceFull) {
        showError("Tỉnh/Thành phố không hợp lệ");
        setSavingAddress(false);
        return;
      }

      let districtName = addressForm.district || "";
      let wardName = addressForm.ward || "";
      
      console.log("Address form:", {
        districtCode: addressForm.districtCode,
        wardCode: addressForm.wardCode,
        district: addressForm.district,
        ward: addressForm.ward,
        provinceDistricts: provinceFull.districts?.length || 0,
      });
      
      // Chỉ lấy từ code nếu tỉnh có dữ liệu chi tiết
      if (addressForm.districtCode && provinceFull.districts && provinceFull.districts.length > 0) {
        const district = provinceFull.districts.find((d) => d.code === addressForm.districtCode);
        if (district) {
          districtName = district.name;
          console.log("Found district from code:", districtName);
        } else {
          console.log("District not found for code:", addressForm.districtCode);
        }
      } else if (addressForm.districtCode) {
        // Nếu có districtCode nhưng tỉnh không có dữ liệu chi tiết
        console.log("Province has no districts data, using manual input");
      }
      
      if (addressForm.wardCode && addressForm.districtCode && provinceFull.districts && provinceFull.districts.length > 0) {
        const district = provinceFull.districts.find((d) => d.code === addressForm.districtCode);
        if (district && district.wards && district.wards.length > 0) {
          const ward = district.wards.find((w) => w.code === addressForm.wardCode);
          if (ward) {
            wardName = ward.name;
            console.log("Found ward from code:", wardName);
          } else {
            console.log("Ward not found for code:", addressForm.wardCode);
          }
        }
      }

      console.log("Final districtName:", districtName, "wardName:", wardName);

      // Validate district and ward
      if (!districtName || districtName.trim() === "") {
        showError("Vui lòng chọn hoặc nhập Quận/Huyện");
        setSavingAddress(false);
        return;
      }

      if (!wardName || wardName.trim() === "") {
        showError("Vui lòng chọn hoặc nhập Phường/Xã");
        setSavingAddress(false);
        return;
      }

      // Đảm bảo city không rỗng
      const cityName = provinceFull.name || "";
      if (!cityName) {
        showError("Không thể xác định tên tỉnh/thành phố");
        setSavingAddress(false);
        return;
      }

      const addressData = {
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        street: addressForm.street.trim(),
        city: cityName,
        district: districtName.trim() || undefined,
        ward: wardName.trim() || undefined,
        provinceCode: addressForm.provinceCode,
        districtCode: addressForm.districtCode || undefined,
        wardCode: addressForm.wardCode || undefined,
        isDefault: addressForm.isDefault || false,
      };
      
      // Validate các trường required
      if (!addressData.fullName || !addressData.phone || !addressData.street || !addressData.city) {
        showError("Vui lòng điền đầy đủ thông tin bắt buộc");
        setSavingAddress(false);
        return;
      }

      console.log("Sending address data:", addressData);
      
      const res = await axiosClient.post("/api/users/me/addresses", {
        addressIndex: editingIndex !== -1 ? editingIndex : null,
        ...addressData,
      });
      
      console.log("Address saved successfully:", res.data);
      
      await fetchAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        fullName: "",
        phone: "",
        street: "",
        ward: "",
        district: "",
        city: "",
        provinceCode: "",
        districtCode: "",
        wardCode: "",
        isDefault: false,
      });
      showSuccess("Đã lưu địa chỉ thành công!");
      
      // Nếu đến từ checkout và đã có địa chỉ, quay lại checkout
      if (from === "/checkout" && res.data.data && res.data.data.length > 0) {
        setTimeout(() => {
          navigate("/checkout", { replace: true });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving address:", error);
      console.error("Error response:", error.response?.data);
      
      // Hiển thị lỗi chi tiết hơn
      let errorMessage = "Không thể lưu địa chỉ. Vui lòng thử lại.";
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          // Nếu có nhiều lỗi validation
          const errorMessages = error.response.data.errors.map((err: any) => err.msg || err.message).join(", ");
          errorMessage = errorMessages || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (index: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

    try {
      await axiosClient.delete(`/api/users/me/addresses/${index}`);
      await fetchAddresses();
      showSuccess("Đã xóa địa chỉ thành công!");
    } catch (error: any) {
      showError(error.response?.data?.message || "Không thể xóa địa chỉ. Vui lòng thử lại.");
    }
  };

  // Edit address
  const handleEditAddress = (address: Address, index: number) => {
    setEditingAddress({ ...address, _id: index.toString() });
    setAddressForm({ ...address });
    setShowAddressForm(true);
  };

  // Add new address
  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: "",
      phone: "",
      street: "",
      ward: "",
      district: "",
      city: "",
      provinceCode: "",
      districtCode: "",
      wardCode: "",
      isDefault: addresses.length === 0, // Set as default if no addresses
    });
    setShowAddressForm(true);
  };

  // Reset district và ward khi province thay đổi
  useEffect(() => {
    if (!addressForm.provinceCode) {
      setAddressForm((prev) => ({ ...prev, districtCode: "", wardCode: "" }));
    }
  }, [addressForm.provinceCode]);

  // Reset ward khi district thay đổi
  useEffect(() => {
    if (!addressForm.districtCode) {
      setAddressForm((prev) => ({ ...prev, wardCode: "" }));
    }
  }, [addressForm.districtCode]);

  if (!user) {
    return (
      <div className="text-center">
        <p>Vui lòng đăng nhập để xem thông tin cá nhân.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <h1 className="mb-6 text-center text-2xl font-bold">Tài khoản của tôi</h1>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "border-black text-black"
                  : "border-transparent text-slate-600 hover:text-black"
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "password"
                  ? "border-black text-black"
                  : "border-transparent text-slate-600 hover:text-black"
              }`}
            >
              Đổi mật khẩu
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "addresses"
                  ? "border-black text-black"
                  : "border-transparent text-slate-600 hover:text-black"
              }`}
            >
              Địa chỉ giao hàng
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Thông tin cá nhân</h2>

          {profileMessage && (
            <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              {profileMessage}
            </div>
          )}

          {profileError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircleIcon className="h-full w-full text-slate-400" />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ảnh đại diện</label>
                <input
                  type="url"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? "Đang tải..." : "Tải ảnh lên"}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    className="hidden"
                    onChange={(e) => handleAvatarFileChange(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-slate-500">Hoặc dán URL vào ô bên trên</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium">Họ tên *</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full rounded-md border bg-slate-50 px-3 py-2 text-sm"
                value={user.email}
                disabled
              />
              <p className="mt-1 text-xs text-slate-500">Email không thể thay đổi</p>
            </div>

            {/* Gender */}
            <div>
              <label className="mb-1 block text-sm font-medium">Giới tính</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "male" | "female" | "other" | "")
                }
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1 block text-sm font-medium">Ngày sinh</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {updatingProfile ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </button>
          </form>
        </div>
      )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h2>

          {passwordMessage && (
            <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              {passwordMessage}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordInput
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <PasswordInput
              label="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />

            <PasswordInput
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {changingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>
      )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
            <button
              onClick={handleAddAddress}
              className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            >
              <PlusIcon className="h-4 w-4" />
              Thêm địa chỉ
            </button>
          </div>

          {/* Address Form */}
          {showAddressForm && (
            <div className="mb-6 rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-base font-semibold">
                {editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
              </h3>
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Họ tên *</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={addressForm.fullName}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Địa chỉ (số nhà, đường) *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    value={addressForm.street}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, street: e.target.value })
                    }
                    placeholder="Ví dụ: 123 Đường ABC"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Tỉnh/Thành phố *</label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    value={addressForm.provinceCode || ""}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, provinceCode: e.target.value, districtCode: "", wardCode: "" })
                    }
                    required
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
                  <label className="mb-1 block text-sm font-medium">Quận/Huyện *</label>
                  {hasDistrictData ? (
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                      value={addressForm.districtCode || ""}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, districtCode: e.target.value, wardCode: "" })
                      }
                      required
                      disabled={!addressForm.provinceCode}
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
                      value={addressForm.district || ""}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, district: e.target.value, districtCode: "" })
                      }
                      placeholder="Nhập Quận/Huyện"
                      required
                      disabled={!addressForm.provinceCode}
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Phường/Xã *</label>
                  {hasWardData ? (
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                      value={addressForm.wardCode || ""}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, wardCode: e.target.value })
                      }
                      required
                      disabled={!addressForm.districtCode}
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
                      value={addressForm.ward || ""}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, ward: e.target.value, wardCode: "" })
                      }
                      placeholder="Nhập Phường/Xã"
                      required
                      disabled={!addressForm.provinceCode || (hasDistrictData && !addressForm.districtCode)}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, isDefault: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="isDefault" className="text-sm">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {savingAddress ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses List */}
          {loadingAddresses ? (
            <div className="text-center text-slate-500">Đang tải...</div>
          ) : addresses.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center text-slate-500">
              Chưa có địa chỉ nào. Hãy thêm địa chỉ mới.
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address, index) => (
                <div key={index} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {address.isDefault && (
                        <span className="mb-2 inline-block rounded-full bg-black px-2 py-1 text-xs font-semibold text-white">
                          Mặc định
                        </span>
                      )}
                      <p className="font-semibold">{address.fullName}</p>
                      <p className="text-sm text-slate-600">{address.phone}</p>
                      <p className="text-sm text-slate-600">
                        {address.street}
                        {(() => {
                          // Sử dụng dữ liệu đã lưu trực tiếp (district, ward, city)
                          // Nếu không có, thử lấy từ code
                          if (address.district || address.ward || address.city) {
                            return (
                              <>
                                {address.ward && <>, {address.ward}</>}
                                {address.district && <>, {address.district}</>}
                                {address.city && <>, {address.city}</>}
                              </>
                            );
                          }
                          
                          // Fallback: lấy từ code nếu có
                          if (address.provinceCode) {
                            const provinceFull = vietnamAddresses.find((p) => p.code === address.provinceCode);
                            if (provinceFull) {
                              let districtName = "";
                              let wardName = "";
                              
                              if (address.districtCode && provinceFull.districts && provinceFull.districts.length > 0) {
                                const district = provinceFull.districts.find((d) => d.code === address.districtCode);
                                if (district) {
                                  districtName = district.name;
                                  if (address.wardCode && district.wards && district.wards.length > 0) {
                                    const ward = district.wards.find((w) => w.code === address.wardCode);
                                    if (ward) {
                                      wardName = ward.name;
                                    }
                                  }
                                }
                              }
                              
                              return (
                                <>
                                  {wardName && <>, {wardName}</>}
                                  {districtName && <>, {districtName}</>}
                                  <>, {provinceFull.name}</>
                                </>
                              );
                            }
                          }
                          
                          return null;
                        })()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAddress(address, index)}
                        className="rounded-md border p-2 hover:bg-slate-100"
                        aria-label="Sửa địa chỉ"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(index)}
                        className="rounded-md border p-2 text-red-600 hover:bg-red-50"
                        aria-label="Xóa địa chỉ"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
