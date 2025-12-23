import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../../lib/axiosClient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "staff";
  avatarUrl?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/api/auth/login", payload);
      return res.data.data.user as AuthUser;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Đăng nhập thất bại";
      return rejectWithValue(message);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    payload: {
      name: string;
      email: string;
      password: string;
      gender?: "male" | "female" | "other";
      dateOfBirth?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosClient.post("/api/auth/register", payload);
      return res.data.data.user as AuthUser;
    } catch (error: any) {
      // Xử lý validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map((err: any) => {
            // Dịch các thông báo lỗi validation
            if (err.msg?.includes("email")) {
              return "Email không hợp lệ";
            }
            if (err.msg?.includes("password")) {
              return "Mật khẩu phải có ít nhất 6 ký tự";
            }
            if (err.msg?.includes("Name")) {
              return "Họ tên là bắt buộc";
            }
            if (err.msg?.includes("Gender")) {
              return "Giới tính không hợp lệ";
            }
            if (err.msg?.includes("Date")) {
              return "Ngày sinh không hợp lệ";
            }
            return err.msg || "Dữ liệu không hợp lệ";
          })
          .join(", ");
        return rejectWithValue(validationErrors);
      }
      const message = error.response?.data?.message || error.message || "Đăng ký thất bại";
      // Dịch các thông báo lỗi phổ biến
      if (message.includes("Email already registered") || message.includes("email")) {
        return rejectWithValue("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
      }
      return rejectWithValue(message);
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await axiosClient.post("/api/auth/logout");
});

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: { email: string }) => {
    const res = await axiosClient.post("/api/auth/forgot-password", payload);
    return res.data;
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: { email: string; otp: string; newPassword: string }) => {
    const res = await axiosClient.post("/api/auth/reset-password-otp", payload);
    return res.data;
  },
);

// Check authentication status on app load
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/users/me");
      return res.data.data as AuthUser;
    } catch (error: any) {
      // If 401 or any error, user is not authenticated
      return rejectWithValue(error.response?.status === 401 ? "Unauthorized" : "Failed to check auth");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // Sử dụng payload nếu có (từ rejectWithValue), nếu không thì dùng error.message
        state.error = (action.payload as string) || action.error.message || "Đăng nhập thất bại";
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        // Sử dụng payload nếu có (từ rejectWithValue), nếu không thì dùng error.message
        state.error = (action.payload as string) || action.error.message || "Đăng ký thất bại";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        // Don't set error for checkAuth rejection - it's normal if user is not logged in
      });
  },
});

export default authSlice.reducer;


