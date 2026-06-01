import { useState } from "react";
import axios from 'axios';

// V5: Context only - breadcrumb, sidebar FAQ, nearby helper text, disclaimer footer
// data-testid DELETED completely
// UNCHANGED: text labels/button, id, name, placeholder, structure, visual styling

const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const handleEmailChange = (e) => {
        const val = e.target.value; setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) { setEmailError('Vui lòng nhập đúng định dạng email'); return; }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token); sessionStorage.setItem('role', res.data.role);
            alert("Đăng nhập thành công!"); window.location.href = "/";
        } catch (err) { alert(err.response?.data?.message || "Đăng nhập thất bại!"); }
    };
    return (
        <div className="container mt-5">
            {/* Context: breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small">
                    <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
                    <li className="breadcrumb-item"><a href="/account">Tài khoản</a></li>
                    <li className="breadcrumb-item active">Đăng nhập</li>
                </ol>
            </nav>
            <div className="row">
                {/* Context: sidebar */}
                <div className="col-md-4 d-none d-md-block">
                    <div className="card bg-light border-0 p-3 mb-3">
                        <h6 className="fw-bold text-primary">Lợi ích khi đăng nhập</h6>
                        <ul className="small text-muted ps-3 mb-0">
                            <li>Theo dõi trạng thái đơn hàng</li>
                            <li>Lưu sản phẩm yêu thích</li>
                            <li>Nhận ưu đãi độc quyền</li>
                        </ul>
                    </div>
                    <div className="card border-warning border-2 p-3">
                        <small className="text-warning fw-bold">🔒 Bảo mật SSL 256-bit</small>
                        <small className="text-muted d-block mt-1">Thông tin của bạn được mã hoá an toàn</small>
                    </div>
                </div>
                <div className="col-md-8 col-lg-5">
                    {/* Context: page description */}
                    <p className="text-muted small mb-3">Đăng nhập để quản lý đơn hàng và trải nghiệm mua sắm tốt hơn.</p>
                    <div className="card mx-auto shadow" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                        <div className="card-body p-4">
                            <h3 className="text-center fw-bold mb-4">Đăng nhập</h3>
                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Email</label>
                                    {/* Context: nearby helper text */}
                                    <small className="text-muted d-block mb-1">Dùng email đã đăng ký tài khoản</small>
                                    <input type="email" id="login-email"
                                        className="form-control ${emailError ? 'is-invalid' : ''}`"
                                        placeholder="name@example.com" required value={user.email} onChange={handleEmailChange} />
                                    {emailError && <div className="invalid-feedback d-block">{emailError}</div>}
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Mật khẩu</label>
                                    {/* Context: nearby helper text */}
                                    <small className="text-muted d-block mb-1">Tối thiểu 6 ký tự, phân biệt hoa thường</small>
                                    <input type="password" id="login-password" className="form-control"
                                        placeholder="••••••••" required onChange={e => setUser({ ...user, password: e.target.value })} />
                                </div>
                                <button id="btn-login" className="btn btn-primary w-100 py-2 fw-bold">Đăng nhập</button>
                                {/* Context: disclaimer */}
                                <small className="text-muted d-block text-center mt-2" style={{ fontSize: '11px' }}>
                                    Bằng cách đăng nhập, bạn đồng ý với <a href="/terms">Điều khoản dịch vụ</a> của chúng tôi.
                                </small>
                            </form>
                            <div className="text-center mt-3">
                                <small className="text-muted">Bạn chưa có tài khoản? <a href="/register" className="text-decoration-none">Đăng ký ngay</a></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;