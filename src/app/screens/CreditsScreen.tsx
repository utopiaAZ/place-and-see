import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';

const externalLinks = [
  ['Pixabay Sound Effects', 'https://pixabay.com/sound-effects/'],
  ['Pixabay Content License', 'https://pixabay.com/service/license-summary/'],
  ['React', 'https://react.dev/'],
  ['Phaser', 'https://phaser.io/'],
  ['Vite', 'https://vite.dev/'],
  ['OpenAI Codex', 'https://openai.com/codex/'],
] as const;

export function CreditsScreen({ muted, onToggleMuted, onHome, onResetProgress }: {
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onHome: () => void;
  readonly onResetProgress: () => void;
}) {
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="credits-screen">
      <section className="shell-panel credits-panel" aria-labelledby="credits-title">
        <p className="shell-eyebrow">CREDITS</p>
        <h1 id="credits-title">Place &amp; See</h1>
        <dl className="credits-list">
          <div><dt>Planning &amp; Development</dt><dd>최지웅</dd></div>
          <div><dt>AI-assisted Development</dt><dd>OpenAI Codex</dd></div>
          <div><dt>Graphics</dt><dd>Custom SVG assets created for Place &amp; See</dd></div>
          <div><dt>Sound Effects</dt><dd>Provider: Pixabay Sound Effects<br />License: Pixabay Content License<br />Attribution: Not required</dd></div>
          <div><dt>Technology</dt><dd>React · TypeScript · Phaser · Vite</dd></div>
        </dl>
        <p className="credits-note">OpenAI Codex was used to assist with game design, implementation, testing, asset validation and documentation. Final design decisions and quality review were performed by the project owner.</p>
        <nav className="credits-links" aria-label="Credits links">
          {externalLinks.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer">{label}</a>)}
        </nav>
        <div className="shell-footer-actions">
          <ShellButton onClick={onHome}>Back to Title</ShellButton>
          <ShellButton onClick={onResetProgress} tone="quiet" className="reset-progress-button">Reset Progress</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
