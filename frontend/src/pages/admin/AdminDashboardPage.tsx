import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import {
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: any[];
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { name: string; value: number }[];
  ordersByMonth: { month: string; orders: number }[];
}

const AdminDashboardPage = () => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    revenueByMonth: [],
    ordersByStatus: [],
    ordersByMonth: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes, usersRes] = await Promise.all([
          axiosClient.get("/api/orders"),
          axiosClient.get("/api/products?limit=1"),
          axiosClient.get("/api/users"),
        ]);

        const orders = ordersRes.data.data || [];
        const products = productsRes.data.data || [];
        const users = usersRes.data.data || [];

        // Tính tổng doanh thu từ các đơn hàng đã giao
        const deliveredOrders = orders.filter((order: any) => order.status === "DELIVERED");
        const revenue = deliveredOrders.reduce(
          (sum: number, order: any) => sum + (order.totalPrice || 0),
          0,
        );

        // Tính doanh thu theo tháng (7 tháng gần nhất)
        const monthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ];
        const revenueByMonthMap = new Map<string, number>();
        const ordersByMonthMap = new Map<string, number>();

        // Lấy 7 tháng gần nhất
        const now = new Date();
        const revenueByMonthData: { month: string; revenue: number }[] = [];
        const ordersByMonthData: { month: string; orders: number }[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const monthLabel = `${monthNames[date.getMonth()]}/${date.getFullYear()}`;
          revenueByMonthMap.set(monthKey, 0);
          ordersByMonthMap.set(monthKey, 0);
          revenueByMonthData.push({ month: monthLabel, revenue: 0 });
          ordersByMonthData.push({ month: monthLabel, orders: 0 });
        }

        // Tính doanh thu và đơn hàng theo tháng
        deliveredOrders.forEach((order: any) => {
          const orderDate = new Date(order.createdAt);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
          if (revenueByMonthMap.has(monthKey)) {
            const current = revenueByMonthMap.get(monthKey) || 0;
            revenueByMonthMap.set(monthKey, current + (order.totalPrice || 0));
          }
        });

        orders.forEach((order: any) => {
          const orderDate = new Date(order.createdAt);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
          if (ordersByMonthMap.has(monthKey)) {
            const current = ordersByMonthMap.get(monthKey) || 0;
            ordersByMonthMap.set(monthKey, current + 1);
          }
        });

        // Cập nhật dữ liệu từ Map
        revenueByMonthData.forEach((item, index) => {
          const monthKey = Array.from(revenueByMonthMap.keys())[index];
          item.revenue = revenueByMonthMap.get(monthKey) || 0;
        });

        ordersByMonthData.forEach((item, index) => {
          const monthKey = Array.from(ordersByMonthMap.keys())[index];
          item.orders = ordersByMonthMap.get(monthKey) || 0;
        });

        const revenueByMonth = revenueByMonthData;
        const ordersByMonth = ordersByMonthData;

        // Tính đơn hàng theo trạng thái
        const statusCount: Record<string, number> = {};
        orders.forEach((order: any) => {
          const status = order.status || "PENDING";
          statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const ordersByStatus = [
          { name: "Chờ xử lý", value: statusCount.PENDING || 0 },
          { name: "Đã xác nhận", value: statusCount.CONFIRMED || 0 },
          { name: "Đang giao", value: statusCount.SHIPPING || 0 },
          { name: "Đã giao", value: statusCount.DELIVERED || 0 },
          { name: "Đã hủy", value: statusCount.CANCELLED || 0 },
        ].filter((item) => item.value > 0);

        setStats({
          totalOrders: orders.length,
          totalProducts: products.total || products.length || 0,
          totalUsers: users.length || 0,
          totalRevenue: revenue,
          recentOrders: orders.slice(0, 5),
          revenueByMonth,
          ordersByStatus,
          ordersByMonth,
        });
      } catch (error: any) {
        console.error("Error fetching stats:", error);
        showError("Không thể tải thống kê. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [showError]);

  const statCards = [
    {
      title: "Tổng đơn hàng",
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: "bg-blue-500",
      link: "/admin/orders",
    },
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: CubeIcon,
      color: "bg-green-500",
      link: "/admin/products",
    },
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      icon: UsersIcon,
      color: "bg-purple-500",
      link: "/admin/users",
    },
    {
      title: "Tổng doanh thu",
      value: stats.totalRevenue.toLocaleString("vi-VN"),
      icon: CurrencyDollarIcon,
      color: "bg-yellow-500",
      suffix: "đ",
    },
  ];

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
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Thống kê và quản lý hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div
              className={`rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                stat.link ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stat.value}
                    {stat.suffix && (
                      <span className="ml-1 text-lg font-normal text-slate-600">
                        {stat.suffix}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );

          return stat.link ? (
            <Link key={stat.title} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={stat.title}>{content}</div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Doanh thu theo tháng
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString("vi-VN")}đ`,
                  "Doanh thu",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Doanh thu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status Chart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Đơn hàng theo trạng thái
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.ordersByStatus.map((entry, index) => {
                  const colors = [
                    "#94a3b8",
                    "#fbbf24",
                    "#3b82f6",
                    "#10b981",
                    "#ef4444",
                  ];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders by Month Chart */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Số lượng đơn hàng theo tháng
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.ordersByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#8b5cf6" name="Số đơn hàng" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Đơn hàng gần đây
            </h2>
            <Link
              to="/admin/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Xem tất cả →
            </Link>
          </div>
        </div>
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
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {order.shippingAddress?.fullName || "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {order.totalPrice?.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          order.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : order.status === "SHIPPING"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "CONFIRMED"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {order.status === "DELIVERED"
                          ? "Đã giao"
                          : order.status === "SHIPPING"
                            ? "Đang giao"
                            : order.status === "CONFIRMED"
                              ? "Đã xác nhận"
                              : order.status === "CANCELLED"
                                ? "Đã hủy"
                                : "Chờ xử lý"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
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

export default AdminDashboardPage;
