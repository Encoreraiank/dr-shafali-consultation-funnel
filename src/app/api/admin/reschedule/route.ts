import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parse, addMinutes } from 'date-fns';
import { sendAutomatedNotifications } from '@/lib/notifications';
import { BookingRecord } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, newDate, newTimeSlot, reason } = await req.json();

    if (!bookingId || !newDate || !newTimeSlot) {
      return NextResponse.json(
        { error: 'Booking ID, newDate, and newTimeSlot are required' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if new slot is free
    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: bookingId },
        date: newDate,
        timeSlot: newTimeSlot,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'The requested new slot is already occupied' },
        { status: 409 }
      );
    }

    const [startTimeStr, endTimeStr] = newTimeSlot.split('-').map((s: string) => s.trim());
    let startTime: Date;
    let endTime: Date;

    try {
      startTime = parse(`${newDate} ${startTimeStr}`, 'yyyy-MM-dd hh:mm a', new Date());
      endTime = endTimeStr
        ? parse(`${newDate} ${endTimeStr}`, 'yyyy-MM-dd hh:mm a', new Date())
        : addMinutes(startTime, 5);
    } catch {
      startTime = new Date();
      endTime = addMinutes(startTime, 5);
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        date: newDate,
        timeSlot: newTimeSlot,
        startTime,
        endTime,
        status: 'RESCHEDULED',
        notes: reason ? `Rescheduled: ${reason}` : booking.notes,
      },
    });

    // Send updated notification
    sendAutomatedNotifications({
      booking: updated as unknown as BookingRecord,
      meetUrl: updated.meetUrl || 'https://meet.google.com',
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      booking: updated,
      message: 'Booking rescheduled and notification sent',
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
  }
}
