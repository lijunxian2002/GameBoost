import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from './site-footer';

export function LegalPage({
  eyebrow,
  title,
  lead,
  updated = '2026 年 9 月 2 日',
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-site">
      <header className="legal-header">
        <Link href="/" className="legal-logo">XT <span>小同实验室</span></Link>
        <Link href="/gameboost" className="legal-back">GAMEBOOST ↗</Link>
      </header>
      <article className="legal-shell">
        <p className="legal-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-lead">{lead}</p>
        <p className="legal-updated">最近更新：{updated}</p>
        <div className="legal-content">{children}</div>
      </article>
      <SiteFooter />
    </main>
  );
}
