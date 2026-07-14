'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {children}
    </>
  );
}
