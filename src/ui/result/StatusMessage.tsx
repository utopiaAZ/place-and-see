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
  'fan-turning': '선풍기가 책상 쪽으로 돌아오고 있어요.',
  'fan-slowing': '선풍기가 천천히 멈추고 있어요.',
  'fan-stopped': '선풍기가 완전히 멈췄어요.',
  'paper-fluttering': '서류가 바람에 흔들리고 있어요!',
  'paper-blown': '서류가 바람에 날아갔어요.',
  'paper-weighted': '물병이 서류를 단단히 눌러주고 있어요.',
  'airflow-blocked': '파일꽂이가 바람을 막고 있어요.',
  'cake-placed': '케이크를 책상에 놓았어요.',
  'cake-damaged': '고양이가 케이크를 망가뜨렸어요.',
  'candle-lighting': '촛불을 켜고 있어요.',
  'candle-lit': '촛불이 켜졌어요.',
  'candle-flickering': '촛불이 바람에 흔들리고 있어요!',
  'candle-blown-out': '촛불이 바람에 꺼졌어요.',
  'candle-moved': '케이크를 옮기면서 촛불이 꺼졌어요.',
  completed: '물병이 안전하게 유지되고 있어요!',
};

export function StatusMessage({ status, stageId = 'stage-001' }: { readonly status: StageStatus; readonly stageId?: string }) {
  const message = stageId === 'stage-003' && status === 'completed'
    ? '촛불을 켠 케이크가 안전하게 준비됐어요!'
    : stageId === 'stage-003' && status === 'stabilizing'
      ? '케이크가 안전한지 확인하는 중...'
      : stageId === 'stage-002' && status === 'completed'
    ? '서류가 안전하게 놓였습니다!'
    : stageId === 'stage-002' && status === 'stabilizing'
      ? '서류가 안전한지 확인하는 중...'
      : STATUS_MESSAGES[status];
  return <div className={`status-message status-${status}`} aria-live="polite">{message}</div>;
}
