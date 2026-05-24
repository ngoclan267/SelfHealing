import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// V3: Structure only changes
// - Wrap form trong article > header + main
// - Email field: div.mb-3 -> div.form-group > label + div.input-container > input
// - Password field tương tự
// - Button wrap thêm footer.form-footer
// - Link nằm trong footer thay vì div.text-center
// - data-testid đổi prefix "v3-reg-"

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
            const res = await axios.post('http://localhost:5000/api/auth/register', user);
            alert(res.data.message || "Đăng ký thành công!");
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đăng ký thất bại, email có thể đã tồn tại!");
        }
    };

    return (
        <div className="container mt-5">
            <div className="card mx-auto shadow" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                <div className="card-body p-4">
                    <article className="register-article">
                        <header className="register-header mb-4">
                            <h3 className="text-center fw-bold">Đăng ký tài khoản</h3>
                        </header>
                        <main className="register-main">
                            <form onSubmit={handleRegister}>
                                <div className="form-group mb-3">
                                    <label className="form-label small fw-bold">Email</label>
                                    <div className="input-container">
                                        <input 
                                            type="email" 
                                            id="register-email"
                                            data-testid="v3-reg-email"
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
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label small fw-bold">Mật khẩu</label>
                                    <div className="input-container">
                                        <input 
                                            type="password" 
                                            id="register-password"
                                            data-testid="v3-reg-password"
                                            className="form-control" 
                                            placeholder="••••••••" 
                                            required
                                            onChange={e => setUser({ ...user, password: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div className="form-group mb-2">
                                    <button data-testid="v3-reg-btn-submit" className="btn btn-success w-100 py-2 fw-bold mt-2">Đăng ký</button>
                                </div>
                            </form>
                        </main>
                        <footer className="register-footer text-center mt-3">
                            <p className="mb-0">
                                <small className="text-muted">Đã có tài khoản? <Link to="/login" className="text-decoration-none">Đăng nhập</Link></small>
                            </p>
                        </footer>
                    </article>
                </div>
            </div>
        </div>
    );
}

export default Register;