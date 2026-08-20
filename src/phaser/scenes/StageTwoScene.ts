import Phaser from 'phaser';
import type { GameBridge } from '../../bridge/GameBridge';
import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { GameEvent } from '../../core/events/GameEvent';
import type { WorldState } from '../../core/types/WorldTypes';
import type { ObjectId, ObjectKind, ZoneId } from '../../core/types/identifiers';
import { ROOM_DEPTH } from '../layout/roomLayout';
import { getPlugCableAnchor, getPowerCordCurve, getStageTwoObjectDepth, sampleQuadraticCurve, STAGE_TWO_DEPTH } from '../layout/stageTwoLayout';
import { resolveStageTwoDropZone } from '../input/stageTwoDropResolver';
import { BottleView } from '../views/BottleView';
import { DraggablePropView } from '../views/DraggablePropView';
import { FanView } from '../views/FanView';
import { InteractiveObjectView } from '../views/InteractiveObjectView';
import { PaperView } from '../views/PaperView';

export class StageTwoScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private stage!: StageDefinition;
  private fan!: FanView;
  private paper!: PaperView;
  private wire!: Phaser.GameObjects.Graphics;
  private readonly objectViews = new Map<ObjectId, InteractiveObjectView>();
  private readonly zoneOverlays = new Map<ZoneId, Phaser.GameObjects.Graphics>();
  private readonly dragging = new Set<ObjectId>();
  private readonly dragOrigins = new Map<ObjectId, { x: number; y: number }>();
  private unsubscribe?: () => void;
  private accumulatedMs = 0;

  public constructor() { super('StageTwoScene'); }

  public create(): void {
    this.bridge = this.registry.get('gameBridge') as GameBridge;
    this.stage = this.bridge.getStage();
    if (!this.stage.scene.stageTwo) throw new Error('Stage 2 scene configuration is missing.');
    this.drawRoom();
    this.createFurniture();
    this.createFanAndOutlet();
    this.createObjectViews(this.bridge.getState());
    this.configureDragging();
    this.renderState(this.bridge.getState());
    this.unsubscribe = this.bridge.subscribe((event) => this.handleCoreEvent(event));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.bridge.stopAudioLoops();
      this.fan.dispose();
      this.input.removeAllListeners();
      this.tweens.killAll();
    });
  }

  public update(_time: number, delta: number): void {
    this.fan.updateVisual(delta);
    this.renderPowerCord();
    this.accumulatedMs += Math.min(delta, 100);
    if (this.accumulatedMs >= 50) {
      const step = this.accumulatedMs; this.accumulatedMs = 0;
      this.bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: step });
    }
  }

  private drawRoom(): void {
    const graphics = this.add.graphics().setDepth(ROOM_DEPTH.background);
    graphics.fillStyle(0xf7f1e3).fillRect(0, 0, 1600, this.stage.scene.floorTopY);
    graphics.fillStyle(0xe8b45a, 0.28).fillRect(0, this.stage.scene.floorTopY, 1600, 900 - this.stage.scene.floorTopY);
    graphics.lineStyle(6, 0x17213a).lineBetween(0, this.stage.scene.floorTopY, 1600, this.stage.scene.floorTopY);
    for (const zone of this.stage.zones) {
      const overlay = this.add.graphics().setDepth(ROOM_DEPTH.zoneOverlay).setAlpha(0);
      overlay.fillStyle(zone.id.includes('plug') ? 0xff6b6b : 0x59d8d0, 0.24).fillRoundedRect(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height, 24);
      overlay.lineStyle(4, 0x17213a, 0.38).strokeRoundedRect(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height, 24);
      this.zoneOverlays.set(zone.id, overlay);
    }
  }

  private createFurniture(): void {
    for (const item of this.stage.scene.furniture) {
      this.add.ellipse(item.position.x, item.position.y + item.displaySize.height * 0.43, item.displaySize.width * 0.72, 25, 0x17213a, 0.11).setDepth(9);
      this.add.image(item.position.x, item.position.y, item.key).setDisplaySize(item.displaySize.width, item.displaySize.height).setDepth(item.depth + 7);
    }
  }

  private createFanAndOutlet(): void {
    const config = this.stage.scene.stageTwo!;
    this.add.image(config.outletPosition.x, config.outletPosition.y, 'stage002.power-outlet')
      .setDisplaySize(config.outletDisplaySize.width, config.outletDisplaySize.height).setDepth(STAGE_TWO_DEPTH.outlet);
    this.wire = this.add.graphics().setDepth(STAGE_TWO_DEPTH.powerCord);
    this.fan = new FanView(
      this,
      config.fanPosition.x,
      config.fanPosition.y,
      config.fanDisplaySize,
      this.stage.stageTwo!.fanSlowdownMs,
    ).setDepth(STAGE_TWO_DEPTH.fan);
  }

  private createObjectViews(state: WorldState): void {
    for (const object of Object.values(state.objects)) {
      const view = object.kind === 'document' ? new PaperView(this, object.position.x, object.position.y)
        : object.kind === 'bottle' ? new BottleView(this, object.position.x, object.position.y)
          : new DraggablePropView(this, object.id, object.graphicKey, object.position.x, object.position.y);
      view.setDepth(getStageTwoObjectDepth(object, this.stage.scene.objectVisuals?.[object.id]?.depth)).setLocked(object.inputLocked);
      this.objectViews.set(object.id, view);
      if (object.kind === 'document') this.paper = view as PaperView;
    }
  }

  private configureDragging(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView) => {
      if (!(target instanceof InteractiveObjectView) || target.isLocked()) return;
      if (!this.bridge.dispatch({ type: 'PICK_UP_OBJECT', objectId: target.objectId }).accepted) return;
      target.resetVisualState(); this.dragging.add(target.objectId); this.dragOrigins.set(target.objectId, { x: target.x, y: target.y });
      target.setDepth(ROOM_DEPTH.dragOverlay);
      this.tweens.add({ targets: target, y: target.y - 12, scale: 1.07, duration: 90 });
      this.showValidZones(this.bridge.getState().objects[target.objectId].kind);
    });
    this.input.on(Phaser.Input.Events.DRAG, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView, x: number, y: number) => {
      if (!(target instanceof InteractiveObjectView) || !this.dragging.has(target.objectId)) return;
      target.setPosition(Phaser.Math.Clamp(x, 30, 1570), Phaser.Math.Clamp(y, 70, 850));
      const object = this.bridge.getState().objects[target.objectId];
      this.highlightZone(resolveStageTwoDropZone(this.stage, target.objectId, object.kind, { x: target.x, y: target.y })?.id);
    });
    this.input.on(Phaser.Input.Events.DRAG_END, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView) => {
      if (!(target instanceof InteractiveObjectView) || !this.dragging.delete(target.objectId)) return;
      this.hideZones(); target.setScale(1);
      const object = this.bridge.getState().objects[target.objectId];
      const zone = resolveStageTwoDropZone(this.stage, target.objectId, object.kind, { x: target.x, y: target.y });
      const normalizedPosition = target.objectId === this.stage.stageTwo?.plugObjectId
        ? zone?.snapPositions?.[object.kind] ?? { x: target.x, y: target.y }
        : { x: target.x, y: target.y };
      const result = zone ? this.bridge.dispatch({ type: 'DROP_OBJECT', objectId: target.objectId, zoneId: zone.id, worldPosition: normalizedPosition }) : this.bridge.dispatch({ type: 'REPORT_INVALID_DROP', objectId: target.objectId });
      if (!zone || !result.accepted) {
        this.bridge.dispatch({ type: 'CANCEL_DRAG', objectId: target.objectId });
        const origin = this.dragOrigins.get(target.objectId) ?? object.position;
        this.tweens.add({ targets: target, x: origin.x, y: origin.y, duration: 220, ease: 'Back.easeOut' });
      }
      this.dragOrigins.delete(target.objectId);
    });
  }

  private handleCoreEvent(event: GameEvent): void {
    switch (event.type) {
      case 'STATE_CHANGED': this.renderState(event.state); break;
      case 'STAGE_RESET': this.resetViews(event.state); break;
      case 'OBJECT_DROPPED': {
        const view = this.objectViews.get(event.objectId);
        if (event.objectId === 'bottle') (view as BottleView | undefined)?.animatePlaced(event.position);
        else { view?.setPosition(event.position.x, event.position.y); view?.animateDrop(); }
        break;
      }
      case 'PAPER_FLUTTER_STARTED': this.paper.startFlutter(); break;
      case 'PAPER_FLUTTER_STOPPED': this.paper.stopFlutter(); break;
      case 'PAPER_BLOWN_AWAY': this.paper.blowAway(event.position, this.stage.stageTwo!.paperBlowAwayMs); break;
      case 'STAGE_COMPLETED': this.cameras.main.flash(420, 255, 244, 214); break;
      default: break;
    }
  }

  private renderState(state: WorldState): void {
    if (state.stageTwo) this.fan.applyState(state.stageTwo);
    for (const object of Object.values(state.objects)) {
      const view = this.objectViews.get(object.id); if (!view) continue;
      view.setLocked(object.inputLocked);
      view.setDepth(getStageTwoObjectDepth(object, this.stage.scene.objectVisuals?.[object.id]?.depth));
      if (!this.dragging.has(object.id) && !this.tweens.isTweening(view)) view.setPosition(object.position.x, object.position.y);
    }
    this.renderPowerCord();
  }

  private resetViews(state: WorldState): void {
    this.tweens.killAll(); this.dragging.clear(); this.dragOrigins.clear(); this.hideZones();
    for (const object of Object.values(state.objects)) {
      this.objectViews.get(object.id)?.resetVisualState();
      this.objectViews.get(object.id)?.setPosition(object.position.x, object.position.y).setDepth(getStageTwoObjectDepth(object, this.stage.scene.objectVisuals?.[object.id]?.depth)).setLocked(object.inputLocked);
    }
    if (state.stageTwo) this.fan.resetTo(state.stageTwo);
    this.renderState(state);
  }

  private renderPowerCord(): void {
    const plug = this.objectViews.get('power-plug');
    const config = this.stage.scene.stageTwo;
    const plugSize = this.stage.scene.objectVisuals?.['power-plug']?.displaySize;
    if (!plug || !config || !plugSize) return;
    const end = getPlugCableAnchor({ x: plug.x, y: plug.y }, plugSize);
    const points = sampleQuadraticCurve(getPowerCordCurve(config.fanBaseCableAnchor, end));
    this.wire.clear().lineStyle(7, 0x17213a, 1).beginPath().moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) this.wire.lineTo(point.x, point.y);
    this.wire.strokePath();
  }

  private showValidZones(kind: ObjectKind): void { for (const zone of this.stage.zones) this.zoneOverlays.get(zone.id)?.setAlpha(zone.accepts.includes(kind) ? 0.25 : 0); }
  private highlightZone(id?: ZoneId): void { for (const [zoneId, overlay] of this.zoneOverlays) overlay.setAlpha(zoneId === id ? 0.48 : overlay.alpha > 0 ? 0.14 : 0); }
  private hideZones(): void { for (const overlay of this.zoneOverlays.values()) overlay.setAlpha(0); }
}
