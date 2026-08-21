import { ShellButton } from './ShellButton';

export function SoundToggle({ muted, onToggle }: { readonly muted: boolean; readonly onToggle: () => void }) {
  return (
    <ShellButton
      className="sound-toggle"
      tone="secondary"
      onClick={onToggle}
      aria-label={muted ? '사운드 켜기' : '사운드 끄기'}
      aria-pressed={!muted}
    >
      {muted ? '🔇 Sound Off' : '🔊 Sound On'}
    </ShellButton>
  );
}
