import { useState } from "react";
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

// V8: Attribute + Context
// Attribute: id thay đổi, className thay đổi, maxLength thêm, autocomplete thêm
// Context: heading text, label text, placeholder, footer link text thay đổi; data-testid GIỮ NGUYÊN
const Login = () =>{
    const [user, setUser] = useState({email:'' ,password:''});
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const validateEmail = (email)=>{ const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return regex.test(email); }
    const handleEmailChange=(e)=>{
        const val=e.target.value;
        setUser({...user,email:val});
        setEmailError(val && !validateEmail(val) ? 'Email không hợp lệ!' : '');
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        if(!validateEmail(user.email)){ setEmailError('Vui lòng nhập đúng định dạng email'); return; }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            alert("Đăng nhập thành công!");
            window.location.href = "/"; 
        } catch (err) { alert(err.response?.data?.message || "Đăng nhập thất bại!"); }
    };
    return (
        <div className="container py-5">
            <div className="card mx-auto shadow-lg" style={{ maxWidth: '420px', borderRadius: '12px' }}>
                <div className="card-header bg-primary text-white text-center py-3">
                    {/* Context: heading text thay đổi */}
                    <h4 className="mb-0 fw-bold">Cổng đăng nhập thành viên</h4>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            {/* Context: label thay đổi */}
                            <label className="form-label small fw-bold text-muted" htmlFor="user-email-input">Tài khoản Email</label>
                            <input 
                                type="email" 
                                id="user-email-input"
                                data-testid="login-email_v8"
                                className="form-control form-control-sm rounded-3"
                                placeholder="Nhập địa chỉ email của bạn"
                                required
                                value={user.email}
                                autoComplete="username"
                                onChange={handleEmailChange} 
                            />
                            {emailError &&(<div className="invalid-feedback d-block">{emailError}</div>)}
                        </div>
                        <div className="mb-4">
                            {/* Context: label thay đổi */}
                            <label className="form-label small fw-bold text-muted" htmlFor="user-pwd-input">Mật khẩu bí mật</label>
                            <input 
                                type="password" 
                                id="user-pwd-input"
                                data-testid="login-password_v8"
                                className="form-control form-control-sm rounded-3"
                                placeholder="Điền mật khẩu tại đây"
                                required
                                maxLength={64}
                                autoComplete="current-password"
                                onChange={e => setUser({ ...user, password: e.target.value })} 
                            />
                        </div>
                        <button id="submit-login" data-testid="btn-login_v8" className="btn btn-primary w-100 fw-bold rounded-3">Đăng nhập</button>
                    </form>
                </div>
                <div className="card-footer text-center bg-light">
                    {/* Context: surrounding text + link text thay đổi */}
                    <small className="text-muted">Chưa phải thành viên? <a href="/register" className="text-primary text-decoration-none fw-semibold">Tham gia ngay hôm nay</a></small>
                </div>
            </div>
        </div>
    );
}

export default Login;