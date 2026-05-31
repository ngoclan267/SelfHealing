import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V11 Changes:
// [Visual]      - Outer container: added background color (#fafbfc), padding, borderRadius style
// [Visual]      - Card: new boxShadow, borderColor changed, borderRadius 14px
// [Visual]      - Submit button: changed to btn-success, added borderRadius inline style, changed width class
// [Visual]      - Form heading size changed via inline style; added color
// [Visual]      - Char counter span: changed fontSize and color style
// [Context]     - Page heading: "Liên hệ với chúng tôi" → "Gửi yêu cầu hỗ trợ"
// [Context]     - Label "Họ và tên" → "Tên đầy đủ"; "Số điện thoại" → "Số ĐT liên lạc"; "Lời nhắn" → "Nội dung yêu cầu"
// [Context]     - Placeholder texts all changed to new descriptive text
// [Context]     - Submit button text: "Gửi thông tin" → "Gửi yêu cầu ngay"
// [Context]     - Unauthenticated message: heading/description text changed
// [Attribute]   - data-testid="contact-name" → data-field="full-name"
// [Attribute]   - data-testid="contact-phone" → data-field="phone-number"
// [Attribute]   - data-testid="contact-mess" → data-field="user-message"
// [Attribute]   - data-testid="btn-contact-submit" → removed (no testid on button)
// [Attribute]   - data-testid="error-contact-name" → data-error="name-error"
// [Attribute]   - data-testid="error-contact-phone" → data-error="phone-error"
// [Attribute]   - data-testid="error-contact-mess" → data-error="message-error"
// [Attribute]   - id attributes added: id="contact-name", id="contact-phone", id="contact-mess"
// [Attribute]   - input type for message: kept text but added maxLength="500"

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors]     = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập họ và tên.';
            isValid = false;
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại.';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.';
            isValid = false;
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Vui lòng nhập nội dung yêu cầu.';
            isValid = false;
        } else if (formData.message.trim().length > 500) {
            newErrors.message = `Nội dung không được vượt quá 500 ký tự (hiện tại: ${formData.message.trim().length}).`;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await axios.post('http://localhost:5000/api/contact', formData);
            alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm! ^^');
            setFormData({ name: '', phone: '', message: '' });
            setErrors({ name: '', phone: '', message: '' });
        } catch (err) {
            alert('Có lỗi xảy ra, vui lòng thử lại!!!');
        }
    };

    if (!token) {
        return (
            <div className="container mt-5">
                <div className="card p-5 text-center shadow-sm border-0">
                    <h3 className="text-warning fw-bold">Yêu cầu đăng nhập</h3>
                    <p className="text-muted">
                        Bạn cần đăng nhập trước khi gửi yêu cầu hỗ trợ.
                    </p>
                    <div className="mt-3">
                        <Link to="/login" className="btn btn-outline-primary px-4 rounded-pill">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="container mt-5"
            style={{ background: '#fafbfc', padding: '24px', borderRadius: '10px' }}
        >
            <div className="row justify-content-center">
                <div
                    className="col-md-6 card p-4"
                    style={{
                        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                        borderRadius: '14px',
                        border: '1px solid #e3e8ef'
                    }}
                >
                    <h2
                        className="text-center mb-4"
                        style={{ fontSize: '1.5rem', color: '#2c3e50' }}
                    >
                        Gửi yêu cầu hỗ trợ
                    </h2>

                    <form onSubmit={handleSubmit} noValidate>

                        <div className="mb-3">
                            <label htmlFor="contact-name" className="form-label">Tên đầy đủ</label>
                            <input
                                type="text"
                                id="contact-name"
                                data-field="full-name"
                                placeholder="Họ và tên đầy đủ của bạn"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                            {errors.name && (
                                <div className="invalid-feedback" data-error="name-error">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="contact-phone" className="form-label">Số ĐT liên lạc</label>
                            <input
                                type="text"
                                id="contact-phone"
                                data-field="phone-number"
                                placeholder="Số điện thoại (10 chữ số)"
                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                            {errors.phone && (
                                <div className="invalid-feedback" data-error="phone-error">
                                    {errors.phone}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="contact-mess" className="form-label">
                                Nội dung yêu cầu
                                <span
                                    className="ms-2"
                                    style={{ fontSize: '0.8em', color: '#888' }}
                                >
                                    ({formData.message.length}/500)
                                </span>
                            </label>
                            <input
                                type="text"
                                id="contact-mess"
                                data-field="user-message"
                                placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ"
                                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                value={formData.message}
                                maxLength="500"
                                onChange={(e) => handleChange('message', e.target.value)}
                            />
                            {errors.message && (
                                <div className="invalid-feedback" data-error="message-error">
                                    {errors.message}
                                </div>
                            )}
                        </div>

                        <div className="row justify-content-center mb-3">
                            <button
                                type="submit"
                                className="btn btn-success fw-bold"
                                style={{ borderRadius: '20px', padding: '8px 32px' }}
                            >
                                Gửi yêu cầu ngay
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;