import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dr. Shafali Garg | 5-Minute Consultation (₹21)',
  description:
    'Book a direct 5-minute 1-on-1 consultation with Dr. Shafali Garg for only ₹21 on Google Meet.',
  keywords: ['Dr Shafali Garg', 'Consultation', 'Life Guidance', 'Career Guidance'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
