import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V11 Changes:
// [Visual]      - Outer container: added gradient background style, adjusted padding
// [Visual]      - Card: new boxShadow style, changed borderRadius to 10px, added border
// [Visual]      - Button: changed from btn-success to btn-primary, added inline borderRadius/padding style
// [Visual]      - Input fields: added inline style (background, borderColor on focus via className trick)
// [Visual]      - Heading: larger font size via inline style, added color
// [Context]     - Heading text: "Đăng ký tài khoản" → "Tạo tài khoản mới"
// [Context]     - Label "Email" → "Địa chỉ Email"; Label "Mật khẩu" → "Tạo mật khẩu"
// [Context]     - Placeholder changed: "name@example.com" → "email@domain.com"
// [Context]     - Footer text: "Đã có tài khoản?" → "Bạn đã có tài khoản rồi?"
// [Context]     - Button text: "Đăng ký" → "Hoàn tất đăng ký"
// [Attribute]   - data-testid="register-email" → data-cy="input-email"
// [Attribute]   - data-testid="register-password" → data-cy="input-password"
// [Attribute]   - data-testid="btn-register" → removed entirely
// [Attribute]   - id="register-email" removed; id="register-password" removed
// [Attribute]   - Added name="email" and name="password" attributes
// [Attribute]   - Added autoComplete="email" and autoComplete="new-password"

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        if (val && !validateEmail(val)) {
            setEmailError('Email không hợp lệ!')
        } else {
            setEmailError('')
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Vui lòng nhập đúng định dạng email!');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Đăng ký thành công!");
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đăng ký thất bại, email có thể đã tồn tại!");
        }
    };

    return (
        <div
            className="container mt-5"
            style={{
                background: 'linear-gradient(135deg, #e8f5e9 0%, #f3f4f6 100%)',
                padding: '28px',
                borderRadius: '10px'
            }}
        >
            <div
                className="card mx-auto"
                style={{
                    maxWidth: '400px',
                    borderRadius: '10px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
                    border: '1px solid #c8e6c9'
                }}
            >
                <div className="card-body p-4">
                    <h3
                        className="text-center fw-bold mb-4"
                        style={{ fontSize: '1.45rem', color: '#1b5e20' }}
                    >
                        Tạo tài khoản mới
                    </h3>

                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Địa chỉ Email</label>
                            <input
                                type="email"
                                data-cy="input-email"
                                name="email"
                                className="form-control"
                                placeholder="email@domain.com"
                                required
                                autoComplete="email"
                                value={user.email}
                                onChange={handleEmailChange}
                            />
                            {emailError && (
                                <div className="invalid-feedback d-block">
                                    {emailError}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-bold">Tạo mật khẩu</label>
                            <input
                                type="password"
                                data-cy="input-password"
                                name="password"
                                className="form-control"
                                placeholder="Tối thiểu 6 ký tự"
                                required
                                autoComplete="new-password"
                                onChange={e => setUser({ ...user, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 fw-bold mt-2"
                            style={{ borderRadius: '6px', padding: '10px 0', letterSpacing: '0.3px' }}
                        >
                            Hoàn tất đăng ký
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <small className="text-muted">
                            Bạn đã có tài khoản rồi?{' '}
                            <Link to="/login" className="text-decoration-none">Đăng nhập</Link>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;