import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, generateBookingNumber } from '@/lib/payment';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientName, patientPhone, patientEmail, problemCategory, problemDetail, date, timeSlot, sessionId } = body;

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

    // Get current fee from settings (safe try-catch)
    let fee = 21;
    let upiId = process.env.DOCTOR_UPI_ID || '9540329351@ptsbi';

    try {
      const settings = await prisma.adminSetting.findUnique({
        where: { id: 'default' },
      });
      if (settings?.consultationFee) {
        fee = settings.consultationFee;
      }
    } catch {
      fee = 21;
    }

    const bookingNumber = generateBookingNumber();

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

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Dr. Shafali Garg')}&am=${fee}&cu=INR&tn=${encodeURIComponent(`DSG Consultation ${bookingNumber}`)}`;
    const qrUrl = `/images/doctor_upi_qr.png`;

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
