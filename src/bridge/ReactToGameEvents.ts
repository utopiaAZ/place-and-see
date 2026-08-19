import type { GameCommand } from '../core/commands/GameCommand';

export type ReactToGameEvent = GameCommand | { readonly type: 'RESET_STAGE' };
