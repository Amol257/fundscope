import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display, Sora } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';
import ErrorSuppressor from '@/components/ErrorSuppressor';
import { PageTransition } from '@/components/ui/PageTransition';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { LenisScroll } from '@/components/ui/LenisScroll';
import ScopeGenie from '@/components/ui/ScopeGenie';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-data',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-number-family',
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'FundScope | Precision Mutual Fund Analytics',
  description: 'Analyze complex mutual fund data, strip away the marketing, and show you exactly how your money is performing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${sora.variable}`}>
      <body suppressHydrationWarning className="grain-overlay antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-on-primary">
        <ErrorSuppressor />
        <LenisScroll />
        <VideoBackground />
        <Navbar />
        <PageTransition>
          {children}
        </PageTransition>
        <Footer />
        <ScopeGenie />
      </body>
    </html>
  );
}
