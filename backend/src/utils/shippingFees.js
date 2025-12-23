/**
 * Bảng phí ship theo tỉnh/thành phố
 * Trụ sở đặt tại Hà Nội (provinceCode: "1" hoặc "01")
 */

const SHIPPING_FEES = {
  // Hà Nội - phí thấp nhất
  "1": 20000,
  "01": 20000,
  
  // Các tỉnh/thành phố lân cận Hà Nội
  "27": 25000, // Bắc Ninh
  "33": 25000, // Hưng Yên
  "30": 25000, // Hải Dương
  "26": 25000, // Vĩnh Phúc
  "19": 25000, // Thái Nguyên
  "24": 25000, // Bắc Giang
  
  // Miền Bắc
  "22": 30000, // Quảng Ninh
  "31": 30000, // Hải Phòng
  "36": 30000, // Nam Định
  "34": 30000, // Thái Bình
  "35": 30000, // Hà Nam
  "37": 30000, // Ninh Bình
  
  // Miền Trung
  "38": 35000, // Thanh Hóa
  "40": 40000, // Nghệ An
  "42": 40000, // Hà Tĩnh
  "44": 45000, // Quảng Bình
  "45": 45000, // Quảng Trị
  "46": 45000, // Thừa Thiên Huế
  "48": 50000, // Đà Nẵng
  "49": 50000, // Quảng Nam
  "51": 50000, // Quảng Ngãi
  "52": 50000, // Bình Định
  "54": 50000, // Phú Yên
  "56": 50000, // Khánh Hòa
  
  // Miền Nam
  "79": 60000, // TP. Hồ Chí Minh
  "75": 55000, // Đồng Nai
  "74": 55000, // Bình Dương
  "72": 55000, // Tây Ninh
  "70": 55000, // Bình Phước
  "80": 55000, // Long An
  "82": 60000, // Tiền Giang
  "83": 60000, // Bến Tre
  "84": 60000, // Trà Vinh
  "86": 60000, // Vĩnh Long
  "87": 60000, // Đồng Tháp
  "89": 60000, // An Giang
  "96": 65000, // Cà Mau
  "91": 65000, // Kiên Giang
  "95": 65000, // Bạc Liêu
  "94": 65000, // Sóc Trăng
  "93": 65000, // Hậu Giang
};

const SHIPPING_FEE_DEFAULT = 35000; // VNĐ

/**
 * Tính phí ship dựa trên province code
 * @param {string|null|undefined} provinceCode - Mã tỉnh/thành phố
 * @returns {number} Phí ship (VNĐ)
 */
export const getShippingFee = (provinceCode) => {
  if (!provinceCode) {
    return SHIPPING_FEE_DEFAULT;
  }
  
  // Chuyển đổi sang string và loại bỏ khoảng trắng
  const code = String(provinceCode).trim();
  
  // Kiểm tra trong bảng phí ship
  if (SHIPPING_FEES[code]) {
    return SHIPPING_FEES[code];
  }
  
  // Phí mặc định cho các tỉnh chưa có trong bảng
  return SHIPPING_FEE_DEFAULT;
};

