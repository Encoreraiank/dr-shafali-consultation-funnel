import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { format, parse, addMinutes, isBefore, isAfter } from 'date-fns';
import {
  getCloudStore,
  setDateBlocksInStore,
  toggleSlotInStore,
  toggleDayInStore,
  cancelBookingInStore,
  updateStoreSettings,
} from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getCurrentISTDate(): Date {
  try {
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    return new Date(istString);
  } catch {
    return new Date();
  }
}

const normalizeSlot = (s: string) => (s || '').replace(/\s+/g, ' ').trim().toUpperCase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    const cloudStore = await getCloudStore(true);

    // If no date is passed, return simple list of all blocked slots
    if (!dateParam) {
      return NextResponse.json({
        blocked: cloudStore.blockedSlots,
        settings: cloudStore.settings,
      });
    }

    const date = dateParam;
    const settings = cloudStore.settings;

    // Blocked slots for this date from Cloud Store
    const blockedEntries = cloudStore.blockedSlots.filter((b) => b.date === date);
    const isFullDayBlocked = blockedEntries.some((b) => !b.timeSlot);

    const blockedMap = new Map<string, typeof blockedEntries[0]>();
    blockedEntries.forEach((b) => {
      if (b.timeSlot) {
        blockedMap.set(normalizeSlot(b.timeSlot), b);
      }
    });

    // Bookings for this date
    const bookings = cloudStore.bookings.filter(
      (b) => b.date === date && b.status !== 'CANCELLED'
    );

    const bookedMap = new Map<string, typeof bookings[0]>();
    bookings.forEach((b) => {
      if (b.timeSlot) {
        bookedMap.set(normalizeSlot(b.timeSlot), b);
      }
    });

    // Generate all slots for morning and evening
    const slotDuration = Number(settings.slotDurationMin) || 5;
    const bufferTime = Number(settings.bufferTimeMin) !== undefined ? Number(settings.bufferTimeMin) : 2;
    const stepMinutes = slotDuration + bufferTime;

    const timeRanges = [
      { start: settings.morningStart || '10:00', end: settings.morningEnd || '13:00', period: 'morning' as const },
      { start: settings.eveningStart || '17:00', end: settings.eveningEnd || '20:00', period: 'evening' as const },
    ];

    const istNow = getCurrentISTDate();
    const todayISTString = format(istNow, 'yyyy-MM-dd');
    const isToday = date === todayISTString;
    const currentISTTotalMinutes = istNow.getHours() * 60 + istNow.getMinutes();

    interface AdminSlotItem {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      displayTime: string;
      period: 'morning' | 'evening';
      status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'PAST';
      isPast: boolean;
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
        const normalizedDisplay = normalizeSlot(displayTime);

        // Check if slot has already passed in IST for today
        let isPast = false;
        if (isToday) {
          const slotStartMinutes = currentSlotStart.getHours() * 60 + currentSlotStart.getMinutes();
          isPast = slotStartMinutes <= currentISTTotalMinutes + 5;
        }

        let status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'PAST' = 'AVAILABLE';
        let blockId: string | undefined = undefined;
        let reason: string | undefined = undefined;
        let bookingData: AdminSlotItem['booking'] = undefined;

        const isBooked = bookedMap.has(normalizedDisplay) || bookedMap.has(normalizeSlot(startTimeStr));
        const isBlocked = blockedMap.has(normalizedDisplay) || blockedMap.has(normalizeSlot(startTimeStr));

        if (isFullDayBlocked) {
          status = 'BLOCKED';
          reason = 'Entire day blocked by doctor';
        } else if (isBooked) {
          status = 'BOOKED';
          const b = (bookedMap.get(normalizedDisplay) || bookedMap.get(normalizeSlot(startTimeStr)))!;
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
        } else if (isBlocked) {
          status = 'BLOCKED';
          const blk = (blockedMap.get(normalizedDisplay) || blockedMap.get(normalizeSlot(startTimeStr)))!;
          blockId = blk.id;
          reason = blk.reason || 'Turned OFF by doctor';
        } else if (isPast) {
          status = 'PAST';
          reason = 'Time has passed';
        }

        generatedSlots.push({
          id: `${date}_${displayTime.replace(/\s+/g, '_')}`,
          date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          displayTime,
          period: range.period,
          status,
          isPast,
          blockId,
          reason,
          booking: bookingData,
        });

        currentSlotStart = addMinutes(currentSlotStart, stepMinutes);
      }
    }

    return NextResponse.json(
      {
        date,
        isFullDayBlocked,
        currentTimeIST: format(istNow, 'hh:mm a'),
        currentDateIST: todayISTString,
        settings,
        slots: generatedSlots,
        blocked: blockedEntries,
        bookings,
        summary: {
          total: generatedSlots.length,
          available: generatedSlots.filter((s) => s.status === 'AVAILABLE').length,
          blocked: generatedSlots.filter((s) => s.status === 'BLOCKED').length,
          booked: generatedSlots.filter((s) => s.status === 'BOOKED').length,
          past: generatedSlots.filter((s) => s.status === 'PAST').length,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/admin/block-slot:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, timeSlot, reason, bookingId, settings, blockedTimeSlots, isFullDayBlocked } = body;

    // Action: Set exact array of blocked slots for a date (Zero Race Condition / Batch Safe)
    if (action === 'SET_DATE_BLOCKS') {
      if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }

      const updatedStore = await setDateBlocksInStore(
        date,
        Array.isArray(blockedTimeSlots) ? blockedTimeSlots : [],
        Boolean(isFullDayBlocked)
      );

      // Also sync to local DB
      try {
        await prisma.blockedSlot.deleteMany({ where: { date } });
        if (isFullDayBlocked) {
          await prisma.blockedSlot.create({
            data: { date, timeSlot: null, reason: 'Full day turned OFF by doctor' },
          });
        } else if (Array.isArray(blockedTimeSlots)) {
          for (const s of blockedTimeSlots) {
            await prisma.blockedSlot.create({
              data: { date, timeSlot: s, reason: 'Turned OFF by doctor' },
            });
          }
        }
      } catch {
        // Ignore local DB error
      }

      return NextResponse.json({
        success: true,
        date,
        isFullDayBlocked: Boolean(isFullDayBlocked),
        blockedSlots: updatedStore.blockedSlots.filter((b) => b.date === date),
        message: 'Slots updated successfully',
      });
    }

    // Action 1: Toggle single slot ON / OFF
    if (action === 'TOGGLE_SLOT') {
      if (!date || !timeSlot) {
        return NextResponse.json({ error: 'Date and timeSlot are required' }, { status: 400 });
      }

      const result = await toggleSlotInStore(date, timeSlot, reason);

      try {
        if (result.action === 'UNBLOCKED') {
          await prisma.blockedSlot.deleteMany({ where: { date, timeSlot } });
        } else {
          await prisma.blockedSlot.create({
            data: { date, timeSlot, reason: reason || 'Turned OFF by doctor' },
          });
        }
      } catch {
        // Ignore local DB error
      }

      return NextResponse.json({
        success: true,
        action: result.action,
        message: result.action === 'UNBLOCKED'
          ? `Slot ${timeSlot} चालू (ON) कर दिया गया है`
          : `Slot ${timeSlot} बंद (OFF) कर दिया गया है`,
      });
    }

    // Action 2: Toggle entire day ON / OFF
    if (action === 'TOGGLE_DAY') {
      if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }

      const result = await toggleDayInStore(date, reason);

      try {
        if (!result.isFullDayBlocked) {
          await prisma.blockedSlot.deleteMany({ where: { date, timeSlot: null } });
        } else {
          await prisma.blockedSlot.create({
            data: { date, timeSlot: null, reason: reason || 'Day turned OFF by doctor' },
          });
        }
      } catch {
        // Ignore local DB error
      }

      return NextResponse.json({
        success: true,
        action: result.isFullDayBlocked ? 'DAY_BLOCKED' : 'DAY_UNBLOCKED',
        isFullDayBlocked: result.isFullDayBlocked,
        message: result.isFullDayBlocked
          ? `Pura din (${date}) band (OFF) kar diya gaya hai`
          : `Pura din (${date}) chalu (ON) kar diya gaya hai`,
      });
    }

    // Action 3: Cancel booking to instantly free up slot
    if (action === 'CANCEL_BOOKING') {
      if (!bookingId) {
        return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
      }

      await cancelBookingInStore(bookingId);

      try {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
        });
      } catch {
        // Ignore local DB error
      }

      return NextResponse.json({
        success: true,
        action: 'BOOKING_CANCELLED',
        message: 'Booking cancel ho gayi hai aur slot ab available hai!',
      });
    }

    // Action 4: Save General Timing Settings
    if (action === 'UPDATE_SETTINGS' || settings) {
      const updatedSettings = await updateStoreSettings(settings || body);

      try {
        await prisma.adminSetting.upsert({
          where: { id: 'default' },
          update: {
            morningStart: updatedSettings.morningStart,
            morningEnd: updatedSettings.morningEnd,
            eveningStart: updatedSettings.eveningStart,
            eveningEnd: updatedSettings.eveningEnd,
            slotDurationMin: updatedSettings.slotDurationMin,
            bufferTimeMin: updatedSettings.bufferTimeMin,
            workingDays: JSON.stringify(updatedSettings.workingDays),
          },
          create: {
            id: 'default',
            morningStart: updatedSettings.morningStart,
            morningEnd: updatedSettings.morningEnd,
            eveningStart: updatedSettings.eveningStart,
            eveningEnd: updatedSettings.eveningEnd,
            slotDurationMin: updatedSettings.slotDurationMin,
            bufferTimeMin: updatedSettings.bufferTimeMin,
            workingDays: JSON.stringify(updatedSettings.workingDays),
          },
        });
      } catch {
        // Ignore local DB error
      }

      return NextResponse.json({
        success: true,
        settings: updatedSettings,
        message: 'Timing settings successfully save ho gayi hain aur live site par update ho gayi hain!',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/admin/block-slot:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
