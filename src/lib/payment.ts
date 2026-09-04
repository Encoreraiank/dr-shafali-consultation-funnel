import crypto from 'crypto';

export interface CreateOrderParams {
  amount: number; // in INR (e.g. 21)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export function generateBookingNumber(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `DSG-${randomDigits}`;
}

export async function createPaymentOrder(params: CreateOrderParams) {
  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'MOCK';
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  // If live mode and valid Razorpay keys exist
  if (paymentMode === 'LIVE' && razorpayKeyId && razorpaySecret && !razorpayKeyId.includes('mock')) {
    try {
      const basicAuth = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount * 100, // Razorpay amount in paise (2100 paise = ₹21)
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes || {},
        }),
      });

      const orderData = await res.json();
      if (orderData.id) {
        return {
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: razorpayKeyId,
          mode: 'LIVE',
        };
      }
    } catch (error) {
      console.error('Razorpay Order Creation Failed, falling back to Sandbox:', error);
    }
  }

  // Sandbox / Mock Order Generator
  const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    orderId: mockOrderId,
    amount: params.amount * 100,
    currency: 'INR',
    keyId: razorpayKeyId || 'rzp_test_mock',
    mode: 'MOCK',
  };
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'MOCK';
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  // If in Mock mode or mock order
  if (params.orderId.startsWith('order_mock_') || paymentMode === 'MOCK' || !razorpaySecret || razorpaySecret.includes('mock')) {
    return true; // Auto-verify in test/mock environment
  }

  try {
    const text = `${params.orderId}|${params.paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(text)
      .digest('hex');

    return generatedSignature === params.signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
