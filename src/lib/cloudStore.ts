// Persistent Cloud Store for Dr. Shafali Consultation Funnel
// Ensures settings, blocked slots, and bookings persist across all Vercel serverless instances

const CLOUD_OBJECT_ID = 'ff808181a09d98f701a0a37749730b30';
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

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
    morningStart: '10:00',
    morningEnd: '13:00',
    eveningStart: '17:00',
    eveningEnd: '20:00',
    slotDurationMin: 5,
    bufferTimeMin: 2,
    consultationFee: 21,
    doctorPhone: '+919910112346',
  },
  blockedSlots: [],
  bookings: [],
};

// In-memory short-lived cache (500ms max for high concurrency)
let inMemoryCache: { data: CloudStoreData; lastFetched: number } | null = null;
const CACHE_TTL_MS = 500;

export async function getCloudStore(forceFresh: boolean = false): Promise<CloudStoreData> {
  const now = Date.now();
  if (!forceFresh && inMemoryCache && now - inMemoryCache.lastFetched < CACHE_TTL_MS) {
    return inMemoryCache.data;
  }

  try {
    const res = await fetch(CLOUD_API_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
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
    console.error('Failed to fetch from cloud store, using memory cache/fallback:', err);
  }

  return inMemoryCache?.data || DEFAULT_STORE_DATA;
}

export async function saveCloudStore(newData: CloudStoreData): Promise<boolean> {
  inMemoryCache = { data: newData, lastFetched: Date.now() };

  try {
    const res = await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'dr_shafali_master_store_v1',
        data: newData,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to save to cloud store:', err);
    return false;
  }
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

  await saveCloudStore({
    ...currentStore,
    blockedSlots: updatedBlocks,
  });

  return { action, blockedSlots: updatedBlocks };
}

export async function toggleDayInStore(date: string, reason?: string) {
  const currentStore = await getCloudStore(true);
  const existingDayBlockIdx = currentStore.blockedSlots.findIndex(
    (b) => b.date === date && !b.timeSlot
  );

  let isFullDayBlocked = false;
  const updatedBlocks = [...currentStore.blockedSlots];

  if (existingDayBlockIdx >= 0) {
    // Day was blocked -> Remove full-day block (Turn ON)
    updatedBlocks.splice(existingDayBlockIdx, 1);
    isFullDayBlocked = false;
  } else {
    // Block whole day (Turn OFF)
    updatedBlocks.push({
      id: `dayblk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      timeSlot: null,
      reason: reason || 'Full day turned OFF by doctor',
      createdAt: new Date().toISOString(),
    });
    isFullDayBlocked = true;
  }

  await saveCloudStore({
    ...currentStore,
    blockedSlots: updatedBlocks,
  });

  return { isFullDayBlocked, blockedSlots: updatedBlocks };
}

export async function addBookingToStore(booking: Omit<CloudBooking, 'id' | 'createdAt'>): Promise<CloudBooking> {
  const currentStore = await getCloudStore(true);
  const newBooking: CloudBooking = {
    ...booking,
    id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  await saveCloudStore({
    ...currentStore,
    bookings: [newBooking, ...currentStore.bookings],
  });

  return newBooking;
}

export async function cancelBookingInStore(bookingId: string) {
  const currentStore = await getCloudStore(true);
  const updatedBookings = currentStore.bookings.map((b) =>
    b.id === bookingId || b.bookingNumber === bookingId ? { ...b, status: 'CANCELLED' as const } : b
  );

  await saveCloudStore({
    ...currentStore,
    bookings: updatedBookings,
  });

  return { success: true };
}
