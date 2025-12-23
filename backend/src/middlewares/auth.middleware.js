import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Xác thực dựa trên JWT Access Token (ưu tiên từ cookie, fallback Authorization header)
export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  }
};

// Kiểm tra role (admin/staff)
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }
    return next();
  };
};


