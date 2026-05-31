import { useState } from "react";
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

// V2: Semantic changes only
// - Button text: "Đăng nhập" -> "Xác nhận & Đăng nhập"
// - Label "Email" -> "Địa chỉ Email"
// - Label "Mật khẩu" -> "Mật khẩu đăng nhập"
// - Link text "Đăng ký ngay" -> "Tạo tài khoản mới"
// - data-testid bị XÓA hoàn toàn (hệ thống không tìm thấy qua testid)
// - role="button" thêm vào submit
// - href của link register đổi sang /sign-up

const Login = () =>{
    const [user, setUser] = useState({email:'' ,password:''});
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const validateEmail = (email)=>{
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    const handleEmailChange=(e)=>{
        const val=e.target.value;
        setUser({...user,email:val});
        if (val&& !validateEmail(val)){
            setEmailError('Email không hợp lệ!')
        }
        else{
            setEmailError('')
        }
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        if(!validateEmail(user.email)){
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
            console.error(err);
            alert(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    };
    return (
        <div className="container mt-5">
            <div className="card mx-auto shadow" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                <div className="card-body p-4">
                    <h3 className="text-center fw-bold mb-4">Chào mừng trở lại</h3>
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Địa chỉ Email</label>
                            <input 
                                type="email" 
                                id="login-email"
                                className="form-control" 
                                placeholder="name@example.com" 
                                required
                                value={user.email}
                                onChange={handleEmailChange} 
                            />
                            {emailError &&(<div className="invalid-feedback">{emailError}</div>)}
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold">Mật khẩu đăng nhập</label>
                            <input 
                                type="password" 
                                id="login-password"
                                className="form-control" 
                                placeholder="••••••••" 
                                required
                                onChange={e => setUser({ ...user, password: e.target.value })} 
                            />
                        </div>
                        <button id="btn-login" role="button" className="btn btn-primary w-100 py-2 fw-bold">Xác nhận &amp; Đăng nhập</button>
                    </form>
                    <div className="text-center mt-3">
                        <small className="text-muted">Chưa có tài khoản? <a href="/sign-up" className="text-decoration-none">Tạo tài khoản mới</a></small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;