import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type { Product } from "../../features/products/productSlice";

const AdminProductsPage = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/api/products?limit=100");
      setProducts(res.data.data?.products || res.data.data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      showError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      await axiosClient.delete(`/api/products/${id}`);
      showSuccess("Đã xóa sản phẩm thành công.");
      fetchProducts();
    } catch (error: any) {
      showError(error.response?.data?.message || "Không thể xóa sản phẩm.");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý và chỉnh sửa sản phẩm trong hệ thống
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm sản phẩm
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
        />
      </div>

      {/* Products Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Hình ảnh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                    {searchTerm ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <img
                        src={product.images?.[0]?.url || "/placeholder.png"}
                        alt={product.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500">{product.slug}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      {product.salePrice ? (
                        <>
                          <span className="text-red-600">
                            {product.salePrice.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="ml-2 text-xs text-slate-500 line-through">
                            {product.price.toLocaleString("vi-VN")}đ
                          </span>
                        </>
                      ) : (
                        <span>{product.price.toLocaleString("vi-VN")}đ</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {product.totalStock || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          product.isDeleted
                            ? "bg-red-100 text-red-800"
                            : product.totalStock && product.totalStock > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.isDeleted
                          ? "Đã xóa"
                          : product.totalStock && product.totalStock > 0
                            ? "Còn hàng"
                            : "Hết hàng"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;

