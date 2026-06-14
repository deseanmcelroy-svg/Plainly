import type { Metadata } from 'next';
import Link from 'next/link';
import SimplePage from '@/components/SimplePage';
import FaqAccordion from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ — Plainly',
  description: 'Frequently asked questions about Plainly.',
};

const faqs = [
  {
    question: 'How does Plainly know what\u2019s on my ballot?',
    answer: (
      <>
        Plainly looks up your address using the Google Civic Information
        API, which pulls from official state and local election offices.
        When you search, it matches your address to your specific
        precinct and shows the races and measures that apply to you.
      </>
    ),
  },
  {
    question: 'Why does it say "sample data" for my address?',
    answer: (
      <>
        Election offices typically publish detailed ballot information
        (candidates, measures, polling locations) only as an election gets
        closer — often a few weeks out. If nothing has been published yet
        for your address, Plainly shows placeholder sample content so you
        can see how the app works. Check back closer to Election Day for
        real information.
      </>
    ),
  },
  {
    question: 'Is Plainly biased toward any party or candidate?',
    answer: (
      <>
        No. Plainly doesn&apos;t take positions on candidates, parties, or
        ballot measures. Every description aims to be a factual, neutral
        summary of what something does — not an opinion on whether it&apos;s
        good or bad. If you ever see something that reads as biased,
        that&apos;s a bug, not a feature.
      </>
    ),
  },
  {
    question: 'Do I need to create an account?',
    answer: (
      <>
        No. You can search for your ballot and see full results without
        signing in. Creating an account just lets you save your location
        (so you don&apos;t have to re-enter it) and opt in to email
        reminders about upcoming election dates.
      </>
    ),
  },
  {
    question: 'How do election reminder emails work?',
    answer: (
      <>
        If you sign in and turn on reminders, Plainly will email you ahead
        of key dates for your saved location &mdash; like registration
        deadlines, early voting, and Election Day. You can turn this off
        anytime from the menu.
      </>
    ),
  },
  {
    question: 'What information does Plainly store about me?',
    answer: (
      <>
        If you don&apos;t sign in, Plainly doesn&apos;t store anything about
        your searches. If you do sign in, it stores your email, an optional
        saved location, and your reminder preference. See the{' '}
        <Link href="/privacy" className="text-terracotta underline">
          privacy policy
        </Link>{' '}
        for full details.
      </>
    ),
  },
  {
    question: 'My polling location or candidates look wrong. What do I do?',
    answer: (
      <>
        Plainly displays whatever official sources report through the
        Voting Information Project, and that data can occasionally be
        outdated or incomplete. For the most current information,
        always check your local election office&apos;s website &mdash; Plainly
        includes a link to it for your area when available.
      </>
    ),
  },
  {
    question: 'Is Plainly free?',
    answer: <>Yes, completely free, with no ads.</>,
  },
];

export default function FaqPage() {
  return (
    <SimplePage
      title="Frequently asked questions"
      subtitle="Quick answers to common questions about how Plainly works."
    >
      <FaqAccordion items={faqs} />
    </SimplePage>
  );
}
