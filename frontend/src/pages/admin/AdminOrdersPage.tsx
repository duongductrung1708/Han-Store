import { useEffect, useState } from "react";
import { axiosClient } from "../../lib/axiosClient";
import { useToast } from "../../contexts/ToastContext";

interface Order {
  _id: string;
  user: string;
  items: any[];
  shippingAddress: any;
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  discount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

const AdminOrdersPage = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/api/orders");
      setOrders(res.data.data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      showError("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await axiosClient.put(`/api/orders/${orderId}/status`, { status: newStatus });
      showSuccess("Đã cập nhật trạng thái đơn hàng.");
      fetchOrders();
    } catch (error: any) {
      showError(error.response?.data?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "CONFIRMED", label: "Đã xác nhận" },
    { value: "SHIPPING", label: "Đang giao" },
    { value: "DELIVERED", label: "Đã giao" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Chờ xử lý",
      CONFIRMED: "Đã xác nhận",
      SHIPPING: "Đang giao",
      DELIVERED: "Đã giao",
      CANCELLED: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "bg-slate-100 text-slate-800",
      CONFIRMED: "bg-yellow-100 text-yellow-800",
      SHIPPING: "bg-blue-100 text-blue-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-slate-100 text-slate-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
        <p className="mt-1 text-sm text-slate-600">
          Xem và quản lý tất cả đơn hàng trong hệ thống
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">Lọc theo trạng thái:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-slate-500">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>{order.shippingAddress?.fullName || "N/A"}</div>
                      <div className="text-xs text-slate-500">
                        {order.shippingAddress?.phone || ""}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {order.items?.length || 0} sản phẩm
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {order.totalPrice?.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {order.paymentMethod === "COD" ? "COD" : "MoMo"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className={`rounded border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/20 ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {statusOptions
                          .filter((opt) => opt.value !== "all")
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
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

export default AdminOrdersPage;

