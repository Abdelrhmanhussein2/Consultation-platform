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
    total_tokens_month: 1250400,
    estimated_cost_usd: 48.50,
    avg_latency_ms: 640,
    requests_today: 412
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
      setMessage('تم حفظ إعدادات الذكاء الاصطناعي بنجاح ✅');
    } catch (err) {
      setMessage('⚠️ فشل حفظ الإعدادات: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Top Consumption Stats */}
      <div className="cc-stats-grid">
        <div className="cc-stat-card">
          <div className="cc-stat-icon purple">🤖</div>
          <div className="cc-stat-info">
            <label>إجمالي التوكنز هذا الشهر</label>
            <div className="value">{stats.total_tokens_month?.toLocaleString('ar-EG') || 0}</div>
          </div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-icon gold">💲</div>
          <div className="cc-stat-info">
            <label>التكلفة التقديرية (USD)</label>
            <div className="value">${stats.estimated_cost_usd || '0.00'}</div>
          </div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-icon green">⚡</div>
          <div className="cc-stat-info">
            <label>متوسط سرعة الاستجابة</label>
            <div className="value">{stats.avg_latency_ms || 600} ms</div>
          </div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-icon navy">📊</div>
          <div className="cc-stat-info">
            <label>طلبات اليوم</label>
            <div className="value">{stats.requests_today || 0}</div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes('نجاح') ? '#ECFDF5' : '#FEE2E2', color: message.includes('نجاح') ? '#047857' : '#DC2626', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '13.5px', fontWeight: 700 }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>جاري تحميل إعدادات المحرك...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Model & Parameters Configuration */}
          <div className="cc-ai-card">
            <h3 className="cc-ai-card-title">⚙️ إعدادات نموذج الذكاء الاصطناعي (LLM Model & Parameters)</h3>
            
            <div className="cc-form-group">
              <label>نموذج المحرك المعرفي الأساسي</label>
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={config.default_model}
                onChange={(e) => setConfig({ ...config, default_model: e.target.value })}
              >
                <option value="gpt-4-turbo">OpenAI GPT-4 Turbo (الموصى به للحلول القانونية والضريبية)</option>
                <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (معدل تحليل المستندات)</option>
                <option value="custom-diwan-legal">Diwan Fine-Tuned Saudi Legal Model v2.1</option>
              </select>
            </div>

            <div className="cc-form-group">
              <label>درجة الإبداع والحرية (Temperature): {config.temperature}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                style={{ width: '100%' }}
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                <span>0.0 (دقة وقانوني متزمت)</span>
                <span>1.0 (إبداعي وحر)</span>
              </div>
            </div>

            <div className="cc-form-group">
              <label>الحد الأقصى للتوكنز في الإجابة الواحدة (Max Tokens)</label>
              <input
                type="number"
                className="cc-input"
                style={{ width: '100%' }}
                value={config.max_tokens}
                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 2048 })}
              />
            </div>
          </div>

          {/* Feature Toggles & Safety Guardrails */}
          <div className="cc-ai-card">
            <h3 className="cc-ai-card-title">🛡️ مفاتيح التحكم بالميزات وضوابط الأمان (Feature Toggles)</h3>

            <div className="cc-toggle-row">
              <div className="cc-toggle-info">
                <h4>التوليد التلقائي للإجابات المبدئية (AI Auto Response)</h4>
                <p>تقديم صياغات أولية للعملاء قبل تحويلهم للمستشار.</p>
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
                <h4>التوجيه الذكي للمستشار المناسب (Smart Consultant Routing)</h4>
                <p>توجيه القضية أو الاستفسار تلقائياً بحسب تخصص المستشار.</p>
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
                <h4>استخراج البيانات من العقود والفواتير (Doc OCR & Extraction)</h4>
                <p>تحليل المرفقات الضريبية تلقائياً باستخدام القارئ الذكي.</p>
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
                <h4>حظر تقديم الفتاوى القاطعة (Strict Safety Guardrails)</h4>
                <p>إلزام الذكاء الاصطناعي بذكر تنبيه عدم المسؤولية القانونية.</p>
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
      )}

      <div style={{ marginTop: '24px', textAlign: 'left' }}>
        <button
          className="cc-btn-primary"
          style={{ padding: '12px 32px', fontSize: '15px' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'جاري حفظ التغييرات...' : 'حفظ إعدادات وتحديث المحرك الآن 💾'}
        </button>
      </div>
    </div>
  );
}
