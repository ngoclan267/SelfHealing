import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [user, setUser] = useState({ email: '', password: '', role: 'user' });
    const [emailError, setEmailError]=useState('');
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
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)){
            setEmailError('Vui lòng nhập dùng định dạng email!');
            return
        }
        try {
            // Gửi yêu cầu đăng ký đến Backend
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Đăng ký thành công!");
            navigate('/login'); // Chuyển hướng sang trang đăng nhập sau khi thành công
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đăng ký thất bại, email có thể đã tồn tại!");
        }
    };

    return (
        <div className="container mt-5">
            <div className="card mx-auto shadow" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                <div className="card-body p-4">
                    <h3 className="text-center fw-bold mb-4">Đăng ký tài khoản</h3>
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Email</label>
                            <input 
                                type="email" 
                                id="register-email"
                                data-testid="register-email"
                                className="form-control" 
                                placeholder="name@example.com" 
                                required
                                value={user.email}
                                onChange={handleEmailChange} 
                            />
                            {emailError&&(
                                <div className='invalid-feedback'>
                                    {emailError}
                                </div>
                            )}
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Mật khẩu</label>
                            <input 
                                type="password" 
                                id="register-password"
                                data-testid="register-password"
                                className="form-control" 
                                placeholder="••••••••" 
                                required
                                onChange={e => setUser({ ...user, password: e.target.value })} 
                            />
                        </div>
                        <button data-testid="btn-register" className="btn btn-success w-100 py-2 fw-bold mt-2">Đăng ký</button>
                    </form>
                    <div className="text-center mt-3">
                        <small className="text-muted">Đã có tài khoản? <Link to="/login" className="text-decoration-none">Đăng nhập</Link></small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;