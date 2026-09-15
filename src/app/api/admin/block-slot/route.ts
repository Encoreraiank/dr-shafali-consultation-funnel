import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { format, parse, addMinutes, isBefore, isAfter } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // If no date is passed, return simple list of all blocked slots
    if (!dateParam) {
      const blocked = await prisma.blockedSlot.findMany({
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ blocked });
    }

    const date = dateParam;

    // 1. Fetch settings for slot generation
    let settings = {
      morningStart: '10:00',
      morningEnd: '13:00',
      eveningStart: '17:00',
      eveningEnd: '20:00',
      slotDurationMin: 5,
      bufferTimeMin: 2,
    };

    try {
      const dbSettings = await prisma.adminSetting.findUnique({
        where: { id: 'default' },
      });
      if (dbSettings) {
        settings = {
          morningStart: dbSettings.morningStart || '10:00',
          morningEnd: dbSettings.morningEnd || '13:00',
          eveningStart: dbSettings.eveningStart || '17:00',
          eveningEnd: dbSettings.eveningEnd || '20:00',
          slotDurationMin: dbSettings.slotDurationMin || 5,
          bufferTimeMin: dbSettings.bufferTimeMin || 2,
        };
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }

    // 2. Fetch blocked slots for this date
    const blockedEntries = await prisma.blockedSlot.findMany({
      where: { date },
      orderBy: { createdAt: 'desc' },
    });

    const isFullDayBlocked = blockedEntries.some((b) => !b.timeSlot);
    const blockedMap = new Map<string, typeof blockedEntries[0]>();
    blockedEntries.forEach((b) => {
      if (b.timeSlot) {
        blockedMap.set(b.timeSlot, b);
      }
    });

    // 3. Fetch bookings for this date
    const bookings = await prisma.booking.findMany({
      where: {
        date,
        status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bookedMap = new Map<string, typeof bookings[0]>();
    bookings.forEach((b) => {
      if (b.timeSlot) {
        bookedMap.set(b.timeSlot, b);
      }
    });

    // 4. Generate all slots for morning and evening
    const slotDuration = settings.slotDurationMin;
    const bufferTime = settings.bufferTimeMin;
    const stepMinutes = slotDuration + bufferTime;

    const timeRanges = [
      { start: settings.morningStart, end: settings.morningEnd, period: 'morning' as const, label: '🌅 Morning Shift' },
      { start: settings.eveningStart, end: settings.eveningEnd, period: 'evening' as const, label: '🌆 Evening Shift' },
    ];

    interface AdminSlotItem {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      displayTime: string;
      period: 'morning' | 'evening';
      status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED';
      blockId?: string;
      reason?: string;
      booking?: {
        id: string;
        bookingNumber: string;
        patientName: string;
        patientPhone: string;
        patientEmail?: string | null;
        problemCategory: string;
        problemDetail: string;
        status: string;
        amount: number;
        meetUrl?: string | null;
      };
    }

    const generatedSlots: AdminSlotItem[] = [];

    for (const range of timeRanges) {
      let currentSlotStart = parse(`${date} ${range.start}`, 'yyyy-MM-dd HH:mm', new Date());
      const rangeEnd = parse(`${date} ${range.end}`, 'yyyy-MM-dd HH:mm', new Date());

      while (isBefore(currentSlotStart, rangeEnd)) {
        const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);
        if (isAfter(currentSlotEnd, rangeEnd)) break;

        const startTimeStr = format(currentSlotStart, 'hh:mm a');
        const endTimeStr = format(currentSlotEnd, 'hh:mm a');
        const displayTime = `${startTimeStr} - ${endTimeStr}`;

        let status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED' = 'AVAILABLE';
        let blockId: string | undefined = undefined;
        let reason: string | undefined = undefined;
        let bookingData: AdminSlotItem['booking'] = undefined;

        if (isFullDayBlocked) {
          status = 'BLOCKED';
          reason = 'Entire day blocked by doctor';
        } else if (bookedMap.has(displayTime)) {
          status = 'BOOKED';
          const b = bookedMap.get(displayTime)!;
          bookingData = {
            id: b.id,
            bookingNumber: b.bookingNumber,
            patientName: b.patientName,
            patientPhone: b.patientPhone,
            patientEmail: b.patientEmail,
            problemCategory: b.problemCategory,
            problemDetail: b.problemDetail,
            status: b.status,
            amount: b.amount,
            meetUrl: b.meetUrl,
          };
        } else if (blockedMap.has(displayTime)) {
          status = 'BLOCKED';
          const blk = blockedMap.get(displayTime)!;
          blockId = blk.id;
          reason = blk.reason || 'Turned OFF by doctor';
        }

        generatedSlots.push({
          id: `${date}_${displayTime.replace(/\s+/g, '_')}`,
          date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          displayTime,
          period: range.period,
          status,
          blockId,
          reason,
          booking: bookingData,
        });

        currentSlotStart = addMinutes(currentSlotStart, stepMinutes);
      }
    }

    return NextResponse.json({
      date,
      isFullDayBlocked,
      slots: generatedSlots,
      blocked: blockedEntries,
      bookings,
      summary: {
        total: generatedSlots.length,
        available: generatedSlots.filter((s) => s.status === 'AVAILABLE').length,
        blocked: generatedSlots.filter((s) => s.status === 'BLOCKED').length,
        booked: generatedSlots.filter((s) => s.status === 'BOOKED').length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/block-slot:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, timeSlot, reason, bookingId } = body;

    // Action 1: Toggle single slot ON / OFF
    if (action === 'TOGGLE_SLOT') {
      if (!date || !timeSlot) {
        return NextResponse.json({ error: 'Date and timeSlot are required for TOGGLE_SLOT' }, { status: 400 });
      }

      // Check if slot is already blocked
      const existingBlock = await prisma.blockedSlot.findFirst({
        where: { date, timeSlot },
      });

      if (existingBlock) {
        // Slot is blocked -> UNBLOCK IT (Turn ON)
        await prisma.blockedSlot.delete({
          where: { id: existingBlock.id },
        });
        return NextResponse.json({
          success: true,
          action: 'UNBLOCKED',
          message: `Slot ${timeSlot} is now turned ON (Open for booking)`,
        });
      } else {
        // Slot is open -> BLOCK IT (Turn OFF)
        const newBlock = await prisma.blockedSlot.create({
          data: {
            date,
            timeSlot,
            reason: reason || 'Turned OFF by doctor',
          },
        });
        return NextResponse.json({
          success: true,
          action: 'BLOCKED',
          blockId: newBlock.id,
          message: `Slot ${timeSlot} is now turned OFF (Blocked from public)`,
        });
      }
    }

    // Action 2: Toggle entire day ON / OFF
    if (action === 'TOGGLE_DAY') {
      if (!date) {
        return NextResponse.json({ error: 'Date is required for TOGGLE_DAY' }, { status: 400 });
      }

      const existingDayBlock = await prisma.blockedSlot.findFirst({
        where: { date, timeSlot: null },
      });

      if (existingDayBlock) {
        // Entire day was blocked -> UNBLOCK THE DAY
        await prisma.blockedSlot.delete({
          where: { id: existingDayBlock.id },
        });
        return NextResponse.json({
          success: true,
          action: 'DAY_UNBLOCKED',
          isFullDayBlocked: false,
          message: `Date ${date} is now OPEN for bookings`,
        });
      } else {
        // Block entire day
        await prisma.blockedSlot.create({
          data: {
            date,
            timeSlot: null,
            reason: reason || 'Entire day turned OFF by doctor',
          },
        });
        return NextResponse.json({
          success: true,
          action: 'DAY_BLOCKED',
          isFullDayBlocked: true,
          message: `Entire date ${date} is now turned OFF (No bookings allowed)`,
        });
      }
    }

    // Action 3: Cancel booking to instantly free up slot
    if (action === 'CANCEL_BOOKING') {
      if (!bookingId) {
        return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });

      return NextResponse.json({
        success: true,
        action: 'BOOKING_CANCELLED',
        message: `Booking ${updated.bookingNumber} cancelled. Slot is now available!`,
      });
    }

    // Default Fallback: Traditional Create Block
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
    console.error('Error in POST /api/admin/block-slot:', error);
    return NextResponse.json({ error: 'Failed to process schedule change' }, { status: 500 });
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
