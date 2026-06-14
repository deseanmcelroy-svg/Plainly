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
          className="rounded-xl border-2 border-navy px-4 py-2 text-sm font-medium transition-colors hover:bg-navy hover:text-white"
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
        <div className="mb-2 flex items-center justify-center gap-2.5 font-sans text-lg font-light tracking-wide">
          <LogoMark />
          Plainly
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
        Built to inform, not influence. All descriptions are factual summaries.
      </footer>
    </main>
  );
}
