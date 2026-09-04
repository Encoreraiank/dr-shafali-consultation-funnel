import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // optional filter
    const status = searchParams.get('status'); // optional filter
    const query = searchParams.get('q'); // optional search term

    const whereClause: Record<string, unknown> = {};

    if (date) {
      whereClause.date = date;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { patientName: { contains: query } },
        { patientPhone: { contains: query } },
        { patientEmail: { contains: query } },
        { bookingNumber: { contains: query } },
        { problemDetail: { contains: query } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: [
        { date: 'desc' },
        { startTime: 'asc' },
      ],
    });

    // Summary stats
    const totalBookings = await prisma.booking.count();
    const confirmedCount = await prisma.booking.count({ where: { status: 'CONFIRMED' } });
    const completedCount = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const cancelledCount = await prisma.booking.count({ where: { status: 'CANCELLED' } });
    const totalRevenue = totalBookings * 21;

    return NextResponse.json({
      bookings,
      stats: {
        totalBookings,
        confirmedCount,
        completedCount,
        cancelledCount,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes, meetUrl } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (meetUrl) updateData.meetUrl = meetUrl;

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
