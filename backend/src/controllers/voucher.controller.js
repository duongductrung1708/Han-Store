import { Voucher } from "../models/voucher.model.js";

// Admin: tạo / cập nhật / list voucher
export const createVoucher = async (req, res, next) => {
  try {
    const payload = req.body;
    const voucher = await Voucher.create(payload);
    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    next(error);
  }
};

export const updateVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const voucher = await Voucher.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Voucher not found" });
    }
    res.json({ success: true, data: voucher });
  } catch (error) {
    next(error);
  }
};

export const listVouchers = async (req, res, next) => {
  try {
    const vouchers = await Voucher.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: vouchers });
  } catch (error) {
    next(error);
  }
};

// Public: check code
export const validateVoucherCode = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isDeleted: false,
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
    });

    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Voucher not found or expired" });
    }

    const canUse =
      !voucher.minOrderValue || orderAmount >= voucher.minOrderValue;

    res.json({
      success: true,
      data: {
        voucher,
        canUse,
      },
    });
  } catch (error) {
    next(error);
  }
};


