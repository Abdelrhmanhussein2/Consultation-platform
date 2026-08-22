import React from 'react';
import './Footer.css';

export default function Footer({ openPolicy, navigate }) {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  const handlePolicyClick = (e, type) => {
    e.preventDefault();
    openPolicy(type);
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* 1. Brand & info column (Right-most in RTL) */}
        <div className="footer-column footer-brand-col">
          <div className="footer-logo-wrapper">
            <img src="/logo_white.png" alt="ديوان" className="footer-logo" />
          </div>
          <p className="brand-description">
            المنصة الأولى للاستشارات الضريبية المدعومة بتقنيات الذكاء الاصطناعي في المملكة الأردنية الهاشمية
          </p>
        </div>

        {/* 2. Important links column (Second) */}
        <div className="footer-column">
          <h3>روابط مهمة</h3>
          <ul>
            <li>
              <a href="/" onClick={(e) => handleNavClick(e, '/')}>
                الرئيسية
              </a>
            </li>
            <li>
              <a href="/policies" onClick={(e) => handleNavClick(e, '/policies')}>
                مركز السياسات
              </a>
            </li>
            <li>
              <a href="/" onClick={(e) => handleNavClick(e, '/')}>
                تسجيل الدخول
              </a>
            </li>
          </ul>
        </div>

        {/* 3. Legal info column (Third) */}
        <div className="footer-column">
          <h3>المعلومات القانونية</h3>
          <ul>
            <li>
              <a href="#privacy" onClick={(e) => handlePolicyClick(e, 'privacy_policy')}>
                سياسة الخصوصية
              </a>
            </li>
            <li>
              <a href="#terms" onClick={(e) => handlePolicyClick(e, 'terms_and_conditions')}>
                شروط الاستخدام
              </a>
            </li>
            <li>
              <a href="#ai-policy" onClick={(e) => handlePolicyClick(e, 'ai_assistant_disclosure')}>
                سياسة الذكاء الاصطناعي
              </a>
            </li>
            <li>
              <a href="#cookies" onClick={(e) => handlePolicyClick(e, 'cookie_policy')}>
                سياسة الكوكيز
              </a>
            </li>
          </ul>
        </div>

        {/* 4. Contact info column (Left-most in RTL) */}
        <div className="footer-column footer-contact">
          <h3>للتواصل</h3>
          <p className="contact-item">
            <a href="mailto:info@diwanjo.com">info@diwanjo.com</a>
          </p>
          <p className="contact-item">المملكة الأردنية الهاشمية</p>
          <div className="social-links">
            {/* X (formerly Twitter) */}
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} منصة ديوان للاستشارات الضريبية الذكية. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
