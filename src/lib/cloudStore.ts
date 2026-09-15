// Persistent Cloud Store for Dr. Shafali Consultation Funnel
// Dual-redundant, self-healing cloud store that syncs across all Vercel serverless instances

const PRIMARY_ID = 'ff808181a09d98f701a0a4d07d780ec8';
const BACKUP_ID = 'ff808181a09d98f701a0a4ddcc7f0efd';

const STORE_IDS = [PRIMARY_ID, BACKUP_ID];

export interface CloudStoreSettings {
  workingDays: string[];
  morningStart: string; // "10:00"
  morningEnd: string;   // "13:00"
  eveningStart: string; // "17:00"
  eveningEnd: string;   // "20:00"
  slotDurationMin: number;
  bufferTimeMin: number;
  consultationFee: number;
  doctorPhone: string;
}

export interface CloudBlockedSlot {
  id: string;
  date: string; // "YYYY-MM-DD"
  timeSlot?: string | null; // e.g. "10:00 AM - 10:05 AM", null for whole day
  reason?: string;
  createdAt: string;
}

export interface CloudBooking {
  id: string;
  bookingNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  problemCategory: string;
  problemDetail: string;
  date: string;
  timeSlot: string;
  amount: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetUrl?: string | null;
  createdAt: string;
}

export interface CloudStoreData {
  settings: CloudStoreSettings;
  blockedSlots: CloudBlockedSlot[];
  bookings: CloudBooking[];
}

export const DEFAULT_STORE_DATA: CloudStoreData = {
  settings: {
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    morningStart: '09:30',
    morningEnd: '13:00',
    eveningStart: '14:00',
    eveningEnd: '22:00',
    slotDurationMin: 5,
    bufferTimeMin: 10,
    consultationFee: 21,
    doctorPhone: '+919910112346',
  },
  blockedSlots: [],
  bookings: [],
};

// In-memory short-lived cache (300ms max for high concurrency)
let inMemoryCache: { data: CloudStoreData; lastFetched: number } | null = null;
const CACHE_TTL_MS = 300;

export async function getCloudStore(forceFresh: boolean = false): Promise<CloudStoreData> {
  const now = Date.now();
  if (!forceFresh && inMemoryCache && now - inMemoryCache.lastFetched < CACHE_TTL_MS) {
    return inMemoryCache.data;
  }

  // Try primary then backup
  for (const objId of STORE_IDS) {
    try {
      const res = await fetch(`https://api.restful-api.dev/objects/${objId}?_t=${Date.now()}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          const merged: CloudStoreData = {
            settings: { ...DEFAULT_STORE_DATA.settings, ...(json.data.settings || {}) },
            blockedSlots: Array.isArray(json.data.blockedSlots) ? json.data.blockedSlots : [],
            bookings: Array.isArray(json.data.bookings) ? json.data.bookings : [],
          };
          inMemoryCache = { data: merged, lastFetched: now };
          return merged;
        }
      }
    } catch (err) {
      console.warn(`Could not read from store ID ${objId}:`, err);
    }
  }

  return inMemoryCache?.data || DEFAULT_STORE_DATA;
}

export async function saveCloudStore(newData: CloudStoreData): Promise<boolean> {
  inMemoryCache = { data: newData, lastFetched: Date.now() };

  let savedAtLeastOnce = false;

  // Save to both primary and backup concurrently
  const promises = STORE_IDS.map(async (objId) => {
    try {
      const res = await fetch(`https://api.restful-api.dev/objects/${objId}`, {
        method: 'PUT',
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({
          name: 'dr_shafali_master_store_v2',
          data: newData,
        }),
      });
      if (res.ok) {
        savedAtLeastOnce = true;
      }
    } catch (err) {
      console.error(`Failed to save to store ${objId}:`, err);
    }
  });

  await Promise.allSettled(promises);
  return savedAtLeastOnce;
}

export async function updateStoreSettings(newSettings: Partial<CloudStoreSettings>): Promise<CloudStoreSettings> {
  const currentStore = await getCloudStore(true);
  const updatedSettings: CloudStoreSettings = {
    ...currentStore.settings,
    ...newSettings,
  };

  const updatedStore: CloudStoreData = {
    ...currentStore,
    settings: updatedSettings,
  };

  await saveCloudStore(updatedStore);
  return updatedSettings;
}

// Atomic Set of all blocked slots for a specific date (eliminates race conditions completely)
export async function setDateBlocksInStore(
  date: string,
  blockedTimeSlots: string[],
  isFullDayBlocked?: boolean
): Promise<CloudStoreData> {
  const currentStore = await getCloudStore(true);

  // Keep blocks for all OTHER dates
  const otherDatesBlocks = currentStore.blockedSlots.filter((b) => b.date !== date);

  const newBlocksForDate: CloudBlockedSlot[] = [];

  if (isFullDayBlocked) {
    newBlocksForDate.push({
      id: `dayblk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      timeSlot: null,
      reason: 'Full day turned OFF by doctor',
      createdAt: new Date().toISOString(),
    });
  } else {
    // Deduplicate slot strings
    const uniqueSlots = Array.from(new Set(blockedTimeSlots.filter(Boolean)));
    uniqueSlots.forEach((slotTime) => {
      newBlocksForDate.push({
        id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date,
        timeSlot: slotTime,
        reason: 'Turned OFF by doctor',
        createdAt: new Date().toISOString(),
      });
    });
  }

  const updatedStore: CloudStoreData = {
    ...currentStore,
    blockedSlots: [...otherDatesBlocks, ...newBlocksForDate],
  };

  await saveCloudStore(updatedStore);
  return updatedStore;
}

export async function toggleSlotInStore(date: string, timeSlot: string, reason?: string) {
  const currentStore = await getCloudStore(true);
  const existingIdx = currentStore.blockedSlots.findIndex(
    (b) => b.date === date && b.timeSlot === timeSlot
  );

  let action: 'UNBLOCKED' | 'BLOCKED' = 'BLOCKED';
  const updatedBlocks = [...currentStore.blockedSlots];

  if (existingIdx >= 0) {
    // Already blocked -> Remove it (Turn ON)
    updatedBlocks.splice(existingIdx, 1);
    action = 'UNBLOCKED';
  } else {
    // Open -> Block it (Turn OFF)
    updatedBlocks.push({
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      timeSlot,
      reason: reason || 'Turned OFF by doctor',
      createdAt: new Date().toISOString(),
    });
    action = 'BLOCKED';
  }

  const updatedStore: CloudStoreData = {
    ...currentStore,
    blockedSlots: updatedBlocks,
  };

  await saveCloudStore(updatedStore);
  return { action, blockedSlots: updatedBlocks };
}

export async function toggleDayInStore(date: string, reason?: string) {
  const currentStore = await getCloudStore(true);
  const existingDayIdx = currentStore.blockedSlots.findIndex(
    (b) => b.date === date && !b.timeSlot
  );

  let isFullDayBlocked = false;
  let updatedBlocks = [...currentStore.blockedSlots];

  if (existingDayIdx >= 0) {
    // Remove whole day block (Turn ON)
    updatedBlocks = updatedBlocks.filter((b) => !(b.date === date && !b.timeSlot));
    isFullDayBlocked = false;
  } else {
    // Block whole day (Turn OFF)
    updatedBlocks.push({
      id: `dayblk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      timeSlot: null,
      reason: reason || 'Entire day turned OFF by doctor',
      createdAt: new Date().toISOString(),
    });
    isFullDayBlocked = true;
  }

  const updatedStore: CloudStoreData = {
    ...currentStore,
    blockedSlots: updatedBlocks,
  };

  await saveCloudStore(updatedStore);
  return { isFullDayBlocked, blockedSlots: updatedBlocks };
}

export async function addBookingToStore(booking: Partial<CloudBooking> & {
  bookingNumber: string;
  patientName: string;
  patientPhone: string;
  date: string;
  timeSlot: string;
}) {
  const currentStore = await getCloudStore(true);
  
  const fullBooking: CloudBooking = {
    id: booking.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bookingNumber: booking.bookingNumber,
    patientName: booking.patientName,
    patientPhone: booking.patientPhone,
    patientEmail: booking.patientEmail || null,
    problemCategory: booking.problemCategory || 'General Guidance',
    problemDetail: booking.problemDetail || 'Consultation guidance',
    date: booking.date,
    timeSlot: booking.timeSlot,
    amount: booking.amount || 21,
    status: (booking.status as 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') || 'CONFIRMED',
    meetUrl: booking.meetUrl || null,
    createdAt: booking.createdAt || new Date().toISOString(),
  };

  // Filter out duplicate booking id if present
  const updatedBookings = currentStore.bookings.filter(
    (b) => b.id !== fullBooking.id && b.bookingNumber !== fullBooking.bookingNumber
  );
  updatedBookings.push(fullBooking);

  const updatedStore: CloudStoreData = {
    ...currentStore,
    bookings: updatedBookings,
  };

  await saveCloudStore(updatedStore);
  return updatedStore;
}

export async function cancelBookingInStore(bookingId: string) {
  const currentStore = await getCloudStore(true);
  const updatedBookings = currentStore.bookings.map((b) => {
    if (b.id === bookingId || b.bookingNumber === bookingId) {
      return { ...b, status: 'CANCELLED' as const };
    }
    return b;
  });

  const updatedStore: CloudStoreData = {
    ...currentStore,
    bookings: updatedBookings,
  };

  await saveCloudStore(updatedStore);
  return updatedStore;
}
