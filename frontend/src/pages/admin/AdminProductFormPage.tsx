import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Variant {
  size: string;
  color: string;
  stock: number;
}

const AdminProductFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    images: [] as string[],
    variants: [] as Variant[],
    categories: [] as string[],
    tags: [] as string[],
    isActive: true,
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newVariant, setNewVariant] = useState<Variant>({
    size: "",
    color: "",
    stock: 0,
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/api/categories");
      setCategories(res.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback: nếu API không có, để mảng rỗng
      setCategories([]);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/api/products/${id}`);
      const product = res.data.data;
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        salePrice: product.salePrice?.toString() || "",
        images: product.images?.map((img: any) => img.url) || [],
        variants: product.variants || [],
        categories: product.categories?.map((cat: any) => cat._id || cat) || [],
        tags: product.tags || [],
        isActive: product.isActive !== false,
      });
    } catch (error: any) {
      showError("Không thể tải thông tin sản phẩm.");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Vui lòng chọn file hình ảnh.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Kích thước file không được vượt quá 5MB.");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await axiosClient.post("/api/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, res.data.data.url],
        }));
        showSuccess("Đã upload hình ảnh thành công.");
        // Reset input
        e.target.value = "";
      }
    } catch (error: any) {
      showError(
        error.response?.data?.message || "Không thể upload hình ảnh. Vui lòng thử lại.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleAddVariant = () => {
    if (newVariant.size && newVariant.color) {
      setFormData({
        ...formData,
        variants: [...formData.variants, { ...newVariant }],
      });
      setNewVariant({ size: "", color: "", stock: 0 });
    }
  };

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const calculateTotalStock = () => {
    return formData.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.price) {
      showError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        images: formData.images.map((url) => ({ url })),
        totalStock: calculateTotalStock(),
      };

      if (isEdit) {
        await axiosClient.put(`/api/products/${id}`, payload);
        showSuccess("Đã cập nhật sản phẩm thành công.");
      } else {
        await axiosClient.post("/api/products", payload);
        showSuccess("Đã thêm sản phẩm thành công.");
      }

      navigate("/admin/products");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        (isEdit ? "Không thể cập nhật sản phẩm." : "Không thể thêm sản phẩm.");
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/products")}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isEdit
              ? "Cập nhật thông tin sản phẩm"
              : "Thêm sản phẩm mới vào hệ thống"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Thông tin cơ bản
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    placeholder="Nhập mô tả sản phẩm (có thể dùng HTML)"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Giá</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Giá gốc (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Giá khuyến mãi (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, salePrice: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Danh mục
              </h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            categories: [...formData.categories, category._id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            categories: formData.categories.filter(
                              (id) => id !== category._id,
                            ),
                          });
                        }
                      }}
                      className="rounded border-slate-300 text-black focus:ring-black/20"
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Images */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Hình ảnh
              </h2>
              <div className="space-y-4">
                {/* Toggle between URL and Upload */}
                <div className="flex gap-2 rounded-lg border border-slate-200 p-1">
                  <button
                    type="button"
                    onClick={() => setImageInputMode("url")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                      imageInputMode === "url"
                        ? "bg-black text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Nhập URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode("upload")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                      imageInputMode === "upload"
                        ? "bg-black text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Upload
                  </button>
                </div>

                {/* URL Input */}
                {imageInputMode === "url" && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                      placeholder="Nhập URL hình ảnh"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      disabled={!newImageUrl.trim()}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Thêm
                    </button>
                  </div>
                )}

                {/* Upload Input */}
                {imageInputMode === "upload" && (
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition-all duration-200 hover:border-black hover:bg-slate-100">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-8 w-8 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-medium text-slate-900">
                            Click để chọn file
                          </span>{" "}
                          hoặc kéo thả vào đây
                        </p>
                        <p className="text-xs text-slate-500">
                          PNG, JPG, WEBP (tối đa 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    {uploadingImage && (
                      <div className="text-center text-sm text-slate-600">
                        Đang upload...
                      </div>
                    )}
                  </div>
                )}

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Hình ảnh đã thêm ({formData.images.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="h-24 w-full rounded object-cover border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder.png";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute right-1 top-1 rounded bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                            title="Xóa hình ảnh"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Variants */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Biến thể (Size, Màu, Tồn kho)
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVariant.size}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size: e.target.value })
                    }
                    placeholder="Size"
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newVariant.color}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, color: e.target.value })
                    }
                    placeholder="Màu"
                    className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newVariant.stock}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Số lượng"
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-all duration-200"
                  >
                    Thêm
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>
                        {variant.size} / {variant.color} - {variant.stock} sản phẩm
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-700">
                  Tổng tồn kho: {calculateTotalStock()}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Tags</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Nhập tag và nhấn Enter"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Trạng thái</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-slate-300 text-black focus:ring-black/20"
                />
                <span>Sản phẩm đang hoạt động</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 border-t pt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductFormPage;

