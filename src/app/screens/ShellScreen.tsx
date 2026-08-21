import type { ReactNode } from 'react';
import { SoundToggle } from '../../ui/shell/SoundToggle';

export function ShellScreen({ children, muted, onToggleMuted, className = '' }: {
  readonly children: ReactNode;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly className?: string;
}) {
  return (
    <main className={`shell-screen ${className}`.trim()}>
      <div className="shell-sound"><SoundToggle muted={muted} onToggle={onToggleMuted} /></div>
      {children}
    </main>
  );
}
