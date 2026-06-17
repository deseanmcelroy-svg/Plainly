import Link from 'next/link';
import LogoMark from '@/components/LogoMark';

interface SimplePageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Shared shell for static content pages (About, Privacy, FAQ).
 * Mirrors the header/footer styling of the main app without the
 * interactive ballot-search header.
 */
export default function SimplePage({ title, subtitle, children }: SimplePageProps) {
  return (
    <main>
      <header className="flex items-center justify-between px-[6vw] py-6">
        <Link href="/" className="flex items-center gap-2.5 font-sans text-xl font-light tracking-wide">
          <LogoMark />
          Plainly
        </Link>
        <Link
          href="/"
          className="rounded-xl border-2 border-navy px-4 py-2 text-sm font-medium transition-colors hover:bg-navy hover:text-cream"
        >
          Back to app
        </Link>
      </header>

      <div className="mx-auto max-w-[680px] px-[6vw] pb-20 pt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold leading-tight text-navy">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-lg text-muted">{subtitle}</p>}
        <div className="mt-10 space-y-6 text-[1.05rem] leading-relaxed text-navy/90">
          {children}
        </div>
      </div>

      <footer className="px-[6vw] py-10 text-center text-sm text-muted">
        <div className="mb-2 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2.5 font-sans text-lg font-light tracking-wide hover:text-navy">
            <LogoMark />
            Plainly
          </Link>
        </div>
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="hover:text-navy hover:underline">
            About
          </Link>
          <Link href="/faq" className="hover:text-navy hover:underline">
            FAQ
          </Link>
          <Link href="/privacy" className="hover:text-navy hover:underline">
            Privacy
          </Link>
        </div>
        <div className="mb-4 flex items-center justify-center">
          <a
            href="https://www.facebook.com/profile.php?id=61590464626733"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Plainly on Facebook"
            className="flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-[#1877F2] hover:text-[#1877F2]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Follow us on Facebook
          </a>
        </div>
        Built to inform, not influence. All descriptions are factual summaries.
      </footer>
    </main>
  );
}
