import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'Booking ID',
      'Patient Name',
      'Phone / WhatsApp',
      'Email',
      'Category',
      'Problem Description',
      'Date',
      'Time Slot',
      'Fee Paid',
      'Payment Status',
      'Payment ID',
      'Google Meet Link',
      'Booking Status',
      'Notes',
      'UTM Source',
      'Created At',
    ];

    const rows = bookings.map((b) => [
      `"${b.bookingNumber}"`,
      `"${b.patientName.replace(/"/g, '""')}"`,
      `"${b.patientPhone}"`,
      `"${b.patientEmail || ''}"`,
      `"${b.problemCategory}"`,
      `"${b.problemDetail.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${b.date}"`,
      `"${b.timeSlot}"`,
      `"${b.amount}"`,
      `"${b.paymentStatus}"`,
      `"${b.paymentId || ''}"`,
      `"${b.meetUrl || ''}"`,
      `"${b.status}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
      `"${b.utmSource || ''}"`,
      `"${format(new Date(b.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="dr-shafali-consultations-${format(new Date(), 'yyyyMMdd-HHmm')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting bookings:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
