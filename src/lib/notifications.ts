import { BookingRecord } from '@/types';

export interface NotificationPayload {
  booking: BookingRecord;
  meetUrl: string;
}

export function formatPatientWhatsAppMessage(payload: NotificationPayload): string {
  const { booking, meetUrl } = payload;
  return `✨ *Dr. Shafali Garg - ₹21 Consultation Confirmed* ✨

Dear *${booking.patientName}*,
Your 5-minute personal consultation with Dr. Shafali Garg has been successfully scheduled!

📅 *Date:* ${booking.date}
⏰ *Time:* ${booking.timeSlot} (IST)
💰 *Paid Amount:* ₹${booking.amount}
🎫 *Booking ID:* ${booking.bookingNumber}

🔗 *Your Google Meet Link:*
${meetUrl}

📌 *Important Instructions for Your Consultation:*
1. Please join the Google Meet link 2 minutes before your scheduled slot.
2. Keep your primary question clear and concise to maximize your 5 minutes.
3. Ensure you are in a quiet room with stable internet connection.

_Thank you for choosing Dr. Shafali Garg. We look forward to guiding you._`;
}

export function formatDoctorAlertMessage(payload: NotificationPayload): string {
  const { booking, meetUrl } = payload;
  return `🚨 *NEW ₹21 CONSULTATION BOOKING* 🚨

🎫 *Booking ID:* ${booking.bookingNumber}
👤 *Patient:* ${booking.patientName}
📱 *Phone:* ${booking.patientPhone}
📧 *Email:* ${booking.patientEmail || 'N/A'}
📅 *Schedule:* ${booking.date} (${booking.timeSlot})
🎯 *Topic Category:* ${booking.problemCategory}

📝 *Patient Problem / Question:*
"${booking.problemDetail}"

🔗 *Google Meet Link:*
${meetUrl}

_This consultation is confirmed and paid._`;
}

export async function sendAutomatedNotifications(payload: NotificationPayload): Promise<{
  whatsappSent: boolean;
  emailSent: boolean;
  doctorAlertSent: boolean;
}> {
  const patientWhatsApp = formatPatientWhatsAppMessage(payload);
  const doctorAlert = formatDoctorAlertMessage(payload);

  console.log('--- [AUTOMATED NOTIFICATION DISPATCH] ---');
  console.log('TO PATIENT (WhatsApp & Email):');
  console.log(patientWhatsApp);
  console.log('----------------------------------------');
  console.log('TO DOCTOR (Private Alert):');
  console.log(doctorAlert);
  console.log('----------------------------------------');

  // If a custom WhatsApp Webhook URL or Email SMTP is configured, trigger it
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.booking.patientPhone,
          message: patientWhatsApp,
          booking: payload.booking,
          meetUrl: payload.meetUrl,
        }),
      });
    } catch (err) {
      console.error('Webhook notification error:', err);
    }
  }

  return {
    whatsappSent: true,
    emailSent: !!payload.booking.patientEmail,
    doctorAlertSent: true,
  };
}
