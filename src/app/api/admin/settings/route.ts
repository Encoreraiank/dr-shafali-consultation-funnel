import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
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

    let workingDays: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    try {
      workingDays = JSON.parse(settings.workingDays);
    } catch {
      workingDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    }

    return NextResponse.json({
      ...settings,
      workingDays,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
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

    const updated = await prisma.adminSetting.upsert({
      where: { id: 'default' },
      update: dataToUpdate,
      create: {
        id: 'default',
        workingDays: JSON.stringify(workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
        morningStart: morningStart || '10:00',
        morningEnd: morningEnd || '13:00',
        eveningStart: eveningStart || '17:00',
        eveningEnd: eveningEnd || '20:00',
        slotDurationMin: Number(slotDurationMin) || 5,
        bufferTimeMin: Number(bufferTimeMin) || 2,
        consultationFee: Number(consultationFee) || 21,
        doctorEmail: doctorEmail || 'drshafali.official@gmail.com',
        doctorPhone: doctorPhone || '+919540329351',
        autoGenerateMeet: autoGenerateMeet ?? true,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
