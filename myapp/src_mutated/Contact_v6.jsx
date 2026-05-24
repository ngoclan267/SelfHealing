import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V6: Attribute + Semantic
// data-testid "v6-", id/name/aria changed; label text, button text, title changed
// UNCHANGED: structure, visual, context

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors] = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');
    const validate = () => {
        const e = { name: '', phone: '', message: '' }; let ok = true;
        if (!formData.name.trim()) { e.name = 'Vui lòng nhập tên.'; ok = false; }
        if (!formData.phone.trim()) { e.phone = 'Vui lòng nhập SĐT.'; ok = false; }
        else if (!/^\\d{10}$/.test(formData.phone.trim())) { e.phone = 'SĐT phải đúng 10 số.'; ok = false; }
        if (!formData.message.trim()) { e.message = 'Vui lòng nhập nội dung.'; ok = false; }
        else if (formData.message.trim().length > 500) { e.message = 'Tối đa 500 ký tự.'; ok = false; }
        setErrors(e); return ok;
    };
    const handleChange = (f, v) => { setFormData({ ...formData, [f]: v }); if (errors[f]) setErrors({ ...errors, [f]: '' }); };
    const handleSubmit = async (e) => {
        e.preventDefault(); if (!validate()) return;
        try { await axios.post('http://localhost:5000/api/contact', formData); alert('Gửi thành công!'); setFormData({ name: '', phone: '', message: '' }); }
        catch { alert('Lỗi, thử lại!'); }
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
            <div className="row justify-content-center">
                <div className="col-md-6 card p-4 shadow">
                    <h2 className="text-center mb-4">Gửi tin nhắn cho chúng tôi</h2>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-3">
                            <label className="form-label">Tên người liên hệ</label>
                            <input type="text" id="sender-name-field" data-testid="v6-contact-name"
                                name="senderName" aria-label="Tên người gửi liên hệ"
                                placeholder="Họ tên đầy đủ của bạn"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                            {errors.name && <div className="invalid-feedback" data-testid="v6-err-name">{errors.name}</div>}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Số điện thoại liên lạc</label>
                            <input type="text" id="sender-phone-field" data-testid="v6-contact-phone"
                                name="senderPhone" aria-label="Số điện thoại liên lạc"
                                placeholder="SĐT để chúng tôi gọi lại (10 số)"
                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                            {errors.phone && <div className="invalid-feedback" data-testid="v6-err-phone">{errors.phone}</div>}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nội dung tin nhắn
                                <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>({formData.message.length}/500)</span>
                            </label>
                            <input type="text" id="sender-message-field" data-testid="v6-contact-mess"
                                name="senderMessage" aria-label="Nội dung tin nhắn gửi đi"
                                placeholder="Bạn muốn hỏi gì? (tối đa 500 ký tự)"
                                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                value={formData.message} onChange={(e) => handleChange('message', e.target.value)} />
                            {errors.message && <div className="invalid-feedback" data-testid="v6-err-mess">{errors.message}</div>}
                        </div>
                        <div className="row justify-content-center mb-3">
                            <button type="submit" data-testid="v6-btn-contact-submit"
                                aria-label="Gửi tin nhắn liên hệ"
                                className="btn btn-primary w-17 rounded-pill fw-bold">Gửi tin nhắn</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Contact;