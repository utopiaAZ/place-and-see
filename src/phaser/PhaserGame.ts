import Phaser from 'phaser';
import type { GameBridge } from '../bridge/GameBridge';
import { createGameConfig } from './config/gameConfig';

export class PhaserGame {
  private game: Phaser.Game | undefined;

  public mount(parent: HTMLElement, bridge: GameBridge): void {
    if (this.game) return;
    this.game = new Phaser.Game(createGameConfig(parent, bridge));
  }

  public destroy(): void {
    this.game?.destroy(true);
    this.game = undefined;
  }
}
