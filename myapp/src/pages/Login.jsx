import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// V11: Visual + Context + Attribute
// Visual: layout changes (left-aligned instead of centered, dark theme card, different spacing)
//         NOTE: Visual score intentionally LOW — structure/semantics mostly preserved,
//               only inline styles and class tweaks change visual presentation
// Context: page context changed (appears to be part of admin panel now), form context changed
// Attribute: id attrs changed, autocomplete added, maxLength added
// data-testid: RENAMED to different slugs (no "login" keyword)

const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Vui lòng nhập đúng định dạng email');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            alert("Đăng nhập thành công!");
            window.location.href = "/";
        } catch (err) {
            alert(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    };

    return (
        // Visual: full-height dark background instead of plain white page
        <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', padding: '2rem' }}
        >
            {/* Visual: card is now dark themed, wider */}
            <div
                className="card border-0"
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    backgroundColor: '#16213e',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}
            >
                <div className="card-body p-5">
                    {/* Visual: heading now left-aligned, white color */}
                    <h3
                        className="fw-bold mb-1"
                        style={{ color: '#e2e8f0', textAlign: 'left', fontSize: '1.75rem' }}
                    >
                        Đăng nhập
                    </h3>
                    {/* Context: sub-heading gives page context as "secure area" */}
                    <p className="mb-4" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        Khu vực bảo mật — chỉ dành cho thành viên
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            {/* Visual + Context: label now light colored */}
                            <label
                                htmlFor="auth-email"
                                className="form-label fw-bold small"
                                style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            >
                                Email
                            </label>
                            {/* Attribute: id changed, autocomplete, maxLength added */}
                            <input
                                type="email"
                                id="auth-email"
                                name="email"
                                autoComplete="email"
                                data-testid="auth-field-email"
                                className="form-control"
                                placeholder="name@example.com"
                                required
                                value={user.email}
                                onChange={handleEmailChange}
                                // Visual: dark input styling
                                style={{
                                    backgroundColor: '#0f3460',
                                    border: '1px solid #334155',
                                    color: '#e2e8f0',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem'
                                }}
                            />
                            {emailError && (
                                <div className="invalid-feedback d-block" style={{ color: '#f87171' }} data-testid="auth-email-err">
                                    {emailError}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="auth-password"
                                className="form-label fw-bold small"
                                style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            >
                                Mật khẩu
                            </label>
                            {/* Attribute: id changed, autocomplete added */}
                            <input
                                type="password"
                                id="auth-password"
                                name="password"
                                autoComplete="current-password"
                                data-testid="auth-field-password"
                                className="form-control"
                                placeholder="••••••••"
                                required
                                onChange={e => setUser({ ...user, password: e.target.value })}
                                style={{
                                    backgroundColor: '#0f3460',
                                    border: '1px solid #334155',
                                    color: '#e2e8f0',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem'
                                }}
                            />
                        </div>

                        {/* Visual: button different color scheme */}
                        <button
                            type="submit"
                            data-testid="auth-submit-btn"
                            className="btn w-100 fw-bold py-2"
                            style={{
                                backgroundColor: '#e94560',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '1rem'
                            }}
                        >
                            Đăng nhập
                        </button>
                    </form>

                    {/* Context: register link in different context framing */}
                    <div className="text-center mt-4">
                        <small style={{ color: '#64748b' }}>
                            Bạn chưa có tài khoản?{' '}
                            <a
                                href="/register"
                                className="text-decoration-none"
                                style={{ color: '#e94560' }}
                            >
                                Đăng ký ngay
                            </a>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;