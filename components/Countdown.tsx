'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
  targetDate: string;
}

function getTimeParts(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function Countdown({ targetDate }: CountdownProps) {
  const target = new Date(targetDate);
  const [time, setTime] = useState(() => getTimeParts(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeParts(target));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  return (
    <div className="reveal-enter flex justify-center px-[6vw] pb-12">
      <div className="w-full max-w-[680px] rounded-[20px] bg-[#1A2B3D] p-9 text-center text-white">
        <div className="mb-1.5 font-mono text-xs uppercase tracking-widest text-green">
          Next election in
        </div>
        <h2 className="mb-5 font-display text-2xl font-bold">
          Mark your calendar — every day counts
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Unit num={time.days} label="Days" />
          <Unit num={time.hours} label="Hours" pad />
          <Unit num={time.minutes} label="Minutes" pad />
          <Unit num={time.seconds} label="Seconds" pad />
        </div>
      </div>
    </div>
  );
}

function Unit({ num, label, pad }: { num: number; label: string; pad?: boolean }) {
  const display = pad ? String(num).padStart(2, '0') : String(num);
  return (
    <div className="min-w-[84px] rounded-[14px] bg-white/[0.08] px-5 py-[18px]">
      <div className="font-display text-[2.2rem] font-bold leading-none text-terracotta">
        {display}
      </div>
      <div className="mt-1.5 text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}
