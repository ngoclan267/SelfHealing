import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V9: Semantic + Structure changes
// Semantic: text/labels changed, aria-labels added, role attrs added
// Structure: nesting depth changed, sibling order changed, wrapper tags changed
// data-testid: RENAMED to different slugs

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
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
            setEmailError('Địa chỉ email không hợp lệ!');
        } else {
            setEmailError('');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Vui lòng nhập đúng định dạng email!');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Tạo tài khoản thành công!");
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đăng ký thất bại, email có thể đã tồn tại!");
        }
    };

    return (
        // Structure: wrapper changed from container to main > section
        <main className="mt-5">
            <section className="row justify-content-center">
                <div className="col-sm-10 col-md-6 col-lg-4">
                    <div className="card shadow" style={{ borderRadius: '15px' }}>
                        <div className="card-body p-4">
                            {/* Semantic: heading text changed */}
                            <h3 className="text-center fw-bold mb-4">Tạo tài khoản mới</h3>

                            <form onSubmit={handleRegister} noValidate aria-label="Form đăng ký tài khoản">

                                {/* Structure: email field wrapped in extra div.field-group */}
                                <div className="field-group mb-3">
                                    {/* Semantic: label text changed */}
                                    <label htmlFor="reg-email-field" className="form-label small fw-bold">
                                        Địa chỉ Email
                                    </label>
                                    <div className="input-group-wrapper">
                                        <input
                                            type="email"
                                            id="reg-email-field"
                                            data-testid="v9-reg-email"
                                            className="form-control"
                                            placeholder="Điền email của bạn"
                                            required
                                            aria-required="true"
                                            value={user.email}
                                            onChange={handleEmailChange}
                                        />
                                    </div>
                                    {/* Structure: error is now sibling of input-group-wrapper, not just sibling of input */}
                                    {emailError && (
                                        <p className="text-danger small mt-1 mb-0" data-testid="v9-reg-email-error">
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                {/* Structure: password field - label and input order same but wrapper class changed */}
                                <div className="field-group mb-3">
                                    {/* Semantic: label text changed */}
                                    <label htmlFor="reg-password-field" className="form-label small fw-bold">
                                        Mật khẩu
                                    </label>
                                    <input
                                        type="password"
                                        id="reg-password-field"
                                        data-testid="v9-reg-password"
                                        className="form-control"
                                        placeholder="Tạo mật khẩu bảo mật"
                                        required
                                        aria-required="true"
                                        onChange={e => setUser({ ...user, password: e.target.value })}
                                    />
                                </div>

                                {/* Structure: button wrapped in div.d-grid */}
                                <div className="d-grid mt-3">
                                    {/* Semantic: button text changed */}
                                    <button
                                        type="submit"
                                        data-testid="v9-reg-submit"
                                        className="btn btn-success py-2 fw-bold"
                                    >
                                        Hoàn tất đăng ký
                                    </button>
                                </div>
                            </form>

                            {/* Structure: sibling to form, was small inside div, now p tag */}
                            <p className="text-center mt-3 mb-0" style={{ fontSize: '0.875rem' }}>
                                {/* Semantic: text changed */}
                                <span className="text-muted">Bạn đã có tài khoản? </span>
                                <Link to="/login" className="text-decoration-none fw-bold">Đăng nhập tại đây</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Register;