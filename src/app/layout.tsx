import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegisterSW } from '@/components/RegisterSW';
import { ICON_180 } from './icon-data';

export const metadata: Metadata = {
  title: 'pail',
  description: 'things to do in chicago before san diego',
  // v=2 busts iOS/Safari's cached manifest. iOS bakes background_color in
  // at add-to-home-screen time (it paints the strip under the bottom tab
  // bar) and reuses a stale cached manifest on re-add — a new URL is the
  // only guaranteed bust. Bump the query any time manifest.json changes.
  manifest: '/manifest.json?v=4',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: ICON_180, sizes: '180x180', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'pail'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1A2D52',
  // Required for env(safe-area-inset-*) to be non-zero in the installed iOS
  // PWA. Without it iOS reports 0, the tab bar's bottom padding collapses,
  // and its buttons sit in the home-indicator strip (same fix as dashi,
  // meiro, clip, and stack).
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400&family=Geist+Mono:wght@400;500;700&family=Manrope:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href={ICON_180} />
      </head>
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
