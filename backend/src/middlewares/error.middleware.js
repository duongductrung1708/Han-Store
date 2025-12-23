// Global 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error("=== Error Handler ===");
  console.error("Error:", err);
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack);
  console.error("Request URL:", req.originalUrl);
  console.error("Request method:", req.method);
  if (req.body) {
    console.error("Request body:", JSON.stringify(req.body, null, 2));
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};


