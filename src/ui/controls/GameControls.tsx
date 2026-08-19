export function GameControls({ onReset }: { readonly onReset: () => void }) {
  return (
    <section className="panel controls">
      <button type="button" onClick={onReset}>처음부터 다시</button>
      <button type="button" disabled title="명령 기록 기반 되돌리기는 다음 단계에서 구현합니다.">되돌리기</button>
    </section>
  );
}
