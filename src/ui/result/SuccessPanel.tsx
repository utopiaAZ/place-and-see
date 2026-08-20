interface SuccessPanelProps {
  readonly onReplay: () => void;
  readonly title?: string;
  readonly message?: string;
  readonly replayLabel?: string;
  readonly secondaryAction?: { readonly label: string; readonly onClick: () => void };
}

export function SuccessPanel({ onReplay, title = '미션 완료!', message = '물병이 안전하게 유지되고 있어요.', replayLabel = '다시 플레이', secondaryAction }: SuccessPanelProps) {
  return (
    <section className="success-panel" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <span className="success-mark" aria-hidden="true">✓</span>
      <h2 id="success-title">{title}</h2>
      <p>{message}</p>
      <div className="success-actions">
        <button type="button" onClick={onReplay}>{replayLabel}</button>
        {secondaryAction && <button type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
      </div>
    </section>
  );
}
