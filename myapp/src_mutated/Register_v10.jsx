import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V10: Attribute + Semantic + Structure (Heavy)
// Attribute: autocomplete attrs, name attrs, minLength added, className restructured
// Semantic: all labels/placeholders/button text changed, error messages reworded
// Structure: password moved ABOVE email (fields reordered), footer nav inside card-footer
// data-testid: RENAMED (different slug, no "register" keyword)

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Địa chỉ email không hợp lệ' : '');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Vui lòng kiểm tra lại email');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Tài khoản đã được tạo thành công!");
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Tạo tài khoản thất bại!");
        }
    };

    return (
        // Structure: root changed to section.auth-container
        <section className="auth-container mt-5" aria-label="Đăng ký tài khoản mới">
            <div className="row justify-content-center m-0">
                <div className="col-11 col-sm-8 col-md-5 col-lg-4">
                    <div className="card border-0 shadow-lg rounded-4">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0 text-center">
                            {/* Semantic: heading changed */}
                            <h2 className="fw-bolder fs-4">Mở tài khoản mới</h2>
                            {/* Structure: sub-heading added (new sibling element) */}
                            <p className="text-muted small">Điền đầy đủ thông tin phía dưới</p>
                        </div>

                        <div className="card-body px-4 py-4">
                            <form onSubmit={handleRegister} noValidate id="signup-form" aria-label="Form tạo tài khoản">

                                {/* Structure: PASSWORD field now FIRST (swapped with email) */}
                                <div className="mb-4">
                                    {/* Semantic: label changed */}
                                    <label htmlFor="v10-pwd" className="form-label fw-semibold small text-uppercase">
                                        Đặt mật khẩu
                                    </label>
                                    {/* Attribute: autocomplete, name, minLength added */}
                                    <input
                                        type="password"
                                        id="v10-pwd"
                                        name="password"
                                        autoComplete="new-password"
                                        minLength={6}
                                        data-testid="v10-pw-field"
                                        className="form-control form-control-lg border-2"
                                        placeholder="Tối thiểu 6 ký tự"
                                        required
                                        onChange={e => setUser({ ...user, password: e.target.value })}
                                    />
                                </div>

                                {/* Structure: EMAIL field now SECOND */}
                                <div className="mb-4">
                                    {/* Semantic: label changed */}
                                    <label htmlFor="v10-email" className="form-label fw-semibold small text-uppercase">
                                        Địa chỉ Email đăng ký
                                    </label>
                                    {/* Attribute: autocomplete, name added */}
                                    <input
                                        type="email"
                                        id="v10-email"
                                        name="email"
                                        autoComplete="email"
                                        data-testid="v10-email-field"
                                        className="form-control form-control-lg border-2"
                                        placeholder="Nhập email hợp lệ"
                                        required
                                        value={user.email}
                                        onChange={handleEmailChange}
                                    />
                                    {/* Structure: error is p.small instead of div.invalid-feedback */}
                                    {emailError && (
                                        <p role="alert" className="text-danger small mt-1 mb-0">
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                <div className="d-grid">
                                    {/* Semantic: button text changed */}
                                    <button
                                        type="submit"
                                        data-testid="v10-create-account"
                                        className="btn btn-success btn-lg fw-bold rounded-3"
                                    >
                                        Tạo tài khoản ngay
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Structure: link moved into card-footer (separate from card-body) */}
                        <div className="card-footer bg-transparent border-0 text-center pb-4">
                            <span className="text-muted small">Đã có tài khoản? </span>
                            {/* Semantic: link text changed */}
                            <Link to="/login" className="small fw-bold text-decoration-none">Đăng nhập ngay</Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;