import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../../lib/axiosClient";
import type { Product } from "../products/productSlice";

export interface CartItem {
  _id?: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartState {
  items: CartItem[];
  itemsPrice: number;
  loading: boolean;
}

const initialState: CartState = {
  items: [],
  itemsPrice: 0,
  loading: false,
};

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/api/cart");
      return res.data.data as { items: CartItem[]; itemsPrice: number };
    } catch (error: any) {
      // Nếu là 401 (unauthorized), không throw error mà return empty cart
      if (error.response?.status === 401) {
        return rejectWithValue("Unauthorized");
      }
      return rejectWithValue(error.response?.data?.message || "Failed to fetch cart");
    }
  },
);

export const upsertCartItem = createAsyncThunk(
  "cart/upsertItem",
  async (
    payload: {
      productId: string;
      quantity: number;
      size?: string;
      color?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosClient.post("/api/cart/items", payload);
      return res.data.data as { items: CartItem[]; itemsPrice: number };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update cart item",
      );
    }
  },
);

export const removeCartItem = createAsyncThunk(
  "cart/removeItem",
  async (payload: { productId: string; size?: string; color?: string }) => {
    const res = await axiosClient.delete("/api/cart/items", { data: payload });
    return res.data.data as { items: CartItem[]; itemsPrice: number };
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.itemsPrice = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.itemsPrice = action.payload.itemsPrice;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        // Nếu là unauthorized, reset cart về empty
        if (action.payload === "Unauthorized") {
          state.items = [];
          state.itemsPrice = 0;
        }
      })
      .addCase(upsertCartItem.fulfilled, (state, action) => {
        // Không set loading = true vì đây chỉ là cập nhật, không phải fetch lại
        state.items = action.payload.items;
        state.itemsPrice = action.payload.itemsPrice;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.itemsPrice = action.payload.itemsPrice;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;


