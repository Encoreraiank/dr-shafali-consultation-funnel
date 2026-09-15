import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, generateBookingNumber } from '@/lib/payment';
import prisma from '@/lib/db';
import { getCloudStore, addBookingToStore } from '@/lib/cloudStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientName, patientPhone, patientEmail, problemCategory, problemDetail, date, timeSlot } = body;

    if (!patientName?.trim()) {
      return NextResponse.json(
        { error: 'Please enter your full name' },
        { status: 400 }
      );
    }

    if (!patientPhone?.trim()) {
      return NextResponse.json(
        { error: 'Please enter your WhatsApp mobile number' },
        { status: 400 }
      );
    }

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: 'Please select a date and time slot' },
        { status: 400 }
      );
    }

    // 1. Collision check using Cloud Store
    const cloudStore = await getCloudStore();

    // Check if whole day or this slot is blocked
    const isBlocked = cloudStore.blockedSlots.some(
      (b) => b.date === date && (!b.timeSlot || b.timeSlot === timeSlot)
    );

    if (isBlocked) {
      return NextResponse.json(
        { error: 'This time slot is marked as unavailable. Please choose another slot.' },
        { status: 409 }
      );
    }

    // Check if already booked
    const isBooked = cloudStore.bookings.some(
      (b) => b.date === date && b.timeSlot === timeSlot && b.status !== 'CANCELLED'
    );

    if (isBooked) {
      return NextResponse.json(
        { error: 'This time slot was just booked by another user. Please choose another slot.' },
        { status: 409 }
      );
    }

    // Get current fee from store
    const fee = cloudStore.settings.consultationFee || 21;
    const upiId = process.env.DOCTOR_UPI_ID || '9540329351@ptsbi';
    const bookingNumber = generateBookingNumber();

    // Parse start and end time
    let startTime = new Date();
    let endTime = new Date();
    try {
      const [startStr, endStr] = (timeSlot || '').split(' - ');
      if (startStr && endStr) {
        const { parse } = await import('date-fns');
        startTime = parse(`${date} ${startStr.trim()}`, 'yyyy-MM-dd hh:mm a', new Date());
        endTime = parse(`${date} ${endStr.trim()}`, 'yyyy-MM-dd hh:mm a', new Date());
      }
    } catch {
      startTime = new Date(date);
      endTime = new Date(date);
    }

    // Persist booking in Cloud Store (persists across all Vercel instances)
    await addBookingToStore({
      bookingNumber,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail?.trim() || null,
      problemCategory: problemCategory || 'General Guidance',
      problemDetail: problemDetail?.trim() || `${problemCategory || 'General'} consultation guidance`,
      date,
      timeSlot,
      amount: fee,
      status: 'CONFIRMED',
      meetUrl: 'https://meet.google.com/zvc-aaww-mpo',
    });

    // Also persist in local DB if possible
    try {
      await prisma.booking.create({
        data: {
          bookingNumber,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientEmail: patientEmail?.trim() || null,
          problemCategory: problemCategory || 'General Guidance',
          problemDetail: problemDetail?.trim() || `${problemCategory || 'General'} consultation guidance`,
          date,
          timeSlot,
          startTime,
          endTime,
          amount: fee,
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
          status: 'CONFIRMED',
          meetUrl: 'https://meet.google.com/zvc-aaww-mpo',
        },
      });
    } catch (dbErr) {
      console.error('Local DB create skipped:', dbErr);
    }

    const order = await createPaymentOrder({
      amount: fee,
      receipt: `rcpt_${bookingNumber}`,
      notes: {
        bookingNumber,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        date,
        timeSlot,
      },
    });

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Shafali Garg')}&am=${fee.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Consultation ${bookingNumber}`)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiLink)}`;

    return NextResponse.json({
      success: true,
      bookingNumber,
      orderId: order.orderId,
      amount: fee,
      amountPaise: order.amount,
      keyId: order.keyId,
      mode: order.mode,
      upiId,
      upiLink,
      qrUrl,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize booking. Please try again.' },
      { status: 500 }
    );
  }
}
