import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'tele-flight-tracker | Premium Flight Price Tracker & Bot',
  description: 'Track round-trip flight ticket prices with beautiful glassmorphic analytics, dynamic departure countdowns, and real-time Telegram Bot updates.',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans relative">
        {/* Glow Effects */}
        <div className="bg-glow-emerald" />
        <div className="bg-glow-indigo" />
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
