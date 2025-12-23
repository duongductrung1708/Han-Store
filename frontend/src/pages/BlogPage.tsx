const BlogPage = () => {
  // TODO: Fetch blog posts from API
  const blogPosts = [
    {
      id: 1,
      title: "Xu hướng thời trang mùa hè 2024",
      excerpt:
        "Khám phá những xu hướng thời trang nổi bật nhất mùa hè năm nay với các mẫu thiết kế độc đáo và phong cách hiện đại.",
      image: "https://via.placeholder.com/400x250",
      date: "15/03/2024",
      author: "Han Store",
    },
    {
      id: 2,
      title: "Cách chọn quần áo phù hợp với dáng người",
      excerpt:
        "Hướng dẫn chi tiết cách chọn trang phục để tôn lên vẻ đẹp tự nhiên và che đi những khuyết điểm của cơ thể.",
      image: "https://via.placeholder.com/400x250",
      date: "10/03/2024",
      author: "Han Store",
    },
    {
      id: 3,
      title: "Bảo quản quần áo đúng cách",
      excerpt:
        "Những mẹo hay giúp bạn giữ quần áo luôn mới, bền đẹp và tiết kiệm chi phí thay thế.",
      image: "https://via.placeholder.com/400x250",
      date: "05/03/2024",
      author: "Han Store",
    },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="mb-8 text-3xl font-bold">Blog</h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article
            key={post.id}
            className="group cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="aspect-video overflow-hidden bg-slate-200">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.author}</span>
              </div>
              <h2 className="mb-2 text-xl font-semibold group-hover:text-accent">
                {post.title}
              </h2>
              <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                {post.excerpt}
              </p>
              <button className="text-sm font-medium text-accent hover:underline">
                Đọc thêm →
              </button>
            </div>
          </article>
        ))}
      </div>

      {blogPosts.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          <p>Chưa có bài viết nào.</p>
        </div>
      )}
    </div>
  );
};

export default BlogPage;

