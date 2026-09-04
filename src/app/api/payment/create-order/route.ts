import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, generateBookingNumber } from '@/lib/payment';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientName, patientPhone, patientEmail, problemCategory, problemDetail, date, timeSlot, sessionId } = body;

    if (!patientName || !patientPhone || !problemDetail || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Get current fee from settings
    const settings = await prisma.adminSetting.findUnique({
      where: { id: 'default' },
    });
    const fee = settings?.consultationFee || 21;

    const bookingNumber = generateBookingNumber();

    const order = await createPaymentOrder({
      amount: fee,
      receipt: `rcpt_${bookingNumber}`,
      notes: {
        bookingNumber,
        patientName,
        patientPhone,
        date,
        timeSlot,
      },
    });

    return NextResponse.json({
      success: true,
      bookingNumber,
      orderId: order.orderId,
      amount: fee,
      amountPaise: order.amount,
      keyId: order.keyId,
      mode: order.mode,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
