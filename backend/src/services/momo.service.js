import crypto from "crypto";
import axios from "axios";

// Helper tạo chữ ký HMAC SHA256 cho MoMo
const signRequest = (rawSignature, secretKey) => {
  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
};

// Tạo request thanh toán tới MoMo và trả về payUrl
export const createMomoPayment = async ({
  amount,
  orderId,
  orderInfo,
}) => {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const endpoint = process.env.MOMO_ENDPOINT;
  const returnUrl = process.env.MOMO_RETURN_URL;
  const ipnUrl = process.env.MOMO_IPN_URL;

  // Kiểm tra các biến môi trường
  if (!partnerCode || !accessKey || !secretKey || !endpoint || !returnUrl || !ipnUrl) {
    throw new Error("MoMo environment variables are not configured. Please check MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_ENDPOINT, MOMO_RETURN_URL, MOMO_IPN_URL");
  }

  const requestId = `${orderId}-${Date.now()}`;
  const requestType = "captureWallet";
  const extraData = "";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = signRequest(rawSignature, secretKey);

  const payload = {
    partnerCode,
    accessKey,
    requestId,
    amount: String(amount),
    orderId: String(orderId),
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  };

  try {
    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (error) {
    console.error("MoMo API Error:", error.response?.data || error.message);
    throw new Error(`Failed to create MoMo payment: ${error.response?.data?.message || error.message}`);
  }
};


