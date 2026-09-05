import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/payment';
import { generateGoogleMeetLink } from '@/lib/googleMeet';
import { sendAutomatedNotifications } from '@/lib/notifications';
import prisma from '@/lib/db';
import { parse, addMinutes } from 'date-fns';
import { BookingRecord } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      paymentId,
      signature,
      paymentMethod,
      bookingNumber,
      patientName,
      patientPhone,
      patientEmail,
      problemCategory,
      problemDetail,
      date,
      timeSlot,
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // Check if booking already exists for this bookingNumber
    const existing = await prisma.booking.findUnique({
      where: { bookingNumber },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        booking: existing,
        message: 'Booking already confirmed',
      });
    }

    // Parse start and end time
    // timeSlot format is e.g. "10:00 AM - 10:05 AM"
    const [startTimeStr, endTimeStr] = timeSlot.split('-').map((s: string) => s.trim());
    let startTime: Date;
    let endTime: Date;

    try {
      startTime = parse(`${date} ${startTimeStr}`, 'yyyy-MM-dd hh:mm a', new Date());
      endTime = endTimeStr
        ? parse(`${date} ${endTimeStr}`, 'yyyy-MM-dd hh:mm a', new Date())
        : addMinutes(startTime, 5);
    } catch {
      startTime = new Date();
      endTime = addMinutes(startTime, 5);
    }

    // Generate Google Meet Link
    const meetResult = await generateGoogleMeetLink({
      bookingNumber,
      patientName,
      patientEmail,
      startTime,
      endTime,
      problemCategory: problemCategory || 'General Guidance',
    });

    // Save Booking in Database
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        patientName,
        patientPhone,
        patientEmail: patientEmail || null,
        problemCategory: problemCategory || 'General Guidance',
        problemDetail,
        date,
        timeSlot,
        startTime,
        endTime,
        amount: body.amount ? Number(body.amount) : (process.env.NEXT_PUBLIC_CONSULTATION_FEE ? Number(process.env.NEXT_PUBLIC_CONSULTATION_FEE) : 1),
        paymentStatus: 'PAID',
        paymentId,
        orderId,
        paymentMethod: paymentMethod || 'UPI',
        meetUrl: meetResult.meetUrl,
        googleEventId: meetResult.eventId,
        status: 'CONFIRMED',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      },
    });

    // Remove temporary locks for this session or slot
    try {
      await prisma.temporaryLock.deleteMany({
        where: {
          OR: [
            { sessionId: sessionId || 'unknown' },
            { date, timeSlot },
          ],
        },
      });
    } catch (e) {
      console.error('Lock cleanup error:', e);
    }

    // Dispatch automated notifications (Async)
    sendAutomatedNotifications({
      booking: booking as unknown as BookingRecord,
      meetUrl: meetResult.meetUrl,
    }).catch((err) => console.error('Notification dispatch error:', err));

    return NextResponse.json({
      success: true,
      booking,
      meetUrl: meetResult.meetUrl,
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment and finalize booking' },
      { status: 500 }
    );
  }
}
