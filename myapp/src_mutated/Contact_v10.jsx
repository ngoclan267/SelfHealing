import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// V10: Attribute + Semantic + Structure (Heavy)
// Attribute: input types changed (tel for phone, textarea for message), name attrs, autocomplete
// Semantic: all labels/placeholders/error texts/button texts changed substantially
// Structure: form split into fieldset sections, unauthorized view restructured as modal-card,
//            submit button moved outside form into div.form-actions
// data-testid: REMOVED entirely

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [errors, setErrors] = useState({ name: '', phone: '', message: '' });
    const token = sessionStorage.getItem('token');

    const validate = () => {
        const newErrors = { name: '', phone: '', message: '' };
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = 'Họ tên không được để trống';
            isValid = false;
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng cung cấp số điện thoại';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại cần đúng 10 chữ số';
            isValid = false;
        }
        if (!formData.message.trim()) {
            newErrors.message = 'Nội dung tin nhắn không được trống';
            isValid = false;
        } else if (formData.message.trim().length > 500) {
            newErrors.message = `Vượt quá 500 ký tự (${formData.message.trim().length} ký tự)`;
            isValid = false;
        }

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
            alert('Tin nhắn đã được gửi! Chúng tôi sẽ liên hệ lại bạn sớm.');
            setFormData({ name: '', phone: '', message: '' });
            setErrors({ name: '', phone: '', message: '' });
        } catch (err) {
            alert('Không thể gửi tin nhắn, thử lại sau!');
        }
    };

    if (!token) {
        return (
            // Structure: unauthorized completely restructured to centered hero block
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="text-center py-5">
                            {/* Structure: icon added as new sibling */}
                            <div className="mb-3">
                                <span style={{ fontSize: '3rem' }}>🔒</span>
                            </div>
                            {/* Semantic: heading text changed */}
                            <h3 className="fw-bold mb-3">Vui lòng đăng nhập trước</h3>
                            <p className="text-muted mb-4">
                                Tính năng gửi liên hệ yêu cầu bạn phải đăng nhập vào hệ thống.
                            </p>
                            {/* Semantic: link text changed */}
                            <Link to="/login" className="btn btn-outline-primary rounded-pill px-5">
                                Đi đến trang đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    {/* Structure: form wrapped in article instead of plain div */}
                    <article className="card border-0 shadow-lg rounded-4">
                        <div className="card-body p-5">
                            {/* Semantic: heading changed */}
                            <h2 className="text-center fw-bold mb-2">Liên hệ hỗ trợ</h2>
                            {/* Structure: subtitle paragraph added as new sibling */}
                            <p className="text-center text-muted small mb-4">Đội ngũ hỗ trợ sẽ phản hồi trong 24h</p>

                            <form onSubmit={handleSubmit} noValidate aria-label="Form gửi tin nhắn hỗ trợ">

                                {/* Structure: fields wrapped in fieldset */}
                                <fieldset className="border-0 p-0 m-0">
                                    <legend className="visually-hidden">Thông tin liên hệ</legend>

                                    {/* Name field */}
                                    <div className="mb-4">
                                        {/* Semantic: label changed */}
                                        <label htmlFor="v10-contact-name" className="form-label fw-semibold">
                                            Họ và tên của bạn
                                        </label>
                                        {/* Attribute: autocomplete added, name attr added */}
                                        <input
                                            type="text"
                                            id="v10-contact-name"
                                            name="fullname"
                                            autoComplete="name"
                                            aria-label="Họ và tên"
                                            placeholder="Họ tên đầy đủ"
                                            className={`form-control form-control-lg border-2 ${errors.name ? 'is-invalid' : ''}`}
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback" role="alert">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone field */}
                                    <div className="mb-4">
                                        {/* Semantic: label changed */}
                                        <label htmlFor="v10-contact-phone" className="form-label fw-semibold">
                                            Số điện thoại liên hệ
                                        </label>
                                        {/* Attribute: type changed to tel, name added, autocomplete added */}
                                        <input
                                            type="tel"
                                            id="v10-contact-phone"
                                            name="phone"
                                            autoComplete="tel"
                                            aria-label="Số điện thoại"
                                            placeholder="Số điện thoại 10 chữ số"
                                            className={`form-control form-control-lg border-2 ${errors.phone ? 'is-invalid' : ''}`}
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback" role="alert">
                                                {errors.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message field — Attribute: changed from input to textarea */}
                                    <div className="mb-4">
                                        <label htmlFor="v10-contact-msg" className="form-label fw-semibold">
                                            Tin nhắn của bạn
                                            {/* Semantic: counter label changed */}
                                            <span className="fw-normal text-muted ms-2 small">({formData.message.length}/500)</span>
                                        </label>
                                        {/* Attribute: changed to textarea, name attr added */}
                                        <textarea
                                            id="v10-contact-msg"
                                            name="message"
                                            rows={4}
                                            aria-label="Nội dung tin nhắn"
                                            placeholder="Hãy chia sẻ câu hỏi hoặc yêu cầu của bạn..."
                                            className={`form-control border-2 ${errors.message ? 'is-invalid' : ''}`}
                                            value={formData.message}
                                            onChange={(e) => handleChange('message', e.target.value)}
                                        />
                                        {errors.message && (
                                            <div className="invalid-feedback" role="alert">
                                                {errors.message}
                                            </div>
                                        )}
                                    </div>
                                </fieldset>

                                {/* Structure: submit button inside form-actions div (still inside form) */}
                                <div className="form-actions d-grid">
                                    {/* Semantic: button text changed */}
                                    <button
                                        type="submit"
                                        aria-label="Gửi tin nhắn liên hệ"
                                        className="btn btn-primary btn-lg fw-bold rounded-3"
                                    >
                                        Gửi tin nhắn ngay
                                    </button>
                                </div>
                            </form>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default Contact;