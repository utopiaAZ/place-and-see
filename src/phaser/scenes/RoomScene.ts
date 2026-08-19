import Phaser from 'phaser';
import type { GameBridge } from '../../bridge/GameBridge';
import type { GameEvent } from '../../core/events/GameEvent';
import type { WorldState } from '../../core/types/WorldTypes';
import { BottleView } from '../views/BottleView';
import { CatView } from '../views/CatView';

const DESK = new Phaser.Geom.Rectangle(485, 250, 245, 130);

export class RoomScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private bottle!: BottleView;
  private cat!: CatView;
  private unsubscribe?: () => void;
  private accumulatedMs = 0;
  private draggingBottle = false;

  public constructor() {
    super('RoomScene');
  }

  public create(): void {
    this.bridge = this.registry.get('gameBridge') as GameBridge;
    this.drawRoom();
    const state = this.bridge.getState();
    const bottleState = state.objects.bottle;
    const catState = state.actors.cat;
    this.bottle = new BottleView(this, bottleState.position.x, bottleState.position.y);
    this.cat = new CatView(this, catState.position.x, catState.position.y);
    this.configureDragging();
    this.unsubscribe = this.bridge.subscribe((event) => this.handleCoreEvent(event));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
  }

  public update(_time: number, delta: number): void {
    this.accumulatedMs += Math.min(delta, 100);
    if (this.accumulatedMs >= 100) {
      const step = this.accumulatedMs;
      this.accumulatedMs = 0;
      this.bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: step });
    }
  }

  private drawRoom(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xf9f1df, 1).fillRect(0, 0, 800, 520);
    graphics.fillStyle(0xbcd2ad, 1).fillRect(0, 430, 800, 90);
    graphics.fillStyle(0x8b5e3c, 1).fillRoundedRect(DESK.x, DESK.y, DESK.width, 25, 5);
    graphics.fillRect(DESK.x + 20, DESK.y + 20, 22, 165);
    graphics.fillRect(DESK.right - 42, DESK.y + 20, 22, 165);
    graphics.fillStyle(0x5b8e6f, 0.14).fillRoundedRect(DESK.x, DESK.y - 75, DESK.width, 100, 12);
    graphics.lineStyle(2, 0x5b8e6f, 0.55).strokeRoundedRect(DESK.x, DESK.y - 75, DESK.width, 100, 12);
    this.add.text(506, 190, '책상 배치 영역', { color: '#40634f', fontFamily: 'sans-serif', fontSize: '16px' });
    this.add.text(24, 20, 'PHASER GRAPHICS PLACEHOLDER', {
      color: '#8d7961', fontFamily: 'monospace', fontSize: '13px',
    });
  }

  private configureDragging(): void {
    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, target: BottleView) => {
      if (target !== this.bottle) return;
      this.draggingBottle = true;
      target.setScale(1.06).setDepth(10);
    });
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, target: BottleView, dragX: number, dragY: number) => {
      if (target !== this.bottle) return;
      target.setPosition(Phaser.Math.Clamp(dragX, 25, 775), Phaser.Math.Clamp(dragY, 60, 455));
    });
    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, target: BottleView) => {
      if (target !== this.bottle) return;
      this.draggingBottle = false;
      target.setScale(1).setDepth(0);
      const onDesk = DESK.contains(target.x, target.y + 48);
      const position = onDesk ? { x: target.x, y: DESK.y - 48 } : { x: target.x, y: target.y };
      this.bridge.dispatch({
        type: 'MOVE_OBJECT', objectId: 'bottle', position, location: onDesk ? 'desk' : 'floor',
      });
    });
  }

  private handleCoreEvent(event: GameEvent): void {
    if (event.type === 'STAGE_RESET') {
      this.draggingBottle = false;
      this.renderState(event.state);
    }
    if (event.type === 'STATE_CHANGED' && !this.draggingBottle) this.renderState(event.state);
    if (event.type === 'ACTOR_SPOTTED_OBJECT') this.cat.showInterest();
    if (event.type === 'GOAL_COMPLETED') {
      this.cameras.main.flash(350, 226, 255, 217);
    }
  }

  private renderState(state: WorldState): void {
    const bottle = state.objects.bottle;
    this.bottle.setPosition(bottle.position.x, bottle.position.y);
  }
}
