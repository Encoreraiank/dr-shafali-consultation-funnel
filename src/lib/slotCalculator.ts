import prisma from './db';
import { Slot } from '@/types';
import { format, parse, addMinutes, isBefore, isAfter } from 'date-fns';
import { getCloudStore } from './cloudStore';

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

export async function getAvailableSlotsForDate(dateString: string): Promise<{
  date: string;
  isAvailableDay: boolean;
  message?: string;
  slots: Slot[];
}> {
  // 1. Fetch live cloud store data (settings, blocked slots, bookings)
  const cloudStore = await getCloudStore(true);
  const settings = cloudStore.settings;

  const allowedDays = Array.isArray(settings.workingDays) && settings.workingDays.length > 0
    ? settings.workingDays.map((d) => d.toUpperCase())
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const queryDate = parse(dateString, 'yyyy-MM-dd', new Date());
  const dayName = format(queryDate, 'EEE').toUpperCase(); // e.g. "MON"

  if (!allowedDays.includes(dayName)) {
    return {
      date: dateString,
      isAvailableDay: false,
      message: 'Dr. Shafali Garg is not available on this day of the week.',
      slots: [],
    };
  }

  // 2. Check if date or specific slot is blocked in cloud store
  const blockedEntriesForDate = cloudStore.blockedSlots.filter((b) => b.date === dateString);
  const fullDayBlocked = blockedEntriesForDate.some((b) => !b.timeSlot);

  if (fullDayBlocked) {
    return {
      date: dateString,
      isAvailableDay: false,
      message: 'Dr. Shafali Garg has marked this entire day as busy/leave.',
      slots: [],
    };
  }

  const blockedTimeSlots = new Set<string>(
    blockedEntriesForDate.filter((b) => Boolean(b.timeSlot)).map((b) => normalizeSlot(b.timeSlot!))
  );

  // Also check local DB if available
  try {
    const localBlocked = await prisma.blockedSlot.findMany({
      where: { date: dateString },
    });
    if (localBlocked.some((b) => !b.timeSlot)) {
      return {
        date: dateString,
        isAvailableDay: false,
        message: 'Dr. Shafali Garg has marked this entire day as busy/leave.',
        slots: [],
      };
    }
    localBlocked.filter((b) => b.timeSlot).forEach((b) => blockedTimeSlots.add(normalizeSlot(b.timeSlot!)));
  } catch {
    // Ignore db read error
  }

  // 3. Fetch confirmed & pending bookings for this date from Cloud Store & DB
  const bookedSlots = new Set<string>();
  cloudStore.bookings
    .filter((b) => b.date === dateString && b.status !== 'CANCELLED')
    .forEach((b) => bookedSlots.add(normalizeSlot(b.timeSlot)));

  try {
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: dateString,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { timeSlot: true },
    });
    existingBookings.forEach((b) => bookedSlots.add(normalizeSlot(b.timeSlot)));
  } catch {
    // Ignore db read error
  }

  const slotDuration = Number(settings.slotDurationMin) || 5;
  const bufferTime = Number(settings.bufferTimeMin) !== undefined ? Number(settings.bufferTimeMin) : 2;
  const stepMinutes = slotDuration + bufferTime;

  const slots: Slot[] = [];

  const timeRanges = [
    { start: settings.morningStart || '10:00', end: settings.morningEnd || '13:00', period: 'morning' as const },
    { start: settings.eveningStart || '17:00', end: settings.eveningEnd || '20:00', period: 'evening' as const },
  ];

  const istNow = getCurrentISTDate();
  const todayISTString = format(istNow, 'yyyy-MM-dd');
  const isToday = dateString === todayISTString;
  const currentISTTotalMinutes = istNow.getHours() * 60 + istNow.getMinutes();

  for (const range of timeRanges) {
    let currentSlotStart = parse(`${dateString} ${range.start}`, 'yyyy-MM-dd HH:mm', new Date());
    const rangeEnd = parse(`${dateString} ${range.end}`, 'yyyy-MM-dd HH:mm', new Date());

    while (isBefore(currentSlotStart, rangeEnd)) {
      const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);
      if (isAfter(currentSlotEnd, rangeEnd)) break;

      const startTimeStr = format(currentSlotStart, 'hh:mm a');
      const endTimeStr = format(currentSlotEnd, 'hh:mm a');
      const displayTime = `${startTimeStr} - ${endTimeStr}`;
      const normalizedDisplay = normalizeSlot(displayTime);

      // Check if past for today using IST minutes
      let isPast = false;
      if (isToday) {
        const slotStartMinutes = currentSlotStart.getHours() * 60 + currentSlotStart.getMinutes();
        isPast = slotStartMinutes <= currentISTTotalMinutes + 10;
      }

      const isBooked = bookedSlots.has(normalizedDisplay);
      const isBlocked = blockedTimeSlots.has(normalizedDisplay);

      const isAvailable = !isPast && !isBooked && !isBlocked;

      slots.push({
        id: `${dateString}_${displayTime.replace(/\s+/g, '_')}`,
        date: dateString,
        startTime: startTimeStr,
        endTime: endTimeStr,
        displayTime,
        period: range.period,
        isAvailable,
        isLocked: isBooked,
      });

      currentSlotStart = addMinutes(currentSlotStart, stepMinutes);
    }
  }

  return {
    date: dateString,
    isAvailableDay: true,
    slots,
  };
}
