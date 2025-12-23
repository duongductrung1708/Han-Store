import { validationResult } from "express-validator";
import { User } from "../models/user.model.js";

export const getProfile = async (req, res, next) => {
  try {
    // req.user được set bởi protect middleware, nhưng chỉ có id và role
    // Cần fetch full user data từ database
    const user = await User.findById(req.user.id).select("-password -refreshToken -otpCode -otpExpiresAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Format user data giống như trong auth controller
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
    };
    
    res.json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, avatarUrl, gender, dateOfBirth, invoiceInfo } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (invoiceInfo !== undefined) updateData.invoiceInfo = invoiceInfo;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true },
    ).select("-password -refreshToken -otpCode -otpExpiresAt");

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const upsertAddress = async (req, res, next) => {
  try {
    const { addressIndex, ...addressData } = req.body;
    const user = await User.findById(req.user.id);

    if (addressIndex !== undefined && addressIndex !== null) {
      // Update existing address by index
      const idx = parseInt(addressIndex, 10);
      if (idx < 0 || idx >= user.addresses.length) {
        return res
          .status(404)
          .json({ success: false, message: "Address not found" });
      }
      // Update address fields
      Object.assign(user.addresses[idx], addressData);
    } else {
      // Add new address
      user.addresses.push(addressData);
    }

    // If setting as default, unset others
    if (addressData.isDefault) {
      const targetIndex =
        addressIndex !== undefined && addressIndex !== null
          ? parseInt(addressIndex, 10)
          : user.addresses.length - 1;
      user.addresses.forEach((addr, index) => {
        addr.isDefault = index === targetIndex;
      });
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { index } = req.params;
    const idx = parseInt(index, 10);
    const user = await User.findById(req.user.id);

    if (idx < 0 || idx >= user.addresses.length) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.splice(idx, 1);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// Admin: list users
export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false }).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};


