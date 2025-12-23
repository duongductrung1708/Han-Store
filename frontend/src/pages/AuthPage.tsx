import { FormEvent, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  login,
  register,
  forgotPassword,
  resetPassword,
} from "../features/auth/authSlice";
import PasswordInput from "../components/ui/PasswordInput";

const AuthPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, user, error: authError } = useAppSelector((s) => s.auth);

  // Lấy trang trước đó từ location.state
  const from = (location.state as { from?: string })?.from || "/";
  const [mode, setMode] = useState<
    "login" | "register" | "forgot-password" | "reset-password"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("rememberMe");
      return saved === "true";
    } catch {
      return false;
    }
  });

  // Redirect về trang trước đó khi đăng nhập/đăng ký thành công
  useEffect(() => {
    if (user) {
      // Clear errors khi đăng nhập/đăng ký thành công
      setError(null);
      setMessage(null);
      // Delay một chút để đảm bảo state đã được cập nhật
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, navigate, from]);

  // Hiển thị error từ Redux state
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validation phía client
    if (mode === "login") {
      if (!email || !password) {
        setError("Vui lòng nhập đầy đủ email và mật khẩu.");
        return;
      }
      if (!email.includes("@")) {
        setError("Email không hợp lệ. Vui lòng nhập đúng định dạng email.");
        return;
      }
      try {
        await dispatch(login({ email, password })).unwrap();
        try {
          localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
        } catch {
          // ignore
        }
      } catch (err: any) {
        // Error đã được xử lý trong authSlice, chỉ cần set error từ state
        setError(
          err || "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu."
        );
      }
    } else if (mode === "register") {
      if (!name || !email || !password) {
        setError(
          "Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Mật khẩu)."
        );
        return;
      }
      if (!email.includes("@")) {
        setError("Email không hợp lệ. Vui lòng nhập đúng định dạng email.");
        return;
      }
      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      try {
        await dispatch(
          register({
            name,
            email,
            password,
            gender: gender || undefined,
            dateOfBirth: dateOfBirth || undefined,
          })
        ).unwrap();
      } catch (err: any) {
        // Error đã được xử lý trong authSlice, chỉ cần set error từ state
        setError(err || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } else if (mode === "forgot-password") {
      try {
        await dispatch(forgotPassword({ email })).unwrap();
        setMessage(
          "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
        );
        setMode("reset-password");
      } catch (err: any) {
        setError(err?.message || "Không thể gửi OTP. Vui lòng thử lại.");
      }
    } else if (mode === "reset-password") {
      if (newPassword !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
      if (newPassword.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      try {
        await dispatch(resetPassword({ email, otp, newPassword })).unwrap();
        setMessage("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        setTimeout(() => {
          setMode("login");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      } catch (err: any) {
        setError(err?.message || "OTP không hợp lệ hoặc đã hết hạn.");
      }
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "Đăng nhập";
      case "register":
        return "Đăng ký";
      case "forgot-password":
        return "Quên mật khẩu";
      case "reset-password":
        return "Đặt lại mật khẩu";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">{getTitle()}</h1>

      {message && (
        <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {(error || authError) && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Có lỗi xảy ra:</p>
              <p className="mt-1">{error || authError}</p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Họ tên</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Giới tính
              </label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
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
            <div>
              <label className="mb-1 block text-sm font-medium">
                Ngày sinh
              </label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {(mode === "login" || mode === "register") && (
          <PasswordInput
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        )}

        {mode === "login" && (
          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
          </div>
        )}

        {mode === "reset-password" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Mã OTP (6 số)
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Nhập mã OTP"
                required
                maxLength={6}
              />
            </div>
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
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-black px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading
            ? "Đang xử lý..."
            : mode === "login"
            ? "Đăng nhập"
            : mode === "register"
            ? "Đăng ký"
            : mode === "forgot-password"
            ? "Gửi mã OTP"
            : "Đặt lại mật khẩu"}
        </button>
      </form>

      <div className="mt-3 space-y-2 text-center text-xs text-slate-600">
        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setMessage(null);
              }}
              className="block w-full hover:text-accent"
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("forgot-password");
                setError(null);
                setMessage(null);
              }}
              className="block w-full hover:text-accent"
            >
              Quên mật khẩu?
            </button>
          </>
        )}

        {mode === "register" && (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setMessage(null);
              }}
              className="block w-full hover:text-accent"
            >
              Đã có tài khoản? Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("forgot-password");
                setError(null);
                setMessage(null);
              }}
              className="block w-full hover:text-accent"
            >
              Quên mật khẩu?
            </button>
          </>
        )}

        {(mode === "forgot-password" || mode === "reset-password") && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
              setOtp("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="block w-full hover:text-accent"
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
