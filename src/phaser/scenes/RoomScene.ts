import Phaser from 'phaser';
import type { GameBridge } from '../../bridge/GameBridge';
import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { GameEvent } from '../../core/events/GameEvent';
import type { WorldState } from '../../core/types/WorldTypes';
import type { ObjectId, ObjectKind, ZoneId } from '../../core/types/identifiers';
import { getObjectRenderPose, ROOM_DEPTH } from '../layout/roomLayout';
import { BottleView } from '../views/BottleView';
import { CatView } from '../views/CatView';
import { DraggablePropView } from '../views/DraggablePropView';
import { InteractiveObjectView } from '../views/InteractiveObjectView';

export class RoomScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private stage!: StageDefinition;
  private bottle!: BottleView;
  private cat!: CatView;
  private spill!: Phaser.GameObjects.Image;
  private readonly objectViews = new Map<ObjectId, InteractiveObjectView>();
  private readonly zoneOverlays = new Map<ZoneId, Phaser.GameObjects.Graphics>();
  private readonly dragging = new Set<ObjectId>();
  private readonly dragOrigins = new Map<ObjectId, { x: number; y: number }>();
  private unsubscribe?: () => void;
  private accumulatedMs = 0;
  private pendingBottleDrop = false;
  private spillPendingImpact = false;

  public constructor() { super('RoomScene'); }

  public create(): void {
    this.bridge = this.registry.get('gameBridge') as GameBridge;
    this.stage = this.bridge.getStage();
    this.drawRoom();
    this.createFurniture();
    this.createObjectViews(this.bridge.getState());
    this.cat = new CatView(this, this.bridge.getState().actors.cat);
    this.spill = this.add.image(0, 0, 'prop.water-puddle').setDisplaySize(150, 75).setDepth(ROOM_DEPTH.spill).setVisible(false);
    this.configureDragging();
    this.unsubscribe = this.bridge.subscribe((event) => this.handleCoreEvent(event));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.bridge.stopAudioLoops();
      this.input.removeAllListeners();
    });
  }

  public update(_time: number, delta: number): void {
    this.accumulatedMs += Math.min(delta, 100);
    if (this.accumulatedMs >= 50) {
      const step = this.accumulatedMs;
      this.accumulatedMs = 0;
      this.bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: step });
    }
  }

  private drawRoom(): void {
    const graphics = this.add.graphics().setDepth(ROOM_DEPTH.background);
    graphics.fillStyle(0xf7f1e3, 1).fillRect(0, 0, 1600, this.stage.scene.floorTopY);
    graphics.fillStyle(0xe8b45a, 0.28).fillRect(0, this.stage.scene.floorTopY, 1600, 900 - this.stage.scene.floorTopY);
    graphics.lineStyle(6, 0x17213a, 1).lineBetween(0, this.stage.scene.floorTopY, 1600, this.stage.scene.floorTopY);
    for (const zone of this.stage.zones) {
      const overlay = this.add.graphics().setDepth(ROOM_DEPTH.zoneOverlay).setAlpha(0);
      overlay.fillStyle(zone.id === 'desk-surface' ? 0x59d8d0 : 0xffca5c, 0.24);
      overlay.fillRoundedRect(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height, 28);
      overlay.lineStyle(4, 0x17213a, 0.38).strokeRoundedRect(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height, 28);
      this.zoneOverlays.set(zone.id, overlay);
    }
  }

  private createFurniture(): void {
    for (const furniture of this.stage.scene.furniture) {
      this.add.ellipse(
        furniture.position.x,
        furniture.position.y + furniture.displaySize.height * 0.43,
        furniture.displaySize.width * 0.72,
        25,
        0x17213a,
        0.11,
      ).setDepth(ROOM_DEPTH.furnitureShadow);
      this.add.image(furniture.position.x, furniture.position.y, furniture.key)
        .setDisplaySize(furniture.displaySize.width, furniture.displaySize.height)
        .setDepth(ROOM_DEPTH.furniture);
    }
  }

  private createObjectViews(state: WorldState): void {
    for (const object of Object.values(state.objects)) {
      const pose = getObjectRenderPose(object, this.stage.scene);
      const view = object.kind === 'bottle'
        ? new BottleView(this, pose.position.x, pose.position.y)
        : new DraggablePropView(this, object.id, object.graphicKey, pose.position.x, pose.position.y);
      view.setDepth(pose.depth);
      view.setLocked(object.inputLocked);
      this.objectViews.set(object.id, view);
      if (object.kind === 'bottle') this.bottle = view as BottleView;
    }
  }

  private configureDragging(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView) => {
      if (!(target instanceof InteractiveObjectView) || target.isLocked()) return;
      const result = this.bridge.dispatch({ type: 'PICK_UP_OBJECT', objectId: target.objectId });
      if (!result.accepted) return;
      target.resetVisualState();
      this.dragging.add(target.objectId);
      this.dragOrigins.set(target.objectId, { x: target.x, y: target.y });
      target.setDepth(ROOM_DEPTH.dragOverlay);
      this.tweens.add({ targets: target, y: target.y - 14, scaleX: 1.08, scaleY: 1.08, duration: 90 });
      this.showValidZones(this.bridge.getState().objects[target.objectId].kind);
    });

    this.input.on(Phaser.Input.Events.DRAG, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView, dragX: number, dragY: number) => {
      if (!(target instanceof InteractiveObjectView) || !this.dragging.has(target.objectId)) return;
      target.setPosition(Phaser.Math.Clamp(dragX, 30, 1570), Phaser.Math.Clamp(dragY, 80, 850));
      this.highlightZone(this.findDropZone(target.x, target.y, this.bridge.getState().objects[target.objectId].kind)?.id);
    });

    this.input.on(Phaser.Input.Events.DRAG_END, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView) => {
      if (!(target instanceof InteractiveObjectView) || !this.dragging.has(target.objectId)) return;
      this.dragging.delete(target.objectId);
      this.hideZones();
      target.setScale(1);
      const object = this.bridge.getState().objects[target.objectId];
      const zone = this.findDropZone(target.x, target.y, object.kind);
      if (!zone) {
        this.bridge.dispatch({ type: 'REPORT_INVALID_DROP', objectId: target.objectId });
        this.bridge.dispatch({ type: 'CANCEL_DRAG', objectId: target.objectId });
        const origin = this.dragOrigins.get(target.objectId) ?? object.position;
        this.tweens.add({ targets: target, x: origin.x, y: origin.y, duration: 220, ease: 'Back.easeOut' });
      } else {
        const result = this.bridge.dispatch({
          type: 'DROP_OBJECT', objectId: target.objectId, zoneId: zone.id, worldPosition: { x: target.x, y: target.y },
        });
        if (!result.accepted) {
          this.bridge.dispatch({ type: 'CANCEL_DRAG', objectId: target.objectId });
          const origin = this.dragOrigins.get(target.objectId) ?? object.position;
          this.tweens.add({ targets: target, x: origin.x, y: origin.y, duration: 220, ease: 'Back.easeOut' });
        }
      }
      this.dragOrigins.delete(target.objectId);
    });
  }

  private handleCoreEvent(event: GameEvent): void {
    switch (event.type) {
      case 'STATE_CHANGED':
        if (this.pendingBottleDrop) {
          const pose = getObjectRenderPose(event.state.objects.bottle, this.stage.scene);
          this.bottle.setDepth(pose.depth);
          this.bottle.animatePlaced(pose.position);
          this.pendingBottleDrop = false;
        }
        this.renderState(event.state);
        break;
      case 'STAGE_RESET':
        this.resetViews(event.state);
        break;
      case 'OBJECT_DROPPED': {
        const view = this.objectViews.get(event.objectId);
        if (event.objectId === 'bottle') {
          this.pendingBottleDrop = true;
        } else {
          view?.setPosition(event.position.x, event.position.y);
          view?.animateDrop();
        }
        break;
      }
      case 'BOTTLE_WOBBLED':
        this.bottle.animateWobble(event.stabilizedByMat);
        break;
      case 'BOTTLE_FELL':
        this.spillPendingImpact = true;
        this.bottle.animateFall(() => {
          this.spillPendingImpact = false;
          this.showSpill(event.position);
        });
        break;
      case 'STAGE_COMPLETED':
        this.cameras.main.flash(420, 255, 244, 214);
        break;
      default:
        break;
    }
  }

  private renderState(state: WorldState): void {
    for (const object of Object.values(state.objects)) {
      const view = this.objectViews.get(object.id);
      if (!view) continue;
      const pose = getObjectRenderPose(object, this.stage.scene);
      view.setLocked(object.inputLocked);
      view.setDepth(pose.depth);
      if (!this.dragging.has(object.id) && !this.tweens.isTweening(view)) {
        view.setPosition(pose.position.x, pose.position.y);
      }
    }
    this.cat.applyState(state.actors.cat);
    if (state.spillVisible && state.spillPosition && !this.spill.visible && !this.spillPendingImpact) {
      this.spill.setPosition(state.spillPosition.x + 25, state.spillPosition.y + 58).setVisible(true).setAlpha(0.78);
    }
  }

  private resetViews(state: WorldState): void {
    this.tweens.killAll();
    this.dragging.clear();
    this.dragOrigins.clear();
    this.pendingBottleDrop = false;
    this.spillPendingImpact = false;
    this.hideZones();
    for (const object of Object.values(state.objects)) {
      const view = this.objectViews.get(object.id);
      const pose = getObjectRenderPose(object, this.stage.scene);
      view?.resetVisualState();
      view?.setPosition(pose.position.x, pose.position.y).setDepth(pose.depth);
      view?.setLocked(object.inputLocked);
    }
    this.spill.setVisible(false).setAlpha(0);
    this.cat.resetTo(state.actors.cat);
  }

  private showSpill(position: { readonly x: number; readonly y: number }): void {
    this.spill.setPosition(position.x + 25, position.y + 58).setVisible(true).setAlpha(0);
    this.tweens.add({
      targets: this.spill,
      alpha: 0.78,
      scaleX: { from: 0.4, to: 1 },
      scaleY: { from: 0.4, to: 1 },
      duration: 260,
    });
  }

  private findDropZone(x: number, y: number, kind: ObjectKind) {
    return this.stage.zones.find((zone) =>
      zone.accepts.includes(kind) && x >= zone.bounds.x && x <= zone.bounds.x + zone.bounds.width &&
      y >= zone.bounds.y && y <= zone.bounds.y + zone.bounds.height,
    );
  }

  private showValidZones(kind: ObjectKind): void {
    for (const zone of this.stage.zones) this.zoneOverlays.get(zone.id)?.setAlpha(zone.accepts.includes(kind) ? 0.28 : 0);
  }

  private highlightZone(zoneId: ZoneId | undefined): void {
    for (const [id, overlay] of this.zoneOverlays) overlay.setAlpha(id === zoneId ? 0.48 : overlay.alpha > 0 ? 0.18 : 0);
  }

  private hideZones(): void {
    for (const overlay of this.zoneOverlays.values()) overlay.setAlpha(0);
  }
}
