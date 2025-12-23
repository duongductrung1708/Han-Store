const AboutPage = () => {
  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Về chúng tôi</h1>

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Giới thiệu Han Store</h2>
            <p className="mb-4 leading-relaxed text-slate-700">
              Han Store là cửa hàng thời trang trực tuyến chuyên cung cấp các sản
              phẩm quần áo, phụ kiện và đồ gia dụng chất lượng cao với giá cả hợp
              lý. Chúng tôi cam kết mang đến cho khách hàng những trải nghiệm mua
              sắm tuyệt vời nhất.
            </p>
            <p className="leading-relaxed text-slate-700">
              Với phương châm "Chất lượng là ưu tiên hàng đầu", Han Store luôn chọn
              lọc kỹ lưỡng từng sản phẩm để đảm bảo chất lượng tốt nhất và phù hợp
              với xu hướng thời trang hiện đại.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">Tầm nhìn</h2>
            <p className="leading-relaxed text-slate-700">
              Trở thành thương hiệu thời trang trực tuyến hàng đầu tại Việt Nam,
              được khách hàng tin tưởng và yêu mến nhờ chất lượng sản phẩm và dịch vụ
              chăm sóc khách hàng xuất sắc.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">Sứ mệnh</h2>
            <ul className="list-inside list-disc space-y-2 leading-relaxed text-slate-700">
              <li>
                Cung cấp các sản phẩm thời trang chất lượng cao với giá cả hợp lý
              </li>
              <li>
                Mang đến trải nghiệm mua sắm trực tuyến tiện lợi và an toàn cho mọi
                khách hàng
              </li>
              <li>
                Xây dựng cộng đồng yêu thích thời trang và phong cách sống hiện đại
              </li>
              <li>
                Đóng góp tích cực vào sự phát triển của ngành thời trang Việt Nam
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">Giá trị cốt lõi</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border bg-slate-50 p-6">
                <h3 className="mb-2 text-lg font-semibold">Chất lượng</h3>
                <p className="text-sm text-slate-600">
                  Chúng tôi cam kết chỉ cung cấp những sản phẩm chất lượng tốt nhất,
                  được kiểm tra kỹ lưỡng trước khi đến tay khách hàng.
                </p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-6">
                <h3 className="mb-2 text-lg font-semibold">Uy tín</h3>
                <p className="text-sm text-slate-600">
                  Xây dựng niềm tin với khách hàng thông qua sự minh bạch trong giao
                  dịch và cam kết đổi trả hàng nếu không hài lòng.
                </p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-6">
                <h3 className="mb-2 text-lg font-semibold">Dịch vụ</h3>
                <p className="text-sm text-slate-600">
                  Đội ngũ chăm sóc khách hàng chuyên nghiệp, sẵn sàng hỗ trợ 24/7 để
                  giải đáp mọi thắc mắc của bạn.
                </p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-6">
                <h3 className="mb-2 text-lg font-semibold">Đổi mới</h3>
                <p className="text-sm text-slate-600">
                  Luôn cập nhật xu hướng thời trang mới nhất và cải tiến dịch vụ để
                  mang đến trải nghiệm tốt nhất cho khách hàng.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">Liên hệ</h2>
            <div className="space-y-2 text-slate-700">
              <p>
                <strong>Email:</strong> support@hanstore.com
              </p>
              <p>
                <strong>Hotline:</strong> 1900 1234
              </p>
              <p>
                <strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, Hà Nội
              </p>
              <p>
                <strong>Giờ làm việc:</strong> Thứ 2 - Chủ nhật: 8:00 - 22:00
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

