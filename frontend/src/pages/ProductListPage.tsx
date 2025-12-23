import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { fetchProducts, Product } from "../features/products/productSlice";
import { axiosClient } from "../lib/axiosClient";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import ProductCard from "../components/ui/ProductCard";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Get filters from URL
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";

  // Fetch categories
  useEffect(() => {
    axiosClient
      .get("/api/products?limit=100")
      .then((res) => {
        // Extract unique categories from products
        const catsMap = new Map<string, Category>();
        res.data.data.forEach((p: Product & { categories?: Category[] }) => {
          if (p.categories) {
            p.categories.forEach((cat) => {
              if (!catsMap.has(cat._id)) {
                catsMap.set(cat._id, cat);
              }
            });
          }
        });
        setCategories(Array.from(catsMap.values()));
      })
      .catch(() => {});
  }, []);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    const params: any = {
      page,
      limit: 12,
      sort,
      order,
    };
    if (search) params.search = search;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    dispatch(fetchProducts(params))
      .unwrap()
      .then((data) => {
        setProducts(data);
        // Get pagination from API response (if available)
        axiosClient
          .get("/api/products", { params })
          .then((res) => {
            if (res.data.pagination) {
              setPagination(res.data.pagination);
            }
          });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dispatch, page, search, category, minPrice, maxPrice, sort, order]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to page 1 when filter changes
    setSearchParams(newParams);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tất cả sản phẩm</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px,1fr]">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-6 rounded-lg border bg-white p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <FunnelIcon className="h-5 w-5" />
              Bộ lọc
            </h2>

            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder="Tên sản phẩm..."
                  className="w-full rounded-md border px-3 py-2 pl-10 text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium">Danh mục</label>
              <select
                value={category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Tất cả</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="mb-2 block text-sm font-medium">Giá</label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  placeholder="Từ"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  placeholder="Đến"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="mb-2 block text-sm font-medium">Sắp xếp</label>
              <select
                value={`${sort}-${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split("-");
                  updateFilter("sort", s);
                  updateFilter("order", o);
                }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-lg bg-slate-200"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p>Không tìm thấy sản phẩm nào.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                Hiển thị {products.length} sản phẩm
                {pagination.total > 0 && ` / ${pagination.total} sản phẩm`}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => updateFilter("page", String(page - 1))}
                    disabled={page === 1}
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => updateFilter("page", String(pageNum))}
                          className={`rounded-md border px-3 py-2 text-sm ${
                            pageNum === page
                              ? "bg-black text-white"
                              : "bg-white"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum}>...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => updateFilter("page", String(page + 1))}
                    disabled={page === pagination.totalPages}
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;
