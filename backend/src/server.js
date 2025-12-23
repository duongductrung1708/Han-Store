import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import voucherRoutes from "./routes/voucher.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

dotenv.config();

const app = express();

// Basic security & parsing middlewares
app.use(helmet());
app.use(xss());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() }),
);

// Root route handler (for Render health checks)
app.get("/", (req, res) =>
  res.json({
    message: "Han Store API",
    status: "OK",
    timestamp: new Date().toISOString(),
  }),
);

app.head("/", (req, res) => res.status(200).end());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);

// 404 & error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only after DB connection
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`API server running on port ${PORT}`),
    );
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to connect DB, shutting down.", err);
    process.exit(1);
  });

export default app;


