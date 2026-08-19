import Phaser from 'phaser';
import type { GameBridge } from '../../bridge/GameBridge';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { RoomScene } from '../scenes/RoomScene';

export function createGameConfig(parent: HTMLElement, bridge: GameBridge): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 520,
    backgroundColor: '#f9f1df',
    scene: [BootScene, PreloadScene, RoomScene],
    physics: { default: undefined },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
    callbacks: {
      preBoot: (game) => game.registry.set('gameBridge', bridge),
    },
  };
}
