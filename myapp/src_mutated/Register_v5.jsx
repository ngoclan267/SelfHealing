import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V5: Context only
// data-testid DELETED completely
// UNCHANGED: text labels/button, id, name, placeholder, structure, visual

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const handleEmailChange = (e) => {
        const val = e.target.value; setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) { setEmailError('Vui lòng nhập đúng định dạng email!'); return; }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Đăng ký thành công!"); navigate('/login');
        } catch (err) { alert(err.response?.data?.message || "Đăng ký thất bại!"); }
    };
    return (
        <div className="container mt-5">
            {/* Context: breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small">
                    <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
                    <li className="breadcrumb-item active">Đăng ký tài khoản</li>
                </ol>
            </nav>
            <div className="row">
                {/* Context: benefits sidebar */}
                <div className="col-md-4 d-none d-md-block">
                    <div className="card bg-light border-0 p-3 mb-3">
                        <h6 className="fw-bold text-success">Tại sao nên tạo tài khoản?</h6>
                        <ul className="small text-muted ps-3 mb-0">
                            <li>Mua hàng nhanh hơn</li>
                            <li>Lưu thông tin giao hàng</li>
                            <li>Xem lịch sử đơn hàng</li>
                            <li>Nhận thông báo ưu đãi</li>
                        </ul>
                    </div>
                    <div className="card border-0 bg-success bg-opacity-10 p-3">
                        <small className="fw-bold text-success">✅ Miễn phí hoàn toàn</small>
                        <small className="text-muted d-block mt-1">Không mất phí đăng ký hay duy trì tài khoản</small>
                    </div>
                </div>
                <div className="col-md-8 col-lg-5">
                    {/* Context: page description */}
                    <p className="text-muted small mb-3">Chỉ mất 30 giây để tạo tài khoản và bắt đầu mua sắm.</p>
                    <div className="card mx-auto shadow" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                        <div className="card-body p-4">
                            <h3 className="text-center fw-bold mb-4">Đăng ký tài khoản</h3>
                            <form onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Email</label>
                                    {/* Context: helper text */}
                                    <small className="text-muted d-block mb-1">Dùng để đăng nhập và nhận thông báo</small>
                                    <input type="email" id="register-email" className="form-control"
                                        placeholder="name@example.com" required value={user.email} onChange={handleEmailChange} />
                                    {emailError && <div className='invalid-feedback d-block'>{emailError}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Mật khẩu</label>
                                    {/* Context: helper text */}
                                    <small className="text-muted d-block mb-1">Ít nhất 6 ký tự, nên có số và chữ hoa</small>
                                    <input type="password" id="register-password" className="form-control"
                                        placeholder="••••••••" required onChange={e => setUser({ ...user, password: e.target.value })} />
                                </div>
                                <button className="btn btn-success w-100 py-2 fw-bold mt-2">Đăng ký</button>
                                {/* Context: disclaimer */}
                                <small className="text-muted d-block text-center mt-2" style={{ fontSize: '11px' }}>
                                    Bằng cách đăng ký, bạn đồng ý với <a href="/terms">Điều khoản</a> và <a href="/privacy">Chính sách bảo mật</a>.
                                </small>
                            </form>
                            <div className="text-center mt-3">
                                <small className="text-muted">Đã có tài khoản? <Link to="/login" className="text-decoration-none">Đăng nhập</Link></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Register;