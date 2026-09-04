import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlotsForDate } from '@/lib/slotCalculator';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

    const result = await getAvailableSlotsForDate(dateParam);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
