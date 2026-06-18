import { useState } from "react";
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

// V3: Structure only changes
// - Email field: div.mb-3 -> fieldset > legend + div
// - Password field: div.mb-4 -> fieldset > legend + div
// - Button không còn nằm trực tiếp trong form mà wrap thêm div.button-group
// - form wrap thêm <section>
// - Link "Đăng ký" bây giờ nằm trong <p> thay vì <small>
// - card-body thêm thêm wrapper div.login-inner
// - data-testid đổi hoàn toàn (prefix "v3-")

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
                    <div className="login-inner">
                        <h3 className="text-center fw-bold mb-4">Đăng nhập</h3>
                        <section className="login-form-section">
                            <form onSubmit={handleLogin}>
                                <fieldset className="mb-3 border-0 p-0">
                                    <legend className="form-label small fw-bold">Email</legend>
                                    <div className="input-wrapper">
                                        <input 
                                            type="email" 
                                            id="login-email"
                                            data-testid="v3-login-email"
                                            className="form-control ${emailError ? 'is-invalid' : ''}`" 
                                            placeholder="name@example.com" 
                                            required
                                            value={user.email}
                                            onChange={handleEmailChange} 
                                        />
                                        {emailError &&(<div className="invalid-feedback">{emailError}</div>)}
                                    </div>
                                </fieldset>
                                <fieldset className="mb-4 border-0 p-0">
                                    <legend className="form-label small fw-bold">Mật khẩu</legend>
                                    <div className="input-wrapper">
                                        <input 
                                            type="password" 
                                            id="login-password"
                                            data-testid="v3-login-password"
                                            className="form-control" 
                                            placeholder="••••••••" 
                                            required
                                            onChange={e => setUser({ ...user, password: e.target.value })} 
                                        />
                                    </div>
                                </fieldset>
                                <div className="button-group d-grid">
                                    <div className="submit-wrapper">
                                        <button id="btn-login" data-testid="v3-btn-login" className="btn btn-primary w-100 py-2 fw-bold">Đăng nhập</button>
                                    </div>
                                </div>
                            </form>
                        </section>
                        <div className="text-center mt-3">
                            <p className="text-muted mb-0">
                                <small>Bạn chưa có tài khoản? <a href="/register" className="text-decoration-none">Đăng ký ngay</a></small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;