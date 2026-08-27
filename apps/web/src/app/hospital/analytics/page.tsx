'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchHospitalAnalytics } from '@/lib/store/slices/hospitalSlice';
import { MedText } from '@/components/ui/med-text';
import { MedCard } from '@/components/ui/med-card';
import { BarChart3, CheckCircle2, Clock, XCircle, Wallet, Ticket, CreditCard } from 'lucide-react';

const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export default function HospitalAnalyticsPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { analytics, loading } = useAppSelector((s) => s.hospital);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (token) {
      dispatch(fetchHospitalAnalytics(period));
    }
  }, [dispatch, token, period]);

  const statusCards = analytics
    ? [
        { label: 'Pending', value: analytics.status?.pending ?? 0, color: 'text-warning', icon: Clock },
        { label: 'Confirmed', value: analytics.status?.confirmed ?? 0, color: 'text-blue', icon: CheckCircle2 },
        { label: 'Completed', value: analytics.status?.completed ?? 0, color: 'text-success', icon: BarChart3 },
        { label: 'Cancelled', value: analytics.status?.cancelled ?? 0, color: 'text-error', icon: XCircle },
      ]
    : [];

  const paymentCards = analytics
    ? [
        { label: 'Paid Bookings', value: analytics.payments?.paid ?? 0, color: 'text-success', icon: CheckCircle2 },
        { label: 'Unpaid Bookings', value: analytics.payments?.unpaid ?? 0, color: 'text-warning', icon: Clock },
        { label: 'Revenue (ETB)', value: Number(analytics.payments?.revenue || 0).toLocaleString(), color: 'text-blue', icon: Wallet },
      ]
    : [];

  const cardSummary = analytics
    ? [
        { label: 'Total Cards', value: analytics.cards?.total ?? 0, color: 'text-secondary', icon: CreditCard },
        { label: 'Active Cards', value: analytics.cards?.active ?? 0, color: 'text-success', icon: Ticket },
        { label: 'Expired Cards', value: analytics.cards?.expired ?? 0, color: 'text-error', icon: XCircle },
        { label: 'Issued Value (ETB)', value: Number(analytics.cards?.issuedValue || 0).toLocaleString(), color: 'text-blue', icon: Wallet },
      ]
    : [];

  const maxDay = Math.max(1, ...(analytics?.byDay || []).map((d) => d.count));

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <MedText variant="h2" as="h2" className="text-[20px]">Analytics</MedText>
          <MedText variant="body" className="text-text-secondary mt-1">
            Track bookings, payments and card usage.
          </MedText>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${period === p.key ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !analytics ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : !analytics ? null : (
        <div className="space-y-6">
          {/* Status breakdown */}
          <div>
            <MedText variant="body" className="text-[15px] font-medium mb-3">Booking Status</MedText>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statusCards.map((c) => (
                <MedCard key={c.label} className="h-full">
                  <c.icon size={20} className={`${c.color} mb-2`} />
                  <MedText variant="h1" as="span" className="text-[22px] block">{c.value}</MedText>
                  <MedText variant="metadata">{c.label}</MedText>
                </MedCard>
              ))}
            </div>
          </div>

          {/* Payments */}
          <div>
            <MedText variant="body" className="text-[15px] font-medium mb-3">Payments</MedText>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentCards.map((c) => (
                <MedCard key={c.label} className="h-full">
                  <c.icon size={20} className={`${c.color} mb-2`} />
                  <MedText variant="h1" as="span" className="text-[22px] block">{c.value}</MedText>
                  <MedText variant="metadata">{c.label}</MedText>
                </MedCard>
              ))}
            </div>
          </div>

          {/* Bookings per day */}
          {(analytics.byDay || []).length > 0 && (
            <MedCard>
              <div className="flex justify-between items-center mb-3">
                <MedText variant="body" className="text-[15px] font-medium">Bookings per Day</MedText>
                <MedText variant="metadata">{analytics.byDay.length} days</MedText>
              </div>
              <div className="flex items-end gap-1 h-40">
                {analytics.byDay.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-[10px] text-text-secondary">{d.count || ''}</span>
                    <div
                      className="w-full rounded-t-[6px] bg-primary/70"
                      style={{ height: `${Math.max(3, (d.count / maxDay) * 100)}%` }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <span className="text-[9px] text-muted">{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </MedCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Per doctor */}
            <MedCard>
              <MedText variant="body" className="text-[15px] font-medium mb-3">Top Doctors</MedText>
              {(analytics.byDoctor || []).length === 0 ? (
                <MedText variant="metadata">No data</MedText>
              ) : (
                <div className="space-y-2">
                  {analytics.byDoctor.slice(0, 8).map((d) => (
                    <div key={d.doctorId} className="flex justify-between items-center text-[13px]">
                      <span className="text-text truncate">{d.doctorName}</span>
                      <span className="font-semibold">{d.bookings}</span>
                    </div>
                  ))}
                </div>
              )}
            </MedCard>

            {/* Per service */}
            <MedCard>
              <MedText variant="body" className="text-[15px] font-medium mb-3">By Service</MedText>
              {(analytics.byService || []).length === 0 ? (
                <MedText variant="metadata">No data</MedText>
              ) : (
                <div className="space-y-2">
                  {analytics.byService.slice(0, 8).map((s) => (
                    <div key={s.service} className="flex justify-between items-center text-[13px]">
                      <span className="text-text truncate">{s.service}</span>
                      <span className="font-semibold">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </MedCard>
          </div>

          {/* Card usage */}
          <div>
            <MedText variant="body" className="text-[15px] font-medium mb-3">Card Usage</MedText>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cardSummary.map((c) => (
                <MedCard key={c.label} className="h-full">
                  <c.icon size={20} className={`${c.color} mb-2`} />
                  <MedText variant="h1" as="span" className="text-[22px] block">{c.value}</MedText>
                  <MedText variant="metadata">{c.label}</MedText>
                </MedCard>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
