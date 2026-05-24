import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
    { id:'iphone', name: 'iPhone', desc: 'Sức mạnh trong tầm tay.',document:'iPhone là dòng điện thoại thông minh của Apple Inc. chạy hệ điều hành iOS, nổi bật với thiết kế tinh tế, màn hình cảm ứng đa điểm, hiệu năng cao nhờ chip Apple Silicon, camera chất lượng và hệ sinh thái ứng dụng phong phú', 
        color: '#000', img: 'https://img.youtube.com/vi/3s49ddWEluo/maxresdefault.jpg' },
    { id:'ipad', name: 'iPad', desc: 'Sáng tạo không giới hạn.',document:'iPad là dòng máy tính bảng của Apple, kết hợp giữa điện thoại và laptop, có bốn dòng chính: iPad (phổ thông), iPad mini (nhỏ gọn), iPad Air (cân bằng hiệu năng/giá) và iPad Pro (cao cấp, mạnh mẽ cho công việc sáng tạo), chạy trên hệ điều hành iPadOS với các tính năng đa nhiệm và hỗ trợ phụ kiện như Apple Pencil, Magic Keyboard, phục vụ nhu cầu giải trí, học tập và làm việc chuyên nghiệp. ',
         color: '#1d1d1f', img: 'https://cafefcdn.com/203337114487263232/2021/4/21/mini-led-ipad-pro-is-official-5g-16189627548801990868237.jpeg' },
    { id:'macbook', name: 'MacBook', desc: 'Làm việc chuyên nghiệp.',document:'MacBook là dòng laptop cao cấp của Apple nổi bật với thiết kế sang trọng, mỏng nhẹ, hiệu năng mạnh mẽ nhờ chip Apple Silicon (M-series), màn hình Retina sắc nét và hệ điều hành macOS tối ưu, bảo mật, tích hợp sâu với hệ sinh thái Apple, phù hợp cho mọi đối tượng từ học tập, văn phòng đến chuyên nghiệp (đồ họa, lập trình).', 
        color: '#424246bb', textColor: '#000', img: 'https://ben.com.vn/tin-tuc/wp-content/uploads/2021/10/MacBook-Pro-14-va-MacBook-Pro-16.jpg' },
    { id:'airpods', name: 'AirPods', desc: 'Âm thanh thuần khiết.',document:'AirPods là dòng tai nghe không dây cao cấp của Apple, nổi bật với thiết kế nhỏ gọn, kết nối Bluetooth liền mạch trong hệ sinh thái Apple, chip H-series mạnh mẽ, chất lượng âm thanh tốt cùng các tính năng thông minh như Tự động dừng/phát nhạc, "Hey Siri", Chống ồn chủ động (ANC) và Âm thanh Không gian (Spatial Audio), mang lại trải nghiệm nghe nhạc, gọi điện rảnh tay, tiện lợi, hỗ trợ nhiều dòng thiết bị Apple (và cả Android), dễ dàng tìm kiếm khi thất lạc, và có khả năng chống nước/mồ hôi trên các phiên bản cao cấp. ', 
        color: '#b2a9a9ff', textColor: '#000', img: 'https://cdn.tgdd.vn/News/1562620/tai-nghe-airpods-1-800x450.jpg' }
];

const Introduct = () => {
    return (
        <div className="about-shop">
            <div className="shop-hero text-center py-5 bg-black text-white">
                <h1 className="display-3 fw-bold">Phone Shop</h1>
                <p className="lead">Nơi hội tụ những công nghệ đỉnh cao từ Apple.</p>
                <p className='lead opacity-75'>Apple là một trong các công ty công nghệ lớn nhất trên toàn cầu.<br></br>Tập đoàn này được biết đến qua việc tạo ra nhiều thiết bị tiên tiến như iPhone, iPad, MacBook cùng với loạt phần mềm và dịch vụ khác. </p>
            </div>

            {categories.map((cat) => (
                <section key={cat.id} className="category-section" style={{ backgroundColor: cat.color, color: cat.textColor || '#fff' }}>
                    <div className="container-fluid p-0">
                        <div className="row g-0 align-items-center">
                            <div className="col-md-6 p-5 text-center text-md-start">
                                <h2 className="display-4 fw-bold">{cat.name}</h2>
                                <p className="h4 opacity-75 mb-4">{cat.desc}</p>
                                <p className="lead">{cat.document}</p>
                                <Link to={`/product?type=${cat.id}`} className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold">
                                    Khám phá ngay
                                </Link>
                            </div>
                            <div className="col-md-6">
                                <img src={cat.img} alt={cat.name} className="img-fluid category-hero-img" />
                            </div>
                        </div>
                    </div>
                </section>
            ))}
            <div className="container py-5 text-center">
                <h3>Tại sao chọn chúng tôi?</h3>
                <div className="row mt-4">
                    <div className="col-md-4"><h5>Hàng chính hãng</h5><p>Cam kết 100% Apple VN.</p></div>
                    <div className="col-md-4"><h5>Bảo hành 12 tháng</h5><p>Lỗi 1 đổi 1 nhanh chóng.</p></div>
                    <div className="col-md-4"><h5>Hỗ trợ 24/7</h5><p>Luôn lắng nghe khách hàng.</p></div>
                </div>
                <hr className="my-5" />
                <h3>Liên hệ với chúng tôi để được hỗ trợ ngay</h3>
                <div className="row mt-4">
                    <div className="col-md-4"><p>📧 a@gmail.com</p><p>📧 ngvs@gmail.com</p></div>
                    <div className="col-md-4"><p>📞 0958749572</p><p>📞 0088439522</p></div>
                    <div className="col-md-4"><p>🌐 Facebook: Tran Van A</p><p>🌐 Instagram: @phoneshop_apple</p></div>
                </div>
            </div>
        </div>
    );
};

export default Introduct;