import { useState } from "react";
import axios from 'axios';

// V4: Visual only - dark theme, gradient button, borderRadius 0, uppercase font
// data-testid prefix "v4-"
// UNCHANGED: text labels, id, name, placeholder, structure DOM, context

const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) { setEmailError('Vui lòng nhập đúng định dạng email'); return; }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            alert("Đăng nhập thành công!");
            window.location.href = "/";
        } catch (err) { alert(err.response?.data?.message || "Đăng nhập thất bại!"); }
    };
    return (
        <div className="container-fluid px-0 min-vh-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: '#1a1a2e' }}>
            <div className="card border-0" style={{ width: '100%', maxWidth: '480px', borderRadius: '0', backgroundColor: '#16213e', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div className="card-body p-5">
                    <h3 className="text-center fw-bold mb-5" style={{ color: '#e0e0e0', fontSize: '28px', letterSpacing: '2px', textTransform: 'uppercase' }}>Đăng nhập</h3>
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="form-label small fw-bold" style={{ color: '#a0a0b0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Email</label>
                            <input
                                type="email"
                                id="login-email"
                                data-testid="v4-login-email"
                                className="form-control border-0 border-bottom rounded-0"
                                style={{ backgroundColor: 'transparent', color: '#e0e0e0', boxShadow: 'none', borderColor: '#444', paddingLeft: '0', fontSize: '15px' }}
                                placeholder="name@example.com"
                                required
                                value={user.email}
                                onChange={handleEmailChange}
                            />
                            {emailError && <div className="invalid-feedback d-block" style={{ color: '#ff6b6b' }}>{emailError}</div>}
                        </div>
                        <div className="mb-5">
                            <label className="form-label small fw-bold" style={{ color: '#a0a0b0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Mật khẩu</label>
                            <input
                                type="password"
                                id="login-password"
                                data-testid="v4-login-password"
                                className="form-control border-0 border-bottom rounded-0"
                                style={{ backgroundColor: 'transparent', color: '#e0e0e0', boxShadow: 'none', borderColor: '#444', paddingLeft: '0', fontSize: '15px' }}
                                placeholder="••••••••"
                                required
                                onChange={e => setUser({ ...user, password: e.target.value })}
                            />
                        </div>
                        <button
                            id="btn-login"
                            data-testid="v4-btn-login"
                            className="btn w-100 fw-bold"
                            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '0', padding: '14px', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase' }}>
                            Đăng nhập
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <small style={{ color: '#a0a0b0' }}>Bạn chưa có tài khoản? <a href="/register" className="text-decoration-none" style={{ color: '#667eea' }}>Đăng ký ngay</a></small>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;