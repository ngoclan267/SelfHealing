import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V7: Structure + Visual
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
        // Structure: row/col wrapping thay đổi
        <div className="row justify-content-center mt-5">
            <div className="col-12 col-sm-8 col-md-5">
                <div className="text-center mb-3">
                    <h3 className="fw-bold">Đăng ký tài khoản</h3>
                </div>
                <div className="card border-0 shadow-lg rounded-4 p-4">
                    {/* Structure: link moved to TOP of form area */}
                    <div className="text-center mb-3 pb-2 border-bottom">
                        <small className="text-muted">Đã có tài khoản? <Link to="/login" className="text-dark fw-bold text-decoration-none">Đăng nhập</Link></small>
                    </div>
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Email</label>
                            <input 
                                type="email" 
                                id="register-email"
                                data-testid="field-register-email"
                                className="form-control form-control-lg"
                                placeholder="name@example.com" 
                                required
                                value={user.email}
                                onChange={handleEmailChange} 
                            />
                            {emailError&&<div className='invalid-feedback d-block small text-danger mt-1'>{emailError}</div>}
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Mật khẩu</label>
                            <input 
                                type="password" 
                                id="register-password"
                                data-testid="field-register-password"
                                className="form-control form-control-lg"
                                placeholder="••••••••" 
                                required
                                onChange={e => setUser({ ...user, password: e.target.value })} 
                            />
                        </div>
                        {/* Visual: btn-success -> btn-dark */}
                        <button data-testid="action-register" className="btn btn-dark w-100 py-3 fw-bold mt-2 rounded-3">Đăng ký</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;