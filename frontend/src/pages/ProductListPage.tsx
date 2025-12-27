import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { fetchProducts, Product } from "../features/products/productSlice";
import { axiosClient } from "../lib/axiosClient";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import ProductCard from "../components/ui/ProductCard";
import PriceRangeSlider from "../components/ui/PriceRangeSlider";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [localMinPrice, setLocalMinPrice] = useState("");
  const [localMaxPrice, setLocalMaxPrice] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Get filters from URL (no page needed for infinite scroll)
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";

  // Fetch categories (separate API call)
  useEffect(() => {
    axiosClient
      .get("/api/categories")
      .then((res) => {
        setCategories(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  // Fetch price range once on mount (only need min/max, not all products)
  useEffect(() => {
    // Fetch all products once to calculate price range
    // This is cached and only runs once
    axiosClient
      .get("/api/products?limit=1000")
      .then((res) => {
        const allProducts = res.data.data || [];
        if (allProducts.length > 0) {
          const prices = allProducts.map(
            (p: Product) => p.salePrice || p.price,
          );
          const minPrice = Math.floor(Math.min(...prices) / 10000) * 10000; // Round down to nearest 10k
          const maxPrice = Math.ceil(Math.max(...prices) / 10000) * 10000; // Round up to nearest 10k
          setPriceRange({ min: minPrice, max: maxPrice });
        }
      })
      .catch(() => {});
  }, []);

  // Sync URL params with local state
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Fetch products - reset when filters change
  useEffect(() => {
    setLoading(true);
    setProducts([]);
    setHasMore(true);
    const params: any = {
      page: 1, // Always start from page 1 when filters change
      limit: 12,
      sort,
      order,
    };
    if (search) params.search = search;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    axiosClient
      .get("/api/products", { params })
      .then((res) => {
        setProducts(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
          setHasMore(res.data.pagination.page < res.data.pagination.totalPages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, category, minPrice, maxPrice, sort, order]);

  // Load more products when scrolling
  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = pagination.page + 1;
    const params: any = {
      page: nextPage,
      limit: 12,
      sort,
      order,
    };
    if (search) params.search = search;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    axiosClient
      .get("/api/products", { params })
      .then((res) => {
        const newProducts = res.data.data || [];
        setProducts((prev) => [...prev, ...newProducts]);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
          setHasMore(
            res.data.pagination.page < res.data.pagination.totalPages,
          );
        }
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }, [
    loadingMore,
    hasMore,
    pagination.page,
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    order,
  ]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMoreProducts]);

  // Ngăn scroll body khi mobile filter drawer mở
  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMobileFilters]);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setShowScrollToTop(scrollY > 300); // Show after scrolling 300px
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Debounce timer refs
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      // Remove page param (not needed for infinite scroll)
      newParams.delete("page");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  // Debounced search update
  const updateSearchFilter = useCallback(
    (value: string) => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchDebounceRef.current = setTimeout(() => {
        updateFilter("search", value);
      }, 500); // 500ms debounce
    },
    [updateFilter],
  );

  // Debounced price range update
  const handlePriceRangeChange = useCallback(
    (min: number, max: number) => {
      // Clear previous timeout
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }

      // Update local state immediately for UI responsiveness
      setLocalMinPrice(min.toString());
      setLocalMaxPrice(max.toString());

      // Debounce API call
      priceDebounceRef.current = setTimeout(() => {
        // Only update if different from full range
        if (min === priceRange.min && max === priceRange.max) {
          setLocalMinPrice("");
          setLocalMaxPrice("");
          updateFilter("minPrice", "");
          updateFilter("maxPrice", "");
        } else {
          updateFilter("minPrice", min.toString());
          updateFilter("maxPrice", max.toString());
        }
      }, 300); // 300ms debounce for price slider
    },
    [priceRange, updateFilter],
  );

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tất cả sản phẩm</h1>
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="filter-button-bounce lg:hidden flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 hover:shadow-md"
        >
          <FunnelIcon className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
          Bộ lọc
        </button>
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
              {priceRange.max > priceRange.min && (
                <PriceRangeSlider
                  min={priceRange.min}
                  max={priceRange.max}
                  valueMin={
                    localMinPrice && localMinPrice !== ""
                      ? Number(localMinPrice)
                      : priceRange.min
                  }
                  valueMax={
                    localMaxPrice && localMaxPrice !== ""
                      ? Number(localMaxPrice)
                      : priceRange.max
                  }
                  onChange={handlePriceRangeChange}
                  formatPrice={formatPrice}
                />
              )}
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
          {/* Mobile Sort Dropdown */}
          <div className="mb-4 lg:hidden">
            <select
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split("-");
                updateFilter("sort", s);
                updateFilter("order", o);
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
            </select>
          </div>

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
                  <ProductCard
                    key={`${product._id}-${product.slug}`}
                    product={product}
                  />
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="h-10 w-full" />

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-accent"></div>
                    <span className="text-sm">Đang tải thêm sản phẩm...</span>
                  </div>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && products.length > 0 && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-500">
                    Đã hiển thị tất cả {pagination.total} sản phẩm
                  </p>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    ↑ Về đầu trang
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="filter-backdrop-enter fixed inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Filter Panel */}
          <div className="filter-drawer-enter fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold animate-in fade-in slide-in-from-left-8">
                <FunnelIcon className="h-5 w-5 text-accent transition-transform duration-300 group-hover:rotate-12" />
                Bộ lọc
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-full transition-all duration-200 hover:scale-110 hover:bg-slate-100 active:scale-95"
                aria-label="Close filters"
              >
                <XMarkIcon className="h-6 w-6 transition-transform duration-200 hover:rotate-90" />
              </button>
            </div>

            <div className="space-y-6 p-4">
              {/* Search */}
              <div className="filter-item">
                <label className="mb-2 block text-sm font-medium">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => updateSearchFilter(e.target.value)}
                    placeholder="Tên sản phẩm..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 pl-10 text-sm transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none focus:scale-[1.02]"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-accent" />
                </div>
              </div>

              {/* Category */}
              <div className="filter-item">
                <label className="mb-2 block text-sm font-medium">
                  Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none focus:scale-[1.02]"
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
              <div className="filter-item">
                <label className="mb-2 block text-sm font-medium">Giá</label>
                {priceRange.max > priceRange.min && (
                  <PriceRangeSlider
                    min={priceRange.min}
                    max={priceRange.max}
                    valueMin={
                      localMinPrice && localMinPrice !== ""
                        ? Number(localMinPrice)
                        : priceRange.min
                    }
                    valueMax={
                      localMaxPrice && localMaxPrice !== ""
                        ? Number(localMaxPrice)
                        : priceRange.max
                    }
                    onChange={handlePriceRangeChange}
                    formatPrice={formatPrice}
                  />
                )}
              </div>

              {/* Sort */}
              <div className="filter-item">
                <label className="mb-2 block text-sm font-medium">
                  Sắp xếp
                </label>
                <select
                  value={`${sort}-${order}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split("-");
                    updateFilter("sort", s);
                    updateFilter("order", o);
                  }}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none focus:scale-[1.02]"
                >
                  <option value="createdAt-desc">Mới nhất</option>
                  <option value="createdAt-asc">Cũ nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="name-desc">Tên Z-A</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(search || category || localMinPrice || localMaxPrice) && (
                <div className="filter-item">
                  <button
                    onClick={() => {
                      setLocalMinPrice("");
                      setLocalMaxPrice("");
                      setSearchParams(new URLSearchParams());
                      setShowMobileFilters(false);
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              {/* Apply Button */}
              <div className="filter-item">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 hover:shadow-lg"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`scroll-to-top-button fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-xl transition-all duration-300 hover:bg-orange-600 hover:scale-110 active:scale-95 ${
          showScrollToTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUpIcon className="h-6 w-6 transition-transform duration-300 hover:-translate-y-1" />
      </button>
    </div>
  );
};

export default ProductListPage;
