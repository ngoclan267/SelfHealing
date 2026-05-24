import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V8: Attribute + Context
const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError]=useState('');
    const navigate = useNavigate();
    const validateEmail = (email)=>{ const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return regex.test(email); }
    const handleEmailChange=(e)=>{
        const val=e.target.value;
        setUser({...user,email:val});
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    }
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)){ setEmailError('Vui lòng nhập dùng định dạng email!'); return; }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Đăng ký thành công!");
            navigate('/login');
        } catch (err) { alert(err.response?.data?.message || "Đăng ký thất bại, email có thể đã tồn tại!"); }
    };

    return (
        <div className="container py-5">
            <div className="card mx-auto shadow-lg" style={{ maxWidth: '420px', borderRadius: '12px' }}>
                <div className="card-header bg-success text-white text-center py-3">
                    {/* Context: heading thay đổi */}
                    <h4 className="mb-0 fw-bold">Tạo tài khoản miễn phí</h4>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            {/* Attribute: id thay đổi; Context: label thay đổi */}
                            <label className="form-label small fw-bold text-muted" htmlFor="new-user-email">Địa chỉ Email</label>
                            <input 
                                type="email" 
                                id="new-user-email"
                                data-testid="register-email_v8"
                                className="form-control form-control-sm rounded-3"
                                placeholder="Dùng để đăng nhập sau này"
                                required
                                autoComplete="email"
                                value={user.email}
                                onChange={handleEmailChange} 
                            />
                            {emailError&&<div className='invalid-feedback d-block'>{emailError}</div>}
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted" htmlFor="new-user-password">Thiết lập mật khẩu</label>
                            <input 
                                type="password" 
                                id="new-user-password"
                                data-testid="register-password_v8"
                                className="form-control form-control-sm rounded-3"
                                placeholder="Tối thiểu 6 ký tự, nên dùng ký tự đặc biệt"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                onChange={e => setUser({ ...user, password: e.target.value })} 
                            />
                        </div>
                        {/* Context: button text thay đổi; Attribute: id thêm */}
                        <button id="submit-register" data-testid="btn-register_v8" className="btn btn-success w-100 fw-bold rounded-3 mt-2">Tạo tài khoản ngay</button>
                    </form>
                </div>
                <div className="card-footer text-center bg-light">
                    <small className="text-muted">Đã có tài khoản rồi? <Link to="/login" className="text-success text-decoration-none fw-semibold">Đăng nhập</Link></small>
                </div>
            </div>
        </div>
    );
}

export default Register;