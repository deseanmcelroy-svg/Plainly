import LogoMark from '@/components/LogoMark';

export default function Footer() {
  return (
    <footer className="px-[6vw] py-10 text-center text-sm text-muted">
      <div className="mb-2 flex items-center justify-center gap-2.5 font-sans text-lg font-light tracking-wide">
        <LogoMark />
        Plainly
      </div>
      Built to inform, not influence. All descriptions are factual summaries.
    </footer>
  );
}
