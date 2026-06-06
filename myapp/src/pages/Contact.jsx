import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V4: Visual only - 2 col layout, dark left info panel, form-control-lg inputs
// data-testid prefix "v4-"
// UNCHANGED: text labels/button, id, name, placeholder, structure DOM, context

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors] = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' }; let isValid = true;
        if (!formData.name.trim()) { newErrors.name = 'Vui lòng nhập họ và tên.'; isValid = false; }
        if (!formData.phone.trim()) { newErrors.phone = 'Vui lòng nhập số điện thoại.'; isValid = false; }
        else if (!/^\d{10}$/.test(formData.phone.trim())) { newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'; isValid = false; }
        if (!formData.message.trim()) { newErrors.message = 'Vui lòng nhập lời nhắn.'; isValid = false; }
        else if (formData.message.trim().length > 500) { newErrors.message = `Lời nhắn không được vượt quá 500 ký tự.`; isValid = false; }
        setErrors(newErrors); return isValid;
    };
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await axios.post('http://localhost:5000/api/contact', formData);
            alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm! ^^');
            setFormData({ name: '', phone: '', message: '' });
        } catch { alert('Có lỗi xảy ra, vui lòng thử lại!!!'); }
    };

    if (!token) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fff5f5' }}>
            <div className="text-center p-5">
                <h3 className="text-danger fw-bold">Opps! Bạn chưa đăng nhập</h3>
                <p className="text-muted mb-4">Vui lòng đăng nhập để sử dụng tính năng gửi liên hệ.</p>
                <Link to="/login" className="btn btn-danger px-5 py-2 rounded-pill">Đăng nhập ngay</Link>
            </div>
        </div>
    );

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)', padding: '60px 20px' }}>
            <div className="row justify-content-center g-0" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="col-md-4 d-flex align-items-center justify-content-center p-5 rounded-start"
                    style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                    <div>
                        <h4 className="fw-bold mb-3">Liên hệ với chúng tôi</h4>
                        <p className="opacity-75 small">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn 24/7.</p>
                    </div>
                </div>
                <div className="col-md-8 p-5 bg-white rounded-end shadow-lg">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-4">
                            <label className="form-label fw-bold" style={{ color: '#2c3e50', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Họ và tên</label>
                            <input type="text" id="contact-name" data-testid="v4-contact-name"
                                placeholder="Nhập họ và tên của bạn"
                                className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                                style={{ borderRadius: '4px', border: '1px solid #ddd' }}
                                value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                            {errors.name && <div className="invalid-feedback" data-testid="v4-err-contact-name">{errors.name}</div>}
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold" style={{ color: '#2c3e50', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Số điện thoại</label>
                            <input type="text" id="contact-phone" data-testid="v4-contact-phone"
                                placeholder="Nhập số điện thoại (10 chữ số)"
                                className={`form-control form-control-lg ${errors.phone ? 'is-invalid' : ''}`}
                                style={{ borderRadius: '4px', border: '1px solid #ddd' }}
                                value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                            {errors.phone && <div className="invalid-feedback" data-testid="v4-err-contact-phone">{errors.phone}</div>}
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold" style={{ color: '#2c3e50', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Lời nhắn <span className="fw-normal text-muted" style={{ fontSize: '11px', textTransform: 'none' }}>({formData.message.length}/500)</span>
                            </label>
                            <input type="text" id="contact-mess" data-testid="v4-contact-mess"
                                placeholder="Nhập lời nhắn của bạn (tối đa 500 ký tự)"
                                className={`form-control form-control-lg ${errors.message ? 'is-invalid' : ''}`}
                                style={{ borderRadius: '4px', border: '1px solid #ddd' }}
                                value={formData.message} onChange={(e) => handleChange('message', e.target.value)} />
                            {errors.message && <div className="invalid-feedback" data-testid="v4-err-contact-mess">{errors.message}</div>}
                        </div>
                        <button type="submit" data-testid="v4-btn-contact-submit"
                            className="btn btn-lg px-5"
                            style={{ backgroundColor: '#2c3e50', color: '#fff', borderRadius: '4px', fontWeight: '600' }}>
                            Gửi thông tin
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Contact;