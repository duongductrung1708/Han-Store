import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

dotenv.config();

// Tạo slug từ tên
const createSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const seedCategories = async () => {
  const categories = [
    { name: "Quần áo", slug: "quan-ao" },
    { name: "Áo thun", slug: "ao-thun", parent: "quan-ao" },
    { name: "Áo sơ mi", slug: "ao-so-mi", parent: "quan-ao" },
    { name: "Quần dài", slug: "quan-dai", parent: "quan-ao" },
    { name: "Quần short", slug: "quan-short", parent: "quan-ao" },
    { name: "Đồ gia dụng", slug: "do-gia-dung" },
    { name: "Nhà bếp", slug: "nha-bep", parent: "do-gia-dung" },
    { name: "Phòng ngủ", slug: "phong-ngu", parent: "do-gia-dung" },
    { name: "Phụ kiện", slug: "phu-kien" },
    { name: "Túi xách", slug: "tui-xach", parent: "phu-kien" },
    { name: "Ví", slug: "vi", parent: "phu-kien" },
  ];

  const createdCategories = {};

  // Tạo categories không có parent trước
  for (const cat of categories.filter((c) => !c.parent)) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      const newCat = await Category.create({
        name: cat.name,
        slug: cat.slug,
      });
      createdCategories[cat.slug] = newCat._id;
      console.log(`✓ Created category: ${cat.name}`);
    } else {
      createdCategories[cat.slug] = existing._id;
      console.log(`- Category already exists: ${cat.name}`);
    }
  }

  // Tạo categories có parent
  for (const cat of categories.filter((c) => c.parent)) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      const newCat = await Category.create({
        name: cat.name,
        slug: cat.slug,
        parent: createdCategories[cat.parent],
      });
      createdCategories[cat.slug] = newCat._id;
      console.log(`✓ Created category: ${cat.name} (parent: ${cat.parent})`);
    } else {
      createdCategories[cat.slug] = existing._id;
      console.log(`- Category already exists: ${cat.name}`);
    }
  }

  return createdCategories;
};

const seedProducts = async (categories) => {
  const products = [
    {
      name: "Áo thun nam cổ tròn basic",
      slug: "ao-thun-nam-co-tron-basic",
      description:
        "<p>Áo thun nam cổ tròn basic với chất liệu cotton 100% mềm mại, thoáng mát. Thiết kế đơn giản, dễ phối đồ, phù hợp cho mọi dịp.</p><p><strong>Chất liệu:</strong> Cotton 100%</p><p><strong>Màu sắc:</strong> Đen, Trắng, Xám</p><p><strong>Size:</strong> S, M, L, XL</p>",
      price: 299000,
      salePrice: 199000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
        },
      ],
      variants: [
        { size: "S", color: "Đen", stock: 20 },
        { size: "M", color: "Đen", stock: 30 },
        { size: "L", color: "Đen", stock: 25 },
        { size: "S", color: "Trắng", stock: 15 },
        { size: "M", color: "Trắng", stock: 20 },
        { size: "L", color: "Trắng", stock: 18 },
        { size: "M", color: "Xám", stock: 12 },
        { size: "L", color: "Xám", stock: 10 },
      ],
      categories: [categories["ao-thun"] || categories["quan-ao"]],
      tags: ["áo thun", "nam", "basic", "cotton"],
      totalStock: 150,
    },
    {
      name: "Áo sơ mi nam dài tay",
      slug: "ao-so-mi-nam-dai-tay",
      description:
        "<p>Áo sơ mi nam dài tay công sở, form dáng chuẩn, chất liệu vải cao cấp không nhăn. Phù hợp cho công sở, đi làm, họp mặt.</p><p><strong>Chất liệu:</strong> Polyester 65%, Cotton 35%</p><p><strong>Màu sắc:</strong> Trắng, Xanh dương, Xám</p><p><strong>Size:</strong> S, M, L, XL</p>",
      price: 599000,
      salePrice: 449000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1594938291221-94f18c4077bf?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
        },
      ],
      variants: [
        { size: "S", color: "Trắng", stock: 15 },
        { size: "M", color: "Trắng", stock: 25 },
        { size: "L", color: "Trắng", stock: 20 },
        { size: "XL", color: "Trắng", stock: 10 },
        { size: "M", color: "Xanh dương", stock: 18 },
        { size: "L", color: "Xanh dương", stock: 15 },
        { size: "XL", color: "Xanh dương", stock: 8 },
      ],
      categories: [categories["ao-so-mi"]],
      tags: ["áo sơ mi", "nam", "công sở", "dài tay"],
      totalStock: 131,
    },
    {
      name: "Quần jean nam slim fit",
      slug: "quan-jean-nam-slim-fit",
      description:
        "<p>Quần jean nam slim fit với chất liệu denim cao cấp, co giãn nhẹ, form dáng ôm vừa phải. Phù hợp cho giới trẻ, năng động.</p><p><strong>Chất liệu:</strong> Cotton 98%, Elastane 2%</p><p><strong>Màu sắc:</strong> Xanh đậm, Xanh nhạt</p><p><strong>Size:</strong> 28, 30, 32, 34</p>",
      price: 899000,
      salePrice: 699000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
        },
      ],
      variants: [
        { size: "28", color: "Xanh đậm", stock: 10 },
        { size: "30", color: "Xanh đậm", stock: 20 },
        { size: "32", color: "Xanh đậm", stock: 18 },
        { size: "34", color: "Xanh đậm", stock: 12 },
        { size: "30", color: "Xanh nhạt", stock: 15 },
        { size: "32", color: "Xanh nhạt", stock: 12 },
        { size: "34", color: "Xanh nhạt", stock: 8 },
      ],
      categories: [categories["quan-dai"]],
      tags: ["quần jean", "nam", "slim fit", "denim"],
      totalStock: 107,
    },
    {
      name: "Quần short nam thể thao",
      slug: "quan-short-nam-the-thao",
      description:
        "<p>Quần short nam thể thao với chất liệu thấm hút mồ hôi tốt, co giãn linh hoạt. Phù hợp cho tập gym, chạy bộ, hoạt động ngoài trời.</p><p><strong>Chất liệu:</strong> Polyester 85%, Spandex 15%</p><p><strong>Màu sắc:</strong> Đen, Xám, Xanh navy</p><p><strong>Size:</strong> S, M, L, XL</p>",
      price: 399000,
      salePrice: 299000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1506629905607-1c0b0c0c0c0c?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
        },
      ],
      variants: [
        { size: "S", color: "Đen", stock: 20 },
        { size: "M", color: "Đen", stock: 30 },
        { size: "L", color: "Đen", stock: 25 },
        { size: "XL", color: "Đen", stock: 15 },
        { size: "M", color: "Xám", stock: 18 },
        { size: "L", color: "Xám", stock: 15 },
        { size: "M", color: "Xanh navy", stock: 12 },
        { size: "L", color: "Xanh navy", stock: 10 },
      ],
      categories: [categories["quan-short"]],
      tags: ["quần short", "nam", "thể thao", "gym"],
      totalStock: 165,
    },
    {
      name: "Bộ nồi inox 3 lớp",
      slug: "bo-noi-inox-3-lop",
      description:
        "<p>Bộ nồi inox 3 lớp cao cấp với đáy từ tính, dẫn nhiệt đều, chống dính. Phù hợp cho mọi loại bếp gas, điện, từ.</p><p><strong>Chất liệu:</strong> Inox 304, đáy từ tính</p><p><strong>Bao gồm:</strong> Nồi 16cm, 20cm, 24cm</p><p><strong>Xuất xứ:</strong> Việt Nam</p>",
      price: 1299000,
      salePrice: 999000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
        },
      ],
      variants: [
        { size: "Bộ 3 nồi", color: "Inox", stock: 25 },
      ],
      categories: [categories["nha-bep"]],
      tags: ["nồi", "inox", "nhà bếp", "bộ nồi"],
      totalStock: 25,
    },
    {
      name: "Chăn ga gối bộ 3 món",
      slug: "chan-ga-goi-bo-3-mon",
      description:
        "<p>Bộ chăn ga gối 3 món với chất liệu cotton cao cấp, mềm mại, thoáng mát. Thiết kế hiện đại, màu sắc trang nhã.</p><p><strong>Chất liệu:</strong> Cotton 100%</p><p><strong>Kích thước:</strong> 1m6 x 2m</p><p><strong>Màu sắc:</strong> Trắng, Xám, Hồng pastel</p>",
      price: 899000,
      salePrice: 699000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        },
      ],
      variants: [
        { size: "1m6 x 2m", color: "Trắng", stock: 15 },
        { size: "1m6 x 2m", color: "Xám", stock: 12 },
        { size: "1m6 x 2m", color: "Hồng pastel", stock: 10 },
      ],
      categories: [categories["phong-ngu"]],
      tags: ["chăn ga gối", "phòng ngủ", "cotton", "bộ 3 món"],
      totalStock: 37,
    },
    {
      name: "Túi xách da thật nữ",
      slug: "tui-xach-da-that-nu",
      description:
        "<p>Túi xách da thật nữ với thiết kế sang trọng, tinh tế. Chất liệu da bò cao cấp, bền đẹp theo thời gian.</p><p><strong>Chất liệu:</strong> Da bò thật 100%</p><p><strong>Kích thước:</strong> 30cm x 25cm x 10cm</p><p><strong>Màu sắc:</strong> Đen, Nâu, Đỏ đô</p>",
      price: 1999000,
      salePrice: 1499000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800",
        },
      ],
      variants: [
        { size: "30x25x10", color: "Đen", stock: 8 },
        { size: "30x25x10", color: "Nâu", stock: 6 },
        { size: "30x25x10", color: "Đỏ đô", stock: 5 },
      ],
      categories: [categories["tui-xach"]],
      tags: ["túi xách", "nữ", "da thật", "sang trọng"],
      totalStock: 19,
    },
    {
      name: "Ví da nam đa ngăn",
      slug: "vi-da-nam-da-ngan",
      description:
        "<p>Ví da nam đa ngăn với thiết kế gọn nhẹ, nhiều ngăn tiện lợi. Chất liệu da PU cao cấp, bền đẹp.</p><p><strong>Chất liệu:</strong> Da PU cao cấp</p><p><strong>Kích thước:</strong> 11cm x 9cm</p><p><strong>Màu sắc:</strong> Đen, Nâu, Xám</p>",
      price: 299000,
      salePrice: 199000,
      images: [
        {
          url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
        },
        {
          url: "https://images.unsplash.com/photo-1626941941720-104831e0e0c2?w=800",
        },
      ],
      variants: [
        { size: "11x9", color: "Đen", stock: 30 },
        { size: "11x9", color: "Nâu", stock: 25 },
        { size: "11x9", color: "Xám", stock: 20 },
      ],
      categories: [categories["vi"]],
      tags: ["ví", "nam", "da", "đa ngăn"],
      totalStock: 75,
    },
  ];

  for (const product of products) {
    const existing = await Product.findOne({ slug: product.slug });
    if (!existing) {
      await Product.create(product);
      console.log(`✓ Created product: ${product.name}`);
    } else {
      console.log(`- Product already exists: ${product.name}`);
    }
  }
};

const seed = async () => {
  try {
    console.log("🌱 Starting seed...\n");
    await connectDB();

    console.log("📁 Creating categories...");
    const categories = await seedCategories();
    console.log("\n📦 Creating products...");
    await seedProducts(categories);

    console.log("\n✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seed();

