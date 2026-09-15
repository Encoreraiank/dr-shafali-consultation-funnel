import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCloudStore, updateStoreSettings } from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cloudStore = await getCloudStore();
    return NextResponse.json({
      ...cloudStore.settings,
      workingDays: cloudStore.settings.workingDays,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      morningStart: '10:00',
      morningEnd: '13:00',
      eveningStart: '17:00',
      eveningEnd: '20:00',
      slotDurationMin: 5,
      bufferTimeMin: 2,
      consultationFee: 21,
      doctorPhone: '+919910112346',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updatedSettings = await updateStoreSettings(body);

    // Also update local DB
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
          consultationFee: updatedSettings.consultationFee,
          doctorPhone: updatedSettings.doctorPhone,
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
          consultationFee: updatedSettings.consultationFee,
          doctorPhone: updatedSettings.doctorPhone,
        },
      });
    } catch {
      // Ignore local DB error
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
