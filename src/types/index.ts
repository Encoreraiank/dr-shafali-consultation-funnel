export interface Slot {
  id: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "10:00 AM"
  endTime: string; // "10:05 AM"
  displayTime: string; // "10:00 AM - 10:05 AM"
  period: 'morning' | 'afternoon' | 'evening';
  isAvailable: boolean;
  isLocked?: boolean;
}

export interface ProblemCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface BookingFormData {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  problemCategory: string;
  problemDetail: string;
  date: string;
  timeSlot: string;
  startTimeIso?: string;
  endTimeIso?: string;
}

export interface BookingRecord {
  id: string;
  bookingNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  problemCategory: string;
  problemDetail: string;
  date: string;
  timeSlot: string;
  startTime: string | Date;
  endTime: string | Date;
  amount: number;
  paymentStatus: string;
  paymentId?: string | null;
  orderId?: string | null;
  paymentMethod?: string | null;
  meetUrl?: string | null;
  googleEventId?: string | null;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdminSettingsData {
  id: string;
  adminPassword?: string;
  workingDays: string[];
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  slotDurationMin: number;
  bufferTimeMin: number;
  consultationFee: number;
  doctorEmail: string;
  doctorPhone: string;
  autoGenerateMeet: boolean;
}
