import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const blocked = await prisma.blockedSlot.findMany({
      where: date ? { date } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ blocked });
  } catch (error) {
    console.error('Error getting blocked slots:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked slots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, timeSlot, reason } = await req.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const created = await prisma.blockedSlot.create({
      data: {
        date,
        timeSlot: timeSlot || null,
        reason: reason || 'Blocked by doctor',
      },
    });

    return NextResponse.json({ success: true, blocked: created });
  } catch (error) {
    console.error('Error blocking slot:', error);
    return NextResponse.json({ error: 'Failed to block slot' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.blockedSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Unblocked successfully' });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: 'Failed to unblock' }, { status: 500 });
  }
}
