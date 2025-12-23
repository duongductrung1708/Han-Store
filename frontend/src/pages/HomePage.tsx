import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { fetchProducts, Product } from "../features/products/productSlice";
import { axiosClient } from "../lib/axiosClient";
import BannerCarousel from "../components/ui/BannerCarousel";
import ProductCard from "../components/ui/ProductCard";

const ProductSection = ({
  title,
  products,
  loading,
  viewAllLink,
}: {
  title: string;
  products: Product[];
  loading: boolean;
  viewAllLink?: string;
}) => {
  if (loading) {
    return (
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-sm font-medium text-accent hover:underline"
          >
            Xem tất cả →
          </Link>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

const HomePage = () => {
  const dispatch = useAppDispatch();
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingSale, setLoadingSale] = useState(true);

  useEffect(() => {
    // Fetch sản phẩm mới nhất (8 sản phẩm)
    dispatch(fetchProducts({ limit: 8, sort: "createdAt", order: "desc" }))
      .unwrap()
      .then((data) => {
        setNewProducts(data);
        setLoadingNew(false);
      })
      .catch(() => setLoadingNew(false));

    // Fetch sản phẩm đang giảm giá (6 sản phẩm)
    // Lấy tất cả rồi filter ở frontend (hoặc có thể tạo API riêng)
    axiosClient
      .get("/api/products?limit=20&sort=createdAt&order=desc")
      .then((res) => {
        const allProducts = res.data.data as Product[];
        const onSale = allProducts
          .filter((p) => p.salePrice && p.salePrice < p.price)
          .slice(0, 6);
        setSaleProducts(onSale);
        setLoadingSale(false);
      })
      .catch(() => setLoadingSale(false));
  }, [dispatch]);

  // Banner slides data
  const bannerSlides = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80",
      title: "Bộ sưu tập mùa hè 2024",
      subtitle: "Khám phá những xu hướng thời trang mới nhất với giá ưu đãi",
      link: "/products",
      buttonText: "Mua ngay",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&q=80",
      title: "Giảm giá lên đến 50%",
      subtitle: "Ưu đãi đặc biệt cho các sản phẩm được yêu thích nhất",
      link: "/products",
      buttonText: "Xem ngay",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
      title: "Đồ gia dụng cao cấp",
      subtitle: "Nâng tầm không gian sống với những sản phẩm chất lượng",
      link: "/products?category=do-gia-dung",
      buttonText: "Khám phá",
    },
  ];

  return (
    <div>
      {/* Banner Carousel */}
      <BannerCarousel slides={bannerSlides} autoPlay={true} autoPlayInterval={5000} />

      {/* Sản phẩm mới nhất */}
      <ProductSection
        title="Sản phẩm mới nhất"
        products={newProducts}
        loading={loadingNew}
        viewAllLink="/products?sort=createdAt&order=desc"
      />

      {/* Sản phẩm đang giảm giá */}
      <ProductSection
        title="Đang giảm giá"
        products={saleProducts}
        loading={loadingSale}
        viewAllLink="/products"
      />
    </div>
  );
};

export default HomePage;


