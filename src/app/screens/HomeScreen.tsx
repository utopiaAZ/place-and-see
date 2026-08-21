import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';
import { publicAssetUrl } from '../../assets/publicAssetUrl';

export function HomeScreen({ muted, onToggleMuted, onPlay, onStageSelect, onCredits }: {
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onPlay: () => void;
  readonly onStageSelect: () => void;
  readonly onCredits: () => void;
}) {
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="home-screen">
      <section className="shell-panel hero-panel" aria-labelledby="home-title">
        <p className="shell-eyebrow">OBSERVE · PLACE · SOLVE</p>
        <h1 id="home-title">Place &amp; See</h1>
        <p className="hero-copy">놓아보고, 지켜보고, 문제를 해결하세요.</p>
        <div className="shell-actions shell-actions-vertical">
          <ShellButton onClick={onPlay}>Play</ShellButton>
          <ShellButton onClick={onStageSelect} tone="secondary">Stage Select</ShellButton>
          <ShellButton onClick={onCredits} tone="quiet">Credits</ShellButton>
        </div>
        <p className="control-hint">Drag objects and observe what happens.</p>
      </section>
      <div className="shell-decoration" aria-hidden="true">
        <img src={publicAssetUrl('assets/props/bottle.svg')} alt="" />
        <img src={publicAssetUrl('assets/props/stage-003/cake.svg')} alt="" />
      </div>
    </ShellScreen>
  );
}
