import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// V9: Semantic + Structure changes
// Semantic: text content changed, href/link values changed, input roles changed, aria-labels added
// Structure: DOM nesting restructured, parent tags changed, sibling order changed, depth altered
// data-testid: RENAMED (prefix "v9-" added + some renamed to different slugs)

const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        if (val && !validateEmail(val)) {
            setEmailError('Định dạng email không đúng!');
        } else {
            setEmailError('');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Email chưa đúng định dạng, vui lòng kiểm tra lại');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            alert("Đăng nhập thành công!");
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    };

    return (
        // Structure: outer wrapper changed from container to section > div
        <section className="auth-section mt-5">
            <div className="row justify-content-center">
                <div className="col-sm-10 col-md-6 col-lg-4">
                    {/* Structure: card moved inside col, extra wrapper div removed */}
                    <div className="card shadow" style={{ borderRadius: '15px' }}>
                        <div className="card-body p-4">
                            {/* Semantic: heading text changed */}
                            <h3 className="text-center fw-bold mb-4">Chào mừng trở lại</h3>

                            {/* Structure: form now wrapped in article tag for semantic grouping */}
                            <article>
                                <form onSubmit={handleLogin} role="form" aria-label="Form đăng nhập tài khoản">

                                    {/* Structure: field wrapper changed from div.mb-3 to fieldset-like div with extra label wrapper */}
                                    <div className="mb-3">
                                        {/* Semantic: label text changed */}
                                        <label htmlFor="v9-login-email" className="form-label small fw-bold">
                                            Địa chỉ email
                                        </label>
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                id="v9-login-email"
                                                data-testid="v9-email-input"
                                                className="form-control"
                                                // Semantic: placeholder changed
                                                placeholder="Nhập địa chỉ email đăng ký"
                                                required
                                                aria-label="Email đăng nhập"
                                                aria-describedby="email-hint"
                                                value={user.email}
                                                onChange={handleEmailChange}
                                            />
                                        </div>
                                        {/* Structure: error moved inside extra div */}
                                        <div id="email-hint">
                                            {emailError && (
                                                <div className="invalid-feedback d-block" data-testid="v9-email-error">
                                                    {emailError}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        {/* Semantic: label text changed */}
                                        <label htmlFor="v9-login-password" className="form-label small fw-bold">
                                            Mật khẩu đăng nhập
                                        </label>
                                        <input
                                            type="password"
                                            id="v9-login-password"
                                            data-testid="v9-password-input"
                                            className="form-control"
                                            placeholder="Nhập mật khẩu của bạn"
                                            required
                                            aria-label="Mật khẩu"
                                            onChange={e => setUser({ ...user, password: e.target.value })}
                                        />
                                    </div>

                                    {/* Structure: button wrapped in div.d-grid for full-width semantic */}
                                    <div className="d-grid">
                                        {/* Semantic: button text changed */}
                                        <button
                                            type="submit"
                                            data-testid="v9-submit-login"
                                            className="btn btn-primary py-2 fw-bold"
                                        >
                                            Xác nhận đăng nhập
                                        </button>
                                    </div>
                                </form>
                            </article>

                            {/* Structure: footer moved ABOVE form separator, changed from small to p tag */}
                            <hr />
                            <p className="text-center mt-2 mb-0" style={{ fontSize: '0.875rem' }}>
                                {/* Semantic: text changed */}
                                <span className="text-muted">Chưa có tài khoản? </span>
                                {/* Semantic: href target same /register but text changed */}
                                <a href="/register" className="text-decoration-none fw-bold">Tạo tài khoản ngay</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;