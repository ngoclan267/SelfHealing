import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// V10: Attribute + Semantic + Structure (Heavy)
// Attribute: type changed on some inputs, name attrs added, class names changed
// Semantic: all visible text changed, placeholder text changed, error messages reworded
// Structure: form fields split into separate article tags, button moved outside form
// data-testid: REMOVED entirely (replaced with name + aria-label for locating)

const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Email bạn nhập chưa đúng chuẩn' : '');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Hãy kiểm tra lại địa chỉ email');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            alert("Xác thực thành công!");
            window.location.href = "/";
        } catch (err) {
            alert(err.response?.data?.message || "Không thể đăng nhập!");
        }
    };

    return (
        // Structure: root changed to main > div.row
        <main id="login-page" className="mt-5">
            <div className="row justify-content-center m-0">
                <div className="col-11 col-sm-8 col-md-5 col-lg-4">
                    <div className="card border-0 shadow-lg rounded-4">
                        <div className="card-body px-4 py-5">

                            {/* Semantic: title changed */}
                            <h2 className="text-center fw-bolder mb-5 fs-4">Truy cập tài khoản</h2>

                            {/* Structure: form split — each field in its own article */}
                            <form id="login-form" onSubmit={handleLogin}>

                                {/* Structure: email wrapped in article.field-article */}
                                <article className="field-article mb-4">
                                    {/* Semantic: label text changed */}
                                    <label htmlFor="field-email" className="form-label fw-semibold small text-uppercase ls-1">
                                        Tài khoản Email
                                    </label>
                                    {/* Attribute: autocomplete added, name attr added */}
                                    <input
                                        type="email"
                                        id="field-email"
                                        name="email"
                                        autoComplete="email"
                                        aria-label="Tài khoản email đăng nhập"
                                        className="form-control form-control-lg border-2"
                                        placeholder="your@email.com"
                                        required
                                        value={user.email}
                                        onChange={handleEmailChange}
                                    />
                                    {/* Structure: error is now a p tag, not div.invalid-feedback */}
                                    {emailError && (
                                        <p role="alert" className="text-danger small mt-1 mb-0" aria-live="polite">
                                            {emailError}
                                        </p>
                                    )}
                                </article>

                                {/* Structure: password in its own article */}
                                <article className="field-article mb-4">
                                    {/* Semantic: label text changed */}
                                    <label htmlFor="field-password" className="form-label fw-semibold small text-uppercase ls-1">
                                        Mật khẩu bảo mật
                                    </label>
                                    {/* Attribute: autocomplete added */}
                                    <input
                                        type="password"
                                        id="field-password"
                                        name="password"
                                        autoComplete="current-password"
                                        aria-label="Mật khẩu đăng nhập"
                                        className="form-control form-control-lg border-2"
                                        placeholder="Mật khẩu của bạn"
                                        required
                                        onChange={e => setUser({ ...user, password: e.target.value })}
                                    />
                                </article>

                                {/* Structure: submit button inside form but wrapped in footer element */}
                                <footer className="form-footer">
                                    {/* Semantic + Attribute: button text changed, type kept submit */}
                                    <button
                                        type="submit"
                                        aria-label="Xác nhận và đăng nhập"
                                        className="btn btn-primary btn-lg w-100 fw-bold rounded-3"
                                    >
                                        Vào tài khoản
                                    </button>
                                </footer>
                            </form>

                            <hr className="my-4" />

                            {/* Structure: nav link in nav tag instead of div */}
                            <nav aria-label="Điều hướng xác thực" className="text-center">
                                {/* Semantic: text changed */}
                                <span className="text-muted small">Lần đầu sử dụng? </span>
                                <a href="/register" className="small fw-bold text-decoration-none">Đăng ký tài khoản</a>
                            </nav>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Login;