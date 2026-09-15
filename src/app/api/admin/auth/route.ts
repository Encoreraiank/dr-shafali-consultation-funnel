import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = (body.password || '').trim();

    if (!password) {
      return NextResponse.json(
        { error: 'Please enter a password' },
        { status: 400 }
      );
    }

    const envPassword = (process.env.ADMIN_PASSWORD || 'admin@drshafali2026').trim();

    // Allowed master passwords that always work
    const validPasswords = new Set([
      'admin@drshafali2026',
      'admin123',
      'drshafali2026',
      '9540329351',
      'admin',
      envPassword,
    ]);

    // Attempt to read custom password from DB if available
    try {
      const settings = await prisma.adminSetting.findUnique({
        where: { id: 'default' },
      });
      if (settings?.adminPassword?.trim()) {
        validPasswords.add(settings.adminPassword.trim());
      }
    } catch (dbErr) {
      console.error('DB read skipped during auth:', dbErr);
    }

    if (validPasswords.has(password)) {
      return NextResponse.json({
        success: true,
        token: `admin_token_${Buffer.from(password).toString('base64')}`,
        message: 'Authenticated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Incorrect Admin Password. Default is: admin@drshafali2026' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
