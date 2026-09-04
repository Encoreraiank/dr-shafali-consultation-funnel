import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { addMinutes } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { date, timeSlot, sessionId } = await req.json();

    if (!date || !timeSlot || !sessionId) {
      return NextResponse.json(
        { error: 'Date, timeSlot, and sessionId are required' },
        { status: 400 }
      );
    }

    // Check if slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date,
        timeSlot,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot was just booked by another user. Please select another slot.' },
        { status: 409 }
      );
    }

    // Check if another active lock exists
    const existingLock = await prisma.temporaryLock.findFirst({
      where: {
        date,
        timeSlot,
        expiresAt: { gt: new Date() },
        sessionId: { not: sessionId },
      },
    });

    if (existingLock) {
      return NextResponse.json(
        { error: 'This slot is temporarily on hold for another checkout. Please wait 5 minutes or choose another slot.' },
        { status: 409 }
      );
    }

    // Create or update lock (10 minutes valid)
    const expiresAt = addMinutes(new Date(), 10);

    await prisma.temporaryLock.deleteMany({
      where: { sessionId },
    });

    await prisma.temporaryLock.create({
      data: {
        date,
        timeSlot,
        sessionId,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Slot locked successfully for 10 minutes',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Lock slot error:', error);
    return NextResponse.json(
      { error: 'Failed to reserve slot' },
      { status: 500 }
    );
  }
}
