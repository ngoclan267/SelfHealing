import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V7: Structure + Visual
// Structure: form fields reordered (phone first, name second, message last), wrapper depths changed
// Visual: button color changed, layout from centered col to full-width row; data-testid đổi
const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors]     = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;
        if (!formData.name.trim()) { newErrors.name = 'Vui lòng nhập họ và tên.'; isValid = false; }
        if (!formData.phone.trim()) { newErrors.phone = 'Vui lòng nhập số điện thoại.'; isValid = false; }
        else if (!/^\d{10}$/.test(formData.phone.trim())) { newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'; isValid = false; }
        if (!formData.message.trim()) { newErrors.message = 'Vui lòng nhập lời nhắn.'; isValid = false; }
        else if (formData.message.trim().length > 500) { newErrors.message = `Lời nhắn không được vượt quá 500 ký tự.`; isValid = false; }
        setErrors(newErrors);
        return isValid;
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
            setErrors({ name: '', phone: '', message: '' });
        } catch (err) { alert('Có lỗi xảy ra, vui lòng thử lại!!!'); }
    };

    if (!token) {
        return (
            // Structure: different wrapper
            <div className="min-vh-50 d-flex align-items-center justify-content-center mt-5">
                <div className="text-center p-5">
                    <h3 className="text-danger fw-bold">Opps! Bạn chưa đăng nhập</h3>
                    <p className="text-muted">Vui lòng đăng nhập để sử dụng tính năng gửi liên hệ.</p>
                    <Link to="/login" className="btn btn-dark px-4 rounded-pill mt-2">Đăng nhập ngay</Link>
                </div>
            </div>
        );
    }

    return (
        // Structure: container -> container-md, removed row/col wrapper
        <div className="container-md mt-5">
            <div className="card p-4 shadow rounded-4">
                <h2 className="text-center mb-4">Liên hệ với chúng tôi</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {/* Structure: PHONE field moved FIRST */}
                    <div className="mb-3">
                        <label className="form-label">Số điện thoại</label>
                        <input
                            type="text"
                            id="contact-phone"
                            data-testid="ctrl-contact-phone"
                            placeholder="Nhập số điện thoại (10 chữ số)"
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                        {errors.phone && <div className="invalid-feedback" data-testid="err-phone">{errors.phone}</div>}
                    </div>

                    {/* Structure: NAME field SECOND */}
                    <div className="mb-3">
                        <label className="form-label">Họ và tên</label>
                        <input
                            type="text"
                            id="contact-name"
                            data-testid="ctrl-contact-name"
                            placeholder="Nhập họ và tên của bạn"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        {errors.name && <div className="invalid-feedback" data-testid="err-name">{errors.name}</div>}
                    </div>

                    {/* Structure: message LAST, same as before but different sibling index */}
                    <div className="mb-3">
                        <label className="form-label">
                            Lời nhắn
                            <span className="text-muted ms-2" style={{ fontSize: '0.85em' }}>({formData.message.length}/500)</span>
                        </label>
                        <input
                            type="text"
                            id="contact-mess"
                            data-testid="ctrl-contact-mess"
                            placeholder="Nhập lời nhắn của bạn (tối đa 500 ký tự)"
                            className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                        />
                        {errors.message && <div className="invalid-feedback" data-testid="err-mess">{errors.message}</div>}
                    </div>

                    {/* Visual: btn-primary -> btn-dark, d-grid instead of row justify-content-center */}
                    <div className="d-grid mt-4">
                        <button type="submit" data-testid="submit-contact" className="btn btn-dark rounded-pill fw-bold py-2">
                            Gửi thông tin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Contact;