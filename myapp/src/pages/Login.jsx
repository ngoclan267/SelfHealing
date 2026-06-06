import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [user, setUser] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setUser({ ...user, email: val });
        if (val && !validateEmail(val)) {
            setEmailError('Địa chỉ email không đúng định dạng');
        } else {
            setEmailError('');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(user.email)) {
            setEmailError('Hãy kiểm tra lại địa chỉ email của bạn');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', user);
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            alert("Chào mừng trở lại!");
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Thông tin đăng nhập không chính xác!");
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Courier New', monospace"
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '0 16px'
            }}>
                {/* Header nằm dưới form — context đổi */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '4px',
                    padding: '40px 36px',
                    backdropFilter: 'blur(12px)'
                }}>
                    {/* MẬT KHẨU trước, EMAIL sau — đảo vị trí */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: '#a0a0b0',
                            fontSize: '11px',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '8px'
                        }}>
                            MẬT KHẨU BÍ MẬT
                        </label>
                        <input
                            type="password"
                            id="user-secret"
                            data-id="secret-field"
                            placeholder="Nhập mật khẩu của bạn"
                            required
                            onChange={e => setUser({ ...user, password: e.target.value })}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '4px',
                                padding: '12px 14px',
                                color: '#e0e0f0',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            color: '#a0a0b0',
                            fontSize: '11px',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '8px'
                        }}>
                            ĐỊA CHỈ THƯ ĐIỆN TỬ
                        </label>
                        <input
                            type="email"
                            id="user-mail"
                            data-id="mail-field"
                            placeholder="yourname@domain.com"
                            required
                            value={user.email}
                            onChange={handleEmailChange}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.06)',
                                border: emailError
                                    ? '1px solid #ff6b6b'
                                    : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '4px',
                                padding: '12px 14px',
                                color: '#e0e0f0',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        {emailError && (
                            <p style={{ color: '#ff6b6b', fontSize: '12px', margin: '6px 0 0' }}>
                                ⚠ {emailError}
                            </p>
                        )}
                    </div>

                    {/* Button bên trái — đổi vị trí & màu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            id="submit-access"
                            data-action="access"
                            onClick={handleLogin}
                            style={{
                                background: '#00d4aa',
                                color: '#0f0c29',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '12px 28px',
                                fontWeight: '700',
                                fontSize: '13px',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                fontFamily: "'Courier New', monospace"
                            }}
                        >
                            TRUY CẬP →
                        </button>
                        <a href="/register" style={{
                            color: '#7c7ca0',
                            fontSize: '12px',
                            textDecoration: 'none'
                        }}>
                            Tạo tài khoản mới
                        </a>
                    </div>

                    {/* Tiêu đề ở DƯỚI — đảo vị trí */}
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        marginTop: '32px',
                        paddingTop: '24px',
                        textAlign: 'right'
                    }}>
                        <h2 style={{
                            color: 'rgba(255,255,255,0.15)',
                            fontSize: '32px',
                            fontWeight: '900',
                            letterSpacing: '-1px',
                            margin: 0
                        }}>
                            TRUY CẬP
                        </h2>
                        <p style={{ color: '#555570', fontSize: '11px', margin: '4px 0 0' }}>
                            hệ thống quản lý cửa hàng
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;