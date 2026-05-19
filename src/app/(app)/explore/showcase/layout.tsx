import type { ReactNode } from 'react';
import './showcase.css';

export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return <div className="showcase-wing">{children}</div>;
}
