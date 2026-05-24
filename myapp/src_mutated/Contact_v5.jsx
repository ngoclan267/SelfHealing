import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V5: Context only - breadcrumb, contact info sidebar, nearby helper text, disclaimer
// data-testid DELETED completely
// UNCHANGED: text labels/button, id, name, placeholder, structure, visual

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors] = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');
    const validate = () => {
        const e = { name: '', phone: '', message: '' }; let ok = true;
        if (!formData.name.trim()) { e.name = 'Vui lòng nhập họ và tên.'; ok = false; }
        if (!formData.phone.trim()) { e.phone = 'Vui lòng nhập số điện thoại.'; ok = false; }
        else if (!/^\d{10}$/.test(formData.phone.trim())) { e.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'; ok = false; }
        if (!formData.message.trim()) { e.message = 'Vui lòng nhập lời nhắn.'; ok = false; }
        else if (formData.message.trim().length > 500) { e.message = `Lời nhắn không được vượt quá 500 ký tự (hiện tại: ${formData.message.trim().length}).`; ok = false; }
        setErrors(e); return ok;
    };
    const handleChange = (field, value) => { setFormData({ ...formData, [field]: value }); if (errors[field]) setErrors({ ...errors, [field]: '' }); };
    const handleSubmit = async (e) => {
        e.preventDefault(); if (!validate()) return;
        try { await axios.post('http://localhost:5000/api/contact', formData); alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm! ^^'); setFormData({ name: '', phone: '', message: '' }); }
        catch { alert('Có lỗi xảy ra, vui lòng thử lại!!!'); }
    };
    if (!token) return (
        <div className="container mt-5">
            <div className="card p-5 text-center shadow-sm border-0">
                <h3 className="text-danger fw-bold">Opps! Bạn chưa đăng nhập</h3>
                <p className="text-muted">Vui lòng đăng nhập để sử dụng tính năng gửi liên hệ.</p>
                <div className="mt-3"><Link to="/login" className="btn btn-primary px-4 rounded-pill">Đăng nhập ngay</Link></div>
            </div>
        </div>
    );
    return (
        <div className="container mt-5">
            {/* Context: breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small">
                    <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
                    <li className="breadcrumb-item active">Liên hệ</li>
                </ol>
            </nav>
            <p className="text-muted mb-4">Hãy để lại thông tin, đội ngũ hỗ trợ sẽ phản hồi trong vòng 24 giờ.</p>
            <div className="row g-4">
                {/* Context: contact info sidebar */}
                <div className="col-md-4">
                    <div className="card border-0 bg-light p-4 h-100">
                        <h6 className="fw-bold mb-3">Thông tin liên hệ</h6>
                        <p className="small text-muted mb-2">📍 123 Lê Lợi, Quận 1, TP.HCM</p>
                        <p className="small text-muted mb-2">📞 1800-xxxx (miễn phí)</p>
                        <p className="small text-muted mb-2">✉️ support@applestore.vn</p>
                        <hr />
                        <h6 className="fw-bold mb-2">Giờ làm việc</h6>
                        <p className="small text-muted mb-1">Thứ 2 - Thứ 6: 8:00 - 20:00</p>
                        <p className="small text-muted">Thứ 7 - CN: 9:00 - 17:00</p>
                    </div>
                </div>
                <div className="col-md-8">
                    <div className="card p-4 shadow">
                        <h2 className="text-center mb-4">Liên hệ với chúng tôi</h2>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-3">
                                <label className="form-label">Họ và tên</label>
                                {/* Context: nearby helper */}
                                <small className="text-muted d-block mb-1">VD: Nguyễn Văn A</small>
                                <input type="text" id="contact-name" placeholder="Nhập họ và tên của bạn"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Số điện thoại</label>
                                <small className="text-muted d-block mb-1">VD: 0912 345 678</small>
                                <input type="text" id="contact-phone" placeholder="Nhập số điện thoại (10 chữ số)"
                                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                    value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Lời nhắn <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>({formData.message.length}/500)</span></label>
                                <small className="text-muted d-block mb-1">Mô tả ngắn gọn vấn đề cần hỗ trợ</small>
                                <input type="text" id="contact-mess" placeholder="Nhập lời nhắn của bạn (tối đa 500 ký tự)"
                                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                    value={formData.message} onChange={(e) => handleChange('message', e.target.value)} />
                                {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                            </div>
                            {/* Context: disclaimer near button */}
                            <small className="text-muted d-block mb-3">Bằng cách gửi, bạn đồng ý để chúng tôi liên hệ lại theo thông tin trên.</small>
                            <div className="row justify-content-center mb-3">
                                <button type="submit" className="btn btn-primary w-17 rounded-pill fw-bold">Gửi thông tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Contact;