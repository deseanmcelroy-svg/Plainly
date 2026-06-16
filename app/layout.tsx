import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { HouseholdProfileProvider } from '@/lib/householdProfile';
import SplashScreen from '@/components/SplashScreen';
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
  themeColor: '#D9663E',
};

// Runs before React hydrates, so the correct theme class is applied
// immediately and there's no flash of the wrong theme on page load.
const themeInitScript = `
  try {
    var saved = localStorage.getItem('plainly-theme');
    var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
`;

// Registers the service worker for PWA installability and offline support.
// Runs after the page loads so it doesn't compete with initial rendering.
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
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} font-body`}>
        <ThemeProvider>
          <AuthProvider>
            <HouseholdProfileProvider>
              <SplashScreen />
              {children}
            </HouseholdProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
