import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { HouseholdProfileProvider } from '@/lib/householdProfile';
import OnboardingModal from '@/components/OnboardingModal';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Plainly — Politics Explained Plainly',
  description:
    'See what is on your ballot, get plain-language explanations of every race and measure, and get ready to vote.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Plainly',
  },
};

export const viewport = {
  viewportFit: "cover",
  themeColor: '#D9663E',
};

// Runs before React hydrates, so the correct theme class is applied
// immediately and there's no flash of the wrong theme on page load.
const themeInitScript = `
  try {
    var saved = localStorage.getItem('plainly-theme');
    var isDark = saved === 'dark';
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
`;

// Registers the service worker for PWA installability and offline support.
// Runs after the page loads so it doesn't compete with initial rendering.

const splashScript = `
  (function() {
    var splash = document.createElement('div');
    splash.id = 'plainly-splash';
    splash.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#F7F4ED;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.25rem;opacity:0;transition:opacity 0.5s ease;pointer-events:none;';
    splash.innerHTML = '<img src="/icons/icon-512.png" style="width:80px;height:80px;border-radius:18px;"/><div style="font-family:Georgia,serif;font-size:1.8rem;font-weight:700;color:#1A2B3D;">Plainly</div><div style="font-family:sans-serif;font-size:0.85rem;color:#5B8C7B;letter-spacing:0.08em;text-transform:uppercase;">Politics explained, plainly.</div>';
    document.documentElement.appendChild(splash);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        splash.style.opacity = '1';
        setTimeout(function() {
          splash.style.opacity = '0';
          setTimeout(function() { splash.remove(); }, 500);
        }, 1400);
      });
    });
  })();
`;

const swRegisterScript = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Service worker registration failing shouldn't break the app —
        // it just means no offline/install support.
      });
    });
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} font-body`}>
        <ThemeProvider>
          <AuthProvider>
            <HouseholdProfileProvider>
              <OnboardingModal />
              {children}
              <Analytics />
            </HouseholdProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
