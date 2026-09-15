import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const defaultSettings = {
  id: 'default',
  workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  morningStart: '10:00',
  morningEnd: '13:00',
  eveningStart: '17:00',
  eveningEnd: '20:00',
  slotDurationMin: 5,
  bufferTimeMin: 2,
  consultationFee: 21,
  doctorEmail: 'Shafaligarg@gmail.com',
  doctorPhone: '+919540329351',
  autoGenerateMeet: true,
};

export async function GET() {
  try {
    let settings = null;
    try {
      settings = await prisma.adminSetting.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        settings = await prisma.adminSetting.create({
          data: {
            id: 'default',
            workingDays: JSON.stringify(defaultSettings.workingDays),
            morningStart: defaultSettings.morningStart,
            morningEnd: defaultSettings.morningEnd,
            eveningStart: defaultSettings.eveningStart,
            eveningEnd: defaultSettings.eveningEnd,
            slotDurationMin: defaultSettings.slotDurationMin,
            bufferTimeMin: defaultSettings.bufferTimeMin,
            consultationFee: defaultSettings.consultationFee,
            doctorEmail: defaultSettings.doctorEmail,
            doctorPhone: defaultSettings.doctorPhone,
            autoGenerateMeet: true,
          },
        });
      }
    } catch (dbErr) {
      console.error('DB settings read error, using fallback:', dbErr);
    }

    if (!settings) {
      return NextResponse.json(defaultSettings);
    }

    let workingDays = defaultSettings.workingDays;
    try {
      workingDays = JSON.parse(settings.workingDays);
    } catch {
      workingDays = defaultSettings.workingDays;
    }

    return NextResponse.json({
      ...settings,
      workingDays,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(defaultSettings);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workingDays,
      morningStart,
      morningEnd,
      eveningStart,
      eveningEnd,
      slotDurationMin,
      bufferTimeMin,
      consultationFee,
      doctorEmail,
      doctorPhone,
      autoGenerateMeet,
      adminPassword,
    } = body;

    const dataToUpdate: Record<string, unknown> = {};

    if (workingDays) dataToUpdate.workingDays = JSON.stringify(workingDays);
    if (morningStart) dataToUpdate.morningStart = morningStart;
    if (morningEnd) dataToUpdate.morningEnd = morningEnd;
    if (eveningStart) dataToUpdate.eveningStart = eveningStart;
    if (eveningEnd) dataToUpdate.eveningEnd = eveningEnd;
    if (slotDurationMin) dataToUpdate.slotDurationMin = Number(slotDurationMin);
    if (bufferTimeMin) dataToUpdate.bufferTimeMin = Number(bufferTimeMin);
    if (consultationFee) dataToUpdate.consultationFee = Number(consultationFee);
    if (doctorEmail) dataToUpdate.doctorEmail = doctorEmail;
    if (doctorPhone) dataToUpdate.doctorPhone = doctorPhone;
    if (autoGenerateMeet !== undefined) dataToUpdate.autoGenerateMeet = Boolean(autoGenerateMeet);
    if (adminPassword) dataToUpdate.adminPassword = adminPassword;

    let updated = null;
    try {
      updated = await prisma.adminSetting.upsert({
        where: { id: 'default' },
        update: dataToUpdate,
        create: {
          id: 'default',
          workingDays: JSON.stringify(workingDays || defaultSettings.workingDays),
          morningStart: morningStart || defaultSettings.morningStart,
          morningEnd: morningEnd || defaultSettings.morningEnd,
          eveningStart: eveningStart || defaultSettings.eveningStart,
          eveningEnd: eveningEnd || defaultSettings.eveningEnd,
          slotDurationMin: Number(slotDurationMin) || defaultSettings.slotDurationMin,
          bufferTimeMin: Number(bufferTimeMin) || defaultSettings.bufferTimeMin,
          consultationFee: Number(consultationFee) || defaultSettings.consultationFee,
          doctorEmail: doctorEmail || defaultSettings.doctorEmail,
          doctorPhone: doctorPhone || defaultSettings.doctorPhone,
          autoGenerateMeet: autoGenerateMeet ?? true,
        },
      });
    } catch (dbErr) {
      console.error('DB save error:', dbErr);
    }

    return NextResponse.json({ success: true, settings: updated || defaultSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
