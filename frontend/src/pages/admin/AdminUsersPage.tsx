import { useEffect, useState } from "react";
import { axiosClient } from "../../lib/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt: string;
}

const AdminUsersPage = () => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/api/users");
      setUsers(res.data.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      showError("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Quản trị viên",
      staff: "Nhân viên",
      user: "Người dùng",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      staff: "bg-blue-100 text-blue-800",
      user: "bg-slate-100 text-slate-800",
    };
    return colorMap[role] || "bg-slate-100 text-slate-800";
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
        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-slate-600">
          Xem và quản lý tất cả người dùng trong hệ thống
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Giới tính
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Ngày đăng ký
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                    {searchTerm ? "Không tìm thấy người dùng" : "Chưa có người dùng nào"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleColor(
                          user.role,
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {user.gender === "male"
                        ? "Nam"
                        : user.gender === "female"
                          ? "Nữ"
                          : user.gender === "other"
                            ? "Khác"
                            : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
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

export default AdminUsersPage;

