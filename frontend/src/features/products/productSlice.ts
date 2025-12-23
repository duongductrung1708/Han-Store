import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../../lib/axiosClient";

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  images?: { url: string; publicId?: string }[];
  variants?: { size?: string; color?: string; stock: number }[];
  categories?: { _id: string; name: string; slug: string }[];
  tags?: string[];
  totalStock?: number;
  averageRating?: number;
  totalReviews?: number;
}

interface ProductState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  "products/fetchList",
  async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sort?: string;
    order?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.order) queryParams.append("order", params.order);
    if (params?.minPrice) queryParams.append("minPrice", params.minPrice.toString());
    if (params?.maxPrice) queryParams.append("maxPrice", params.maxPrice.toString());

    const res = await axiosClient.get(
      `/api/products?${queryParams.toString()}`,
    );
    return res.data.data as Product[];
  },
);

export const fetchProductDetail = createAsyncThunk(
  "products/fetchDetail",
  async (idOrSlug: string) => {
    const res = await axiosClient.get(`/api/products/${idOrSlug}`);
    return res.data.data as Product;
  },
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load products";
      });
  },
});

export default productSlice.reducer;


