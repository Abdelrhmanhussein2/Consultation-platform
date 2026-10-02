// frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div style={{
          padding: '40px 24px',
          margin: '20px auto',
          maxWidth: '680px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(13, 60, 92, 0.1)',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          direction: 'rtl',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#0D3C5C', fontSize: '20px', marginBottom: '10px', fontWeight: 800 }}>
            {this.props.title || 'حدث خطأ غير متوقع أثناء عرض المحتوى'}
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            نعتذر، واجه النظام مشكلة مؤقتة في تحميل هذه النافذة. يمكنك إعادة المحاولة الآن.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#DC2626',
              textAlign: 'left',
              direction: 'ltr',
              overflowX: 'auto',
              marginBottom: '20px'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                background: '#0D3C5C',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              إعادة المحاولة
            </button>
            {this.props.onClose && (
              <button
                onClick={this.props.onClose}
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
