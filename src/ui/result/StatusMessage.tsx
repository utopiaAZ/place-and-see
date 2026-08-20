import type { StageStatus } from '../../core/types/identifiers';

const STATUS_MESSAGES: Record<StageStatus, string> = {
  observing: '방 안을 살펴보세요.',
  stabilizing: '물병이 안정적인지 확인하는 중...',
  'cat-noticed': '고양이가 물병을 발견했어요!',
  'cat-preparing': '고양이가 점프하려고 해요!',
  'cat-jumping': '이미 점프한 고양이는 멈출 수 없어요!',
  'bottle-fell': '고양이가 물병을 넘어뜨렸어요.',
  'cat-food': '고양이가 간식에 관심을 보이고 있어요.',
  'cat-toy': '고양이가 장난감을 가지고 놀고 있어요.',
  'mat-support': '매트가 물병을 안정적으로 잡아주고 있어요.',
  completed: '물병이 안전하게 유지되고 있어요!',
};

export function StatusMessage({ status }: { readonly status: StageStatus }) {
  return <div className={`status-message status-${status}`} aria-live="polite">{STATUS_MESSAGES[status]}</div>;
}
