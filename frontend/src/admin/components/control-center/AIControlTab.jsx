import React, { useState, useEffect } from 'react';
import { getAIControlConfig, updateAIControlConfig } from '../../services/adminApi';

export default function AIControlTab() {
  const [config, setConfig] = useState({
    default_model: 'gpt-4-turbo',
    temperature: 0.2,
    max_tokens: 4096,
    enable_ai_auto_response: true,
    enable_smart_routing: true,
    enable_doc_extraction: true,
    enable_strict_guardrails: true
  });
  const [stats, setStats] = useState({
    total_tokens_month: 28600000,
    estimated_cost_usd: 412.70,
    failure_rate_pct: 1.8,
    requests_today: 18420
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await getAIControlConfig();
      if (data) {
        if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
        if (data.stats) setStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateAIControlConfig(config);
      setMessage('تم حفظ وحوكمة إعدادات الذكاء الاصطناعي بنجاح');
    } catch (err) {
      setMessage('فشل حفظ الإعدادات: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Top KPI Grid */}
      <div className="cc-kpi-grid">
        <div className="cc-kpi-card">
          <span>طلبات الذكاء الاصطناعي</span>
          <b>{stats.requests_today?.toLocaleString() || '18,420'}</b>
          <div className="cc-progress"><i style={{ width: '78%' }}></i></div>
        </div>

        <div className="cc-kpi-card">
          <span>معدل الفشل والتصعيد</span>
          <b>{stats.failure_rate_pct || '1.8'}%</b>
          <div className="cc-progress"><i style={{ width: '18%', background: '#ff3164' }}></i></div>
        </div>

        <div className="cc-kpi-card">
          <span>التكلفة التشغيلية (USD)</span>
          <b>${stats.estimated_cost_usd || '412.70'}</b>
          <div className="cc-progress"><i style={{ width: '56%', background: '#f5a52a' }}></i></div>
        </div>

        <div className="cc-kpi-card">
          <span>استهلاك التوكن الشهري</span>
          <b>{(stats.total_tokens_month / 1000000).toFixed(1)} مليون</b>
          <div className="cc-progress"><i style={{ width: '71%' }}></i></div>
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes('نجاح') ? '#e6f4ea' : '#fce8e6', color: message.includes('نجاح') ? '#137333' : '#dc2626', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 700 }}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="cc-content-box">
          جاري تحميل تهيئة وقواعد محرك الذكاء الاصطناعي...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          <div>
            <div className="cc-chart-container">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800 }}>إعدادات نموذج الذكاء الاصطناعي</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  نموذج الذكاء الاصطناعي المعرفي
                </label>
                <select
                  className="cc-select"
                  style={{ width: '100%' }}
                  value={config.default_model}
                  onChange={(e) => setConfig({ ...config, default_model: e.target.value })}
                >
                  <option value="gpt-4-turbo">OpenAI GPT-4 Turbo (الموصى به للاستشارات الضريبية والقانونية)</option>
                  <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (معدل تحليل المستندات والعقود)</option>
                  <option value="custom-diwan-legal">Diwan Fine-Tuned Legal Model v2.4</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  درجة الإبداع والحرية (Temperature): {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  style={{ width: '100%' }}
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                  <span>0.0 (قانوني دقيق ومتزمت)</span>
                  <span>1.0 (إبداعي وحر)</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  الحد الأقصى للتوكنز في الإجابة الواحدة (Max Tokens)
                </label>
                <input
                  type="number"
                  className="cc-input"
                  style={{ width: '100%' }}
                  value={config.max_tokens}
                  onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 2048 })}
                />
              </div>

              <button className="cc-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات والتحديث الحجمي'}
              </button>
            </div>
          </div>

          <div>
            <div className="cc-chart-container">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800 }}>الضوابط ومفاتيح الأمان</h3>

              <div className="cc-toggle-row">
                <div className="cc-toggle-info">
                  <h4>التوليد التلقائي للإجابات (AI Auto Response)</h4>
                  <p>صياغة مسودات إجابات أولية للعملاء.</p>
                </div>
                <label className="cc-switch">
                  <input
                    type="checkbox"
                    checked={config.enable_ai_auto_response}
                    onChange={(e) => setConfig({ ...config, enable_ai_auto_response: e.target.checked })}
                  />
                  <span className="cc-slider"></span>
                </label>
              </div>

              <div className="cc-toggle-row">
                <div className="cc-toggle-info">
                  <h4>التوجيه الذكي للمستشارين (Smart Routing)</h4>
                  <p>ربط القضايا المستلمة بالمستشار الأكثر اختصاصاً.</p>
                </div>
                <label className="cc-switch">
                  <input
                    type="checkbox"
                    checked={config.enable_smart_routing}
                    onChange={(e) => setConfig({ ...config, enable_smart_routing: e.target.checked })}
                  />
                  <span className="cc-slider"></span>
                </label>
              </div>

              <div className="cc-toggle-row">
                <div className="cc-toggle-info">
                  <h4>استخراج بيانات المستندات (OCR & Doc Extraction)</h4>
                  <p>قراءة عقود ومستندات العملاء آلياً.</p>
                </div>
                <label className="cc-switch">
                  <input
                    type="checkbox"
                    checked={config.enable_doc_extraction}
                    onChange={(e) => setConfig({ ...config, enable_doc_extraction: e.target.checked })}
                  />
                  <span className="cc-slider"></span>
                </label>
              </div>

              <div className="cc-toggle-row">
                <div className="cc-toggle-info">
                  <h4>إلزام التنبيه القانوني (Strict Guardrails)</h4>
                  <p>تضمين تنبيه عدم المسؤولية بجميع الإجابات.</p>
                </div>
                <label className="cc-switch">
                  <input
                    type="checkbox"
                    checked={config.enable_strict_guardrails}
                    onChange={(e) => setConfig({ ...config, enable_strict_guardrails: e.target.checked })}
                  />
                  <span className="cc-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
