export function SuccessPanel({ onReplay }: { readonly onReplay: () => void }) {
  return (
    <section className="success-panel" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <span className="success-mark" aria-hidden="true">✓</span>
      <h2 id="success-title">미션 완료!</h2>
      <p>물병이 안전하게 유지되고 있어요.</p>
      <button type="button" onClick={onReplay}>다시 플레이</button>
    </section>
  );
}
