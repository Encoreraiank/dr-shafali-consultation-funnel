'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Video,
  DollarSign,
  Download,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Settings,
  Lock,
  LogOut,
  ExternalLink,
  Phone,
  Loader2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { BookingRecord } from '@/types';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Dashboard Data State
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modals
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<BookingRecord | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('dsg_admin_auth');
    if (token) {
      setIsAuthenticated(true);
      fetchBookings();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        setIsAuthLoading(false);
        return;
      }

      localStorage.setItem('dsg_admin_auth', data.token);
      setIsAuthenticated(true);
      fetchBookings();
    } catch {
      setAuthError('Network error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dsg_admin_auth');
    setIsAuthenticated(false);
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedDate) params.append('date', selectedDate);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setStats(data.stats || {
        totalBookings: 0,
        confirmedCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalRevenue: 0,
      });
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const debounce = setTimeout(() => {
        fetchBookings();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, selectedStatus, selectedDate, isAuthenticated]);

  const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchBookings();
      if (viewingBooking && viewingBooking.id === id) {
        setViewingBooking((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingBooking || !newRescheduleDate || !newRescheduleTime) return;

    setIsRescheduling(true);
    try {
      const res = await fetch('/api/admin/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reschedulingBooking.id,
          newDate: newRescheduleDate,
          newTimeSlot: newRescheduleTime,
          reason: rescheduleReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReschedulingBooking(null);
        fetchBookings();
      } else {
        alert(data.error || 'Reschedule failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescheduling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FCFAF6] text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white border border-orange-200 p-7 sm:p-8 shadow-warm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Doctor & Admin Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Dr. Shafali Garg Consultation Funnel Control Center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Password / PIN
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (default: admin123)"
                className="w-full px-4 py-3 rounded-xl bg-[#FFFDF9] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-orange-600 hover:underline font-semibold">
              ← Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayBookings = bookings.filter((b) => b.date === todayStr && b.status === 'CONFIRMED');

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-slate-800 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-serif text-white font-bold text-sm shadow-sm">
              SG
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                Dr. Shafali Garg — Control Center
              </h1>
              <p className="text-[10px] text-emerald-700 font-semibold">₹21 Consultation Funnel Live</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/schedule"
              className="py-1.5 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-semibold flex items-center gap-1.5 border border-orange-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-orange-600" />
              <span>Availability & Schedule</span>
            </Link>

            <a
              href="/api/admin/export"
              download
              className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export Leads CSV</span>
            </a>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Real-Time Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-orange-100 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span>Total Bookings</span>
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">{stats.totalBookings}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Direct from Ad Funnel</p>
          </div>

          <div className="rounded-2xl bg-white border border-orange-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-orange-600 text-xs mb-2">
              <span className="font-semibold">Today&apos;s Calls</span>
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-600 font-serif">{todayBookings.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">{format(new Date(), 'dd MMMM yyyy')}</p>
          </div>

          <div className="rounded-2xl bg-white border border-orange-100 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-serif">{stats.completedCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Consultations Finished</p>
          </div>

          <div className="rounded-2xl bg-white border border-orange-100 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span>Funnel Revenue</span>
              <DollarSign className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-600 font-serif">₹{stats.totalRevenue}</p>
            <p className="text-[11px] text-slate-500 mt-1">₹21 Entry Rate</p>
          </div>
        </div>

        {/* Today's Priority Queue Banner */}
        {todayBookings.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Today&apos;s Upcoming Consultations ({todayBookings.length})</span>
              </h3>
              <span className="text-xs text-slate-500">Join call 1 min prior to slot</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayBookings.map((b) => (
                <div key={b.id} className="rounded-xl bg-white border border-orange-200 p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {b.timeSlot}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{b.bookingNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{b.patientName}</h4>
                    <p className="text-[11px] text-orange-800 font-medium truncate">🎯 {b.problemCategory}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setViewingBooking(b)}
                      className="flex-1 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-600" />
                      <span>Read Issue</span>
                    </button>

                    <a
                      href={b.meetUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Meet</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient name, phone, or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-2 px-3 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>

            {(searchQuery || selectedDate || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDate('');
                  setSelectedStatus('ALL');
                }}
                className="text-xs text-rose-600 hover:underline px-2 font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="rounded-2xl bg-white border border-orange-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F0] border-b border-orange-100 text-slate-600 uppercase tracking-wider font-bold">
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Topic / Category</th>
                  <th className="p-4">Date & Time Slot</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Google Meet</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                      <span>Loading consultations...</span>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No consultations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-orange-600">
                        {booking.bookingNumber}
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{booking.patientName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {booking.patientPhone}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{booking.problemCategory}</span>
                        <p className="text-[10px] text-slate-500 truncate max-w-xs">
                          {booking.problemDetail}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-slate-900">
                          {booking.date ? format(new Date(booking.date), 'dd MMM yyyy') : 'N/A'}
                        </p>
                        <p className="text-emerald-700 text-[11px] font-medium">{booking.timeSlot}</p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : booking.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-800 border border-blue-300'
                              : booking.status === 'RESCHEDULED'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : 'bg-rose-50 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td className="p-4">
                        {booking.meetUrl ? (
                          <a
                            href={booking.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-lg shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingBooking(booking)}
                            className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
                            title="View Full Problem Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setReschedulingBooking(booking);
                              setNewRescheduleDate(booking.date);
                              setNewRescheduleTime(booking.timeSlot);
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                            title="Reschedule Slot"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {booking.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {booking.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Problem Dossier Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-orange-200 p-6 sm:p-7 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div>
                <p className="text-[10px] text-orange-600 font-bold uppercase">Patient Problem Dossier</p>
                <h3 className="text-lg font-bold text-slate-900 font-serif">{viewingBooking.patientName}</h3>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#FFFDF9] p-3 rounded-xl border border-orange-100">
                <div>
                  <p className="text-[10px] text-slate-400">Phone / WhatsApp:</p>
                  <p className="font-semibold text-slate-900">{viewingBooking.patientPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Email:</p>
                  <p className="font-medium text-slate-700">{viewingBooking.patientEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Date & Time:</p>
                  <p className="font-semibold text-emerald-700">{viewingBooking.date} ({viewingBooking.timeSlot})</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Fee Status:</p>
                  <p className="font-bold text-orange-600">₹{viewingBooking.amount} Paid</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Topic Category:</p>
                <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-300 text-orange-900 font-semibold text-xs">
                  {viewingBooking.problemCategory}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Patient&apos;s Stated Issue / Question:</p>
                <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-slate-200 text-slate-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {viewingBooking.problemDetail}
                </div>
              </div>

              {viewingBooking.meetUrl && (
                <div className="pt-2">
                  <a
                    href={viewingBooking.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span>Launch Google Meet With Patient</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Reschedule Consultation ({reschedulingBooking.bookingNumber})
              </h3>
              <button
                onClick={() => setReschedulingBooking(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">New Date (YYYY-MM-DD):</label>
                <input
                  type="date"
                  required
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">New Time Slot (e.g. 11:30 AM - 11:35 AM):</label>
                <input
                  type="text"
                  required
                  value={newRescheduleTime}
                  onChange={(e) => setNewRescheduleTime(e.target.value)}
                  placeholder="11:30 AM - 11:35 AM"
                  className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Reason (sent to patient):</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="E.g., Doctor emergency reschedule"
                  className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-50 transition-colors"
                >
                  {isRescheduling ? 'Rescheduling...' : 'Confirm & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
