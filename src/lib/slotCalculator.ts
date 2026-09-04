import prisma from './db';
import { Slot } from '@/types';
import { format, parse, addMinutes, isAfter, isBefore, isSameDay } from 'date-fns';

export async function getAvailableSlotsForDate(dateString: string): Promise<{
  date: string;
  isAvailableDay: boolean;
  message?: string;
  slots: Slot[];
}> {
  // Clean expired locks first
  try {
    await prisma.temporaryLock.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch {
    // Ignore if table not yet migrated during first run
  }

  // Get admin settings
  let settings = await prisma.adminSetting.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.adminSetting.create({
      data: {
        id: 'default',
        workingDays: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
        morningStart: '10:00',
        morningEnd: '13:00',
        eveningStart: '17:00',
        eveningEnd: '20:00',
        slotDurationMin: 5,
        bufferTimeMin: 2,
        consultationFee: 21,
        doctorEmail: 'drshafali.official@gmail.com',
        doctorPhone: '+919540329351',
        autoGenerateMeet: true,
      },
    });
  }

  // Parse working days
  let allowedDays: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  try {
    allowedDays = JSON.parse(settings.workingDays);
  } catch {
    allowedDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  }

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

  // Check if date is blocked
  const blockedEntries = await prisma.blockedSlot.findMany({
    where: { date: dateString },
  });

  const fullDayBlocked = blockedEntries.some((b) => !b.timeSlot);
  if (fullDayBlocked) {
    return {
      date: dateString,
      isAvailableDay: false,
      message: 'Dr. Shafali Garg has marked this entire day as busy/leave.',
      slots: [],
    };
  }

  const blockedTimeSlots = new Set(
    blockedEntries.filter((b) => b.timeSlot).map((b) => b.timeSlot!)
  );

  // Fetch confirmed & pending bookings for this date
  const existingBookings = await prisma.booking.findMany({
    where: {
      date: dateString,
      status: {
        in: ['CONFIRMED', 'PENDING'],
      },
    },
    select: {
      timeSlot: true,
    },
  });

  const bookedSlots = new Set(existingBookings.map((b) => b.timeSlot));

  // Fetch active locks
  const activeLocks = await prisma.temporaryLock.findMany({
    where: {
      date: dateString,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  const lockedSlots = new Set(activeLocks.map((l) => l.timeSlot));

  const slotDuration = settings.slotDurationMin || 5;
  const bufferTime = settings.bufferTimeMin || 2;
  const stepMinutes = slotDuration + bufferTime; // 7 minutes between slot starts

  const slots: Slot[] = [];

  const timeRanges = [
    { start: settings.morningStart || '10:00', end: settings.morningEnd || '13:00', period: 'morning' as const },
    { start: settings.eveningStart || '17:00', end: settings.eveningEnd || '20:00', period: 'evening' as const },
  ];

  const now = new Date();
  const isToday = isSameDay(queryDate, now);

  for (const range of timeRanges) {
    let currentSlotStart = parse(`${dateString} ${range.start}`, 'yyyy-MM-dd HH:mm', new Date());
    const rangeEnd = parse(`${dateString} ${range.end}`, 'yyyy-MM-dd HH:mm', new Date());

    while (isBefore(currentSlotStart, rangeEnd)) {
      const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);
      if (isAfter(currentSlotEnd, rangeEnd)) break;

      const startTimeStr = format(currentSlotStart, 'hh:mm a');
      const endTimeStr = format(currentSlotEnd, 'hh:mm a');
      const displayTime = `${startTimeStr} - ${endTimeStr}`;

      // Check if slot has already passed if today
      const isPast = isToday && isBefore(currentSlotStart, addMinutes(now, 15)); // at least 15 mins advance booking

      const isBooked = bookedSlots.has(displayTime);
      const isBlocked = blockedTimeSlots.has(displayTime);
      const isLocked = lockedSlots.has(displayTime);

      const isAvailable = !isPast && !isBooked && !isBlocked && !isLocked;

      slots.push({
        id: `${dateString}_${displayTime.replace(/\s+/g, '_')}`,
        date: dateString,
        startTime: startTimeStr,
        endTime: endTimeStr,
        displayTime,
        period: range.period,
        isAvailable,
        isLocked,
      });

      // Advance by slot duration + buffer
      currentSlotStart = addMinutes(currentSlotStart, stepMinutes);
    }
  }

  return {
    date: dateString,
    isAvailableDay: true,
    slots,
  };
}
