/**
 * Bảng phí ship theo tỉnh/thành phố
 * Trụ sở đặt tại Hà Nội (provinceCode: "1")
 */

export interface ShippingFee {
  provinceCode: string;
  fee: number; // VNĐ
}

// Bảng phí ship theo khoảng cách từ Hà Nội
export const SHIPPING_FEES: ShippingFee[] = [
  // Hà Nội - phí thấp nhất (có thể là "01" hoặc "1")
  { provinceCode: "01", fee: 20000 },
  { provinceCode: "1", fee: 20000 },
  
  // Các tỉnh/thành phố lân cận Hà Nội (Bắc Ninh, Hưng Yên, Hải Dương, Vĩnh Phúc, Thái Nguyên, Bắc Giang)
  { provinceCode: "27", fee: 25000 }, // Bắc Ninh
  { provinceCode: "33", fee: 25000 }, // Hưng Yên
  { provinceCode: "30", fee: 25000 }, // Hải Dương
  { provinceCode: "26", fee: 25000 }, // Vĩnh Phúc
  { provinceCode: "19", fee: 25000 }, // Thái Nguyên
  { provinceCode: "24", fee: 25000 }, // Bắc Giang
  
  // Miền Bắc (Quảng Ninh, Hải Phòng, Nam Định, Thái Bình, Hà Nam, Ninh Bình)
  { provinceCode: "22", fee: 30000 }, // Quảng Ninh
  { provinceCode: "31", fee: 30000 }, // Hải Phòng
  { provinceCode: "36", fee: 30000 }, // Nam Định
  { provinceCode: "34", fee: 30000 }, // Thái Bình
  { provinceCode: "35", fee: 30000 }, // Hà Nam
  { provinceCode: "37", fee: 30000 }, // Ninh Bình
  
  // Miền Trung (Thanh Hóa, Nghệ An, Hà Tĩnh, Quảng Bình, Quảng Trị, Thừa Thiên Huế)
  { provinceCode: "38", fee: 35000 }, // Thanh Hóa
  { provinceCode: "40", fee: 40000 }, // Nghệ An
  { provinceCode: "42", fee: 40000 }, // Hà Tĩnh
  { provinceCode: "44", fee: 45000 }, // Quảng Bình
  { provinceCode: "45", fee: 45000 }, // Quảng Trị
  { provinceCode: "46", fee: 45000 }, // Thừa Thiên Huế
  
  // Miền Trung (Đà Nẵng, Quảng Nam, Quảng Ngãi, Bình Định, Phú Yên, Khánh Hòa)
  { provinceCode: "48", fee: 50000 }, // Đà Nẵng
  { provinceCode: "49", fee: 50000 }, // Quảng Nam
  { provinceCode: "51", fee: 50000 }, // Quảng Ngãi
  { provinceCode: "52", fee: 50000 }, // Bình Định
  { provinceCode: "54", fee: 50000 }, // Phú Yên
  { provinceCode: "56", fee: 50000 }, // Khánh Hòa
  
  // Miền Nam (TP. Hồ Chí Minh, Đồng Nai, Bình Dương, Tây Ninh, Bình Phước, Long An)
  { provinceCode: "79", fee: 60000 }, // TP. Hồ Chí Minh
  { provinceCode: "75", fee: 55000 }, // Đồng Nai
  { provinceCode: "74", fee: 55000 }, // Bình Dương
  { provinceCode: "72", fee: 55000 }, // Tây Ninh
  { provinceCode: "70", fee: 55000 }, // Bình Phước
  { provinceCode: "80", fee: 55000 }, // Long An
  
  // Đồng bằng sông Cửu Long (Tiền Giang, Bến Tre, Trà Vinh, Vĩnh Long, Đồng Tháp, An Giang)
  { provinceCode: "82", fee: 60000 }, // Tiền Giang
  { provinceCode: "83", fee: 60000 }, // Bến Tre
  { provinceCode: "84", fee: 60000 }, // Trà Vinh
  { provinceCode: "86", fee: 60000 }, // Vĩnh Long
  { provinceCode: "87", fee: 60000 }, // Đồng Tháp
  { provinceCode: "89", fee: 60000 }, // An Giang
  
  // Các tỉnh xa khác (Cà Mau, Kiên Giang, Bạc Liêu, Sóc Trăng, Hậu Giang)
  { provinceCode: "96", fee: 65000 }, // Cà Mau
  { provinceCode: "91", fee: 65000 }, // Kiên Giang
  { provinceCode: "95", fee: 65000 }, // Bạc Liêu
  { provinceCode: "94", fee: 65000 }, // Sóc Trăng
  { provinceCode: "93", fee: 65000 }, // Hậu Giang
];

/**
 * Tính phí ship dựa trên province code
 * @param provinceCode - Mã tỉnh/thành phố
 * @returns Phí ship (VNĐ), mặc định 35000 nếu không tìm thấy
 */
export const getShippingFee = (provinceCode: string | null | undefined): number => {
  if (!provinceCode) {
    return 35000; // Phí mặc định
  }
  
  // Chuyển đổi sang string và loại bỏ khoảng trắng
  const code = String(provinceCode).trim();
  
  // Tìm trong bảng phí ship
  const shippingFee = SHIPPING_FEES.find((sf) => sf.provinceCode === code);
  if (shippingFee) {
    return shippingFee.fee;
  }
  
  // Phí mặc định cho các tỉnh chưa có trong bảng
  return 35000;
};

/**
 * Lấy danh sách tất cả các province code đã có phí ship
 */
export const getProvinceCodesWithShippingFee = (): string[] => {
  return SHIPPING_FEES.map((sf) => sf.provinceCode);
};

