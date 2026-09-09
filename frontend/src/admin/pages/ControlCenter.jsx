import React, { useState } from 'react';
import '../control-center.css';
import AutomationTab from '../components/control-center/AutomationTab';
import Relations360Tab from '../components/control-center/Relations360Tab';
import AIControlTab from '../components/control-center/AIControlTab';
import ConsultantsTab from '../components/control-center/ConsultantsTab';

export default function ControlCenter({ navigate }) {
  const [activeTab, setActiveTab] = useState('automation');

  return (
    <div className="cc-container">
      {/* Header Banner */}
      <div className="cc-header">
        <div className="cc-title-group">
          <h1>
            مركز التحكم الإداري ومحرك الأتمتة
            <span className="cc-badge-gold">PRO V3.0</span>
          </h1>
          <p>إدارة العلاقات 360°، تخصيص قواعد التشغيل التلقائية، وحوكمة محرك الذكاء الاصطناعي الضريبي.</p>
        </div>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="cc-stats-grid">
        <div className="cc-stat-card">
          <div className="cc-stat-icon green">⚙️</div>
          <div className="cc-stat-info">
            <label>قواعد الأتمتة النشطة</label>
            <div className="value">12 / 14</div>
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-icon navy">🌐</div>
          <div className="cc-stat-info">
            <label>سجلات العلاقات 360°</label>
            <div className="value">1,480+</div>
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-icon purple">🤖</div>
          <div className="cc-stat-info">
            <label>نموذج AI الحالي</label>
            <div className="value" style={{ fontSize: '15px' }}>GPT-4 Turbo</div>
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-icon gold">👨‍⚖️</div>
          <div className="cc-stat-info">
            <label>طلبات اعتماد مستشارين</label>
            <div className="value">3 معلقة</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="cc-tabs-bar">
        <button
          className={`cc-tab-btn ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          <span className="tab-icon">⚙️</span>
          <span>الأتمتة وقواعد التشغيل</span>
        </button>

        <button
          className={`cc-tab-btn ${activeTab === 'r360' ? 'active' : ''}`}
          onClick={() => setActiveTab('r360')}
        >
          <span className="tab-icon">🌐</span>
          <span>العلاقات 360° (R360)</span>
        </button>

        <button
          className={`cc-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <span className="tab-icon">🤖</span>
          <span>تحكم وحوكمة AI</span>
        </button>

        <button
          className={`cc-tab-btn ${activeTab === 'consultants' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultants')}
        >
          <span className="tab-icon">👨‍⚖️</span>
          <span>إدارة المستشارين</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div className="cc-tab-content">
        {activeTab === 'automation' && <AutomationTab />}
        {activeTab === 'r360' && <Relations360Tab />}
        {activeTab === 'ai' && <AIControlTab />}
        {activeTab === 'consultants' && <ConsultantsTab />}
      </div>
    </div>
  );
}
