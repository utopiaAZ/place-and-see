import Phaser from 'phaser';
import type { GameBridge } from '../../bridge/GameBridge';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { RoomScene } from '../scenes/RoomScene';
import { StageTwoScene } from '../scenes/StageTwoScene';

export function createGameConfig(parent: HTMLElement, bridge: GameBridge): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1600,
    height: 900,
    backgroundColor: '#f7f1e3',
    scene: [BootScene, PreloadScene, RoomScene, StageTwoScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
    callbacks: {
      preBoot: (game) => game.registry.set('gameBridge', bridge),
    },
  };
}
