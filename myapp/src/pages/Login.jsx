import { useState } from "react";
import axios from 'axios';
const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const handleEmailChange = (e) => {
        const val = e.target.value; setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Địa chỉ email không hợp lệ!' : '');
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
            <div className="card mx-auto shadow" style={{ maxWidth:'400px', borderRadius: '15px' }}>
                <div className="card-body p-4">
                    <h3 className="text-center fw-bold mb-4">Truy cập tài khoản</h3>
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Địa chỉ thư điện tử</label>
                            <input type="email" id="user-email-input" data-testid="v6-login-email"
                                name="emailAddress" aria-label="Nhập địa chỉ thư điện tử"
                                className="form-control" placeholder="Thư điện tử của bạn"
                                required value={user.email} onChange={handleEmailChange} />
                            {emailError && <div className="invalid-feedback d-block">{emailError}</div>}
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold">Mã bảo mật</label>
                            <input type="password" id="user-secret-input" data-testid="v6-login-password"
                                name="secretCode" aria-label="Nhập mã bảo mật tài khoản"
                                className="form-control" placeholder="Nhập mã bảo mật"
                                required onChange={e => setUser({ ...user, password: e.target.value })} />
                        </div>
                        <button id="submit-access-btn" data-testid="v6-btn-login"
                            aria-label="Xác nhận truy cập tài khoản"
                            className="btn btn-primary w-100 py-2 fw-bold">Truy cập ngay</button>
                    </form>
                    <div className="text-center mt-3">
                        <small className="text-muted">Chưa có tài khoản? <a href="/register" className="text-decoration-none">Tạo tài khoản mới</a></small>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;