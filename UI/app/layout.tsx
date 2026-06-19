import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono, Playfair_Display, Sora } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';
import ErrorSuppressor from '@/components/ErrorSuppressor';
import { PageTransition } from '@/components/ui/PageTransition';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { LenisScroll } from '@/components/ui/LenisScroll';
import ScopeGenie from '@/components/ui/ScopeGenie';
import FontSwitcher from '@/components/ui/FontSwitcher';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-data',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif-google',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-number-family',
  weight: ['400', '600', '700', '800'],
});

const medio = localFont({
  src: '../public/fonts/medio.otf',
  variable: '--font-medio-family',
});

const ltMuseum = localFont({
  src: [
    {
      path: '../public/fonts/LTMuseum-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/LTMuseum-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/LTMuseum-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-museum-family',
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
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${sora.variable} ${medio.variable} ${ltMuseum.variable}`}>
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
        <FontSwitcher />
      </body>
    </html>
  );
}
