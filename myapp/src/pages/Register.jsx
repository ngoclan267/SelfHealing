import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V6: Attribute + Semantic
// Attribute: data-testid "v6-", id/name/aria/placeholder changed
// Semantic: title, labels, button text changed
// UNCHANGED: structure, visual, context

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const validateEmail = (email) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
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
            <div className="card mx-auto shadow" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                <div className="card-body p-4">
                    <h3 className="text-center fw-bold mb-4">Khởi tạo tài khoản</h3>
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Địa chỉ Email</label>
                            <input type="email" id="reg-email-ctrl" data-testid="v6-register-email"
                                name="registrationEmail" aria-label="Địa chỉ email đăng ký tài khoản"
                                className="form-control" placeholder="Email dùng để đăng nhập"
                                required value={user.email} onChange={handleEmailChange} />
                            {emailError && <div className='invalid-feedback d-block'>{emailError}</div>}
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Tạo mật khẩu</label>
                            <input type="password" id="reg-pass-ctrl" data-testid="v6-register-password"
                                name="registrationPassword" aria-label="Tạo mật khẩu cho tài khoản"
                                className="form-control" placeholder="Đặt mật khẩu bảo mật"
                                required onChange={e => setUser({ ...user, password: e.target.value })} />
                        </div>
                        <button data-testid="v6-btn-register" aria-label="Hoàn tất tạo tài khoản"
                            className="btn btn-success w-100 py-2 fw-bold mt-2">Tạo tài khoản</button>
                    </form>
                    <div className="text-center mt-3">
                        <small className="text-muted">Đã có tài khoản? <Link to="/login" className="text-decoration-none">Quay lại đăng nhập</Link></small>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Register;