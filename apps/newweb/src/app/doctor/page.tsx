'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchDoctorStats, fetchDoctorAppointments } from '@/lib/store/slices/appointmentSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { Calendar, Clock, FileCheck, TrendingUp } from 'lucide-react';

export default function DoctorDashboardPage() {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { stats, appointments } = useAppSelector((s) => s.appointment);

  useEffect(() => {
    if (token) {
      dispatch(fetchDoctorStats());
      dispatch(fetchDoctorAppointments({ status: 'pending', limit: 5 }));
    }
  }, [dispatch, token]);

  const upcoming = appointments.filter((a) => a.status === 'accepted').slice(0, 5);
  const pending = appointments.filter((a) => a.status === 'pending').slice(0, 5);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <MedText variant="h2" as="h2" className="text-[20px]">Dashboard</MedText>
        <MedText variant="body" className="text-text-secondary mt-1">
          Welcome back, {user?.doctorProfile?.fullName || user?.phone || 'Doctor'}
        </MedText>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Today's Appts", value: stats?.todayAppointments || 0, icon: Calendar, color: 'text-blue' },
          { label: 'Pending', value: stats?.pendingRequests || 0, icon: Clock, color: 'text-star' },
          { label: 'Upcoming', value: stats?.upcomingTotal || 0, icon: FileCheck, color: 'text-success' },
          { label: 'Completed', value: stats?.totalCompleted || 0, icon: TrendingUp, color: 'text-secondary' },
        ].map((s) => (
          <MedCard key={s.label}>
            <s.icon size={20} className={`${s.color} mb-2`} />
            <MedText variant="h1" as="span" className="text-[24px] block">{s.value}</MedText>
            <MedText variant="metadata">{s.label}</MedText>
          </MedCard>
        ))}
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-3">Pending Requests</MedText>
          <div className="space-y-2">
            {pending.map((appt) => (
              <MedCard key={appt.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <MedText variant="body" className="text-[14px] font-medium">{appt.patient?.patientProfile?.fullName || 'Patient'}</MedText>
                    <MedText variant="metadata">{new Date(appt.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</MedText>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E]">Pending</span>
                </div>
              </MedCard>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <MedText variant="metadata" className="text-text-secondary text-[13px] tracking-[0.3px] mb-3">Upcoming Appointments</MedText>
          <div className="space-y-2">
            {upcoming.map((appt) => (
              <MedCard key={appt.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <MedText variant="body" className="text-[14px] font-medium">{appt.patient?.patientProfile?.fullName || 'Patient'}</MedText>
                    <MedText variant="metadata">{new Date(appt.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</MedText>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF3] text-[#027A48]">Accepted</span>
                </div>
              </MedCard>
            ))}
          </div>
        </div>
      )}

      {!stats && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}
