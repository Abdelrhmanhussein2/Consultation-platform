import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import DashboardStats from '../components/Dashboard/DashboardStats';
import UpcomingHeroCard from '../components/Dashboard/UpcomingHeroCard';
import RecentAppointmentsTable from '../components/Dashboard/RecentAppointmentsTable';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';

export default function UserDashboard({ navigate }) {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeVideoApptId, setActiveVideoApptId] = useState(null);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [apptsData, cntData] = await Promise.all([
        appointmentService.getMyAppointments(token),
        notificationService.getUnreadCount(token)
      ]);
      setAppointments(apptsData || []);
      setUnreadNotifs(cntData.unread_count || 0);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handlePay = async (apptId) => {
    try {
      await appointmentService.payAppointment(apptId, token);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'فشلت عملية الدفع');
    }
  };

  const upcomingAppt = appointments.find(a => a.status === 'confirmed' || a.status === 'pending_payment');

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '16px' }}>جاري تحميل لوحة التحكم والبيانات الخاصة بك...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Featured Upcoming Session Hero Banner */}
      <UpcomingHeroCard
        appointment={upcomingAppt}
        onJoinVideo={(id) => setActiveVideoApptId(id)}
        onPay={handlePay}
      />

      {/* Quick Statistics Cards */}
      <DashboardStats
        appointments={appointments}
        invoices={[]}
        unreadNotifs={unreadNotifs}
      />

      {/* Recent Appointments Table */}
      <RecentAppointmentsTable
        appointments={appointments}
        onJoinVideo={(id) => setActiveVideoApptId(id)}
        onPay={handlePay}
        navigate={navigate}
      />

      {/* Video Session Modal */}
      <VideoSessionModal
        appointmentId={activeVideoApptId}
        isOpen={!!activeVideoApptId}
        onClose={() => setActiveVideoApptId(null)}
        onSessionEnd={fetchDashboardData}
      />
    </div>
  );
}
