import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V4: Visual only - split layout, teal gradient left col, minimal right col
// data-testid prefix "v4-"
// UNCHANGED: text labels/button, id, name, placeholder, structure, context

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) { setEmailError('Vui lòng nhập đúng định dạng email!'); return; }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Đăng ký thành công!");
            navigate('/login');
        } catch (err) { alert(err.response?.data?.message || "Đăng ký thất bại!"); }
    };
    return (
        <div className="container-fluid px-0 min-vh-100">
            <div className="row g-0 min-vh-100">
                <div className="col-md-5 d-none d-md-flex align-items-center justify-content-center"
                    style={{ background: 'linear-gradient(160deg,#0093E9 0%,#80D0C7 100%)' }}>
                    <div className="text-center text-white p-4">
                        <h2 className="fw-bold display-5">Apple Store</h2>
                        <p className="mt-2 opacity-75">Tạo tài khoản để trải nghiệm mua sắm tuyệt vời</p>
                    </div>
                </div>
                <div className="col-md-7 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f0f4f8' }}>
                    <div style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
                        <h3 className="fw-bold mb-4" style={{ color: '#2d3748', fontSize: '26px' }}>Đăng ký tài khoản</h3>
                        <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="form-label small fw-bold" style={{ color: '#4a5568', fontSize: '14px' }}>Email</label>
                                <input
                                    type="email"
                                    id="register-email"
                                    data-testid="v4-register-email"
                                    className="form-control form-control-lg"
                                    style={{ borderRadius: '8px', border: '2px solid #e2e8f0', backgroundColor: '#fff', fontSize: '15px' }}
                                    placeholder="name@example.com"
                                    required value={user.email} onChange={handleEmailChange}
                                />
                                {emailError && <div className='invalid-feedback d-block'>{emailError}</div>}
                            </div>
                            <div className="mb-4">
                                <label className="form-label small fw-bold" style={{ color: '#4a5568', fontSize: '14px' }}>Mật khẩu</label>
                                <input
                                    type="password"
                                    id="register-password"
                                    data-testid="v4-register-password"
                                    className="form-control form-control-lg"
                                    style={{ borderRadius: '8px', border: '2px solid #e2e8f0', backgroundColor: '#fff', fontSize: '15px' }}
                                    placeholder="••••••••"
                                    required onChange={e => setUser({ ...user, password: e.target.value })}
                                />
                            </div>
                            <button
                                data-testid="v4-btn-register"
                                className="btn w-100 fw-bold py-3"
                                style={{ backgroundColor: '#0093E9', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px' }}>
                                Đăng ký
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <small className="text-muted">Đã có tài khoản? <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#0093E9' }}>Đăng nhập</Link></small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Register;