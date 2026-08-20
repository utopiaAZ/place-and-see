import Phaser from 'phaser';
import type { GameBridge } from '../../bridge/GameBridge';
import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { GameEvent } from '../../core/events/GameEvent';
import type { WorldState } from '../../core/types/WorldTypes';
import type { ObjectId, ObjectKind, ZoneId } from '../../core/types/identifiers';
import { boundsFromCenter, resolveStageThreeDrop, type StageThreeDropResult } from '../input/stageThreeDropResolver';
import { ROOM_DEPTH } from '../layout/roomLayout';
import { getPlugCableAnchor, getPowerCordCurve, sampleQuadraticCurve, STAGE_TWO_DEPTH } from '../layout/stageTwoLayout';
import { CakeView } from '../views/CakeView';
import { CatView } from '../views/CatView';
import { DraggablePropView } from '../views/DraggablePropView';
import { FanView } from '../views/FanView';
import { InteractiveObjectView } from '../views/InteractiveObjectView';

export class StageThreeScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private stage!: StageDefinition;
  private fan!: FanView;
  private cat!: CatView;
  private cake!: CakeView;
  private wire!: Phaser.GameObjects.Graphics;
  private readonly objectViews = new Map<ObjectId, InteractiveObjectView>();
  private readonly zoneOverlays = new Map<ZoneId, Phaser.GameObjects.Graphics>();
  private readonly dragging = new Set<ObjectId>();
  private readonly dragOrigins = new Map<ObjectId, { x: number; y: number }>();
  private unsubscribe?: () => void;
  private accumulatedMs = 0;
  private lastDropResult: StageThreeDropResult = { type: 'reject' };
  private lastCommand = 'none';
  private lastCandleEvent = 'none';
  private lastDraggedObject = 'none';
  private lastObjectBounds?: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  private readonly debugZones = import.meta.env.DEV && new URLSearchParams(window.location.search).get('debugZones') === '1';
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugText?: Phaser.GameObjects.Text;

  public constructor() { super('StageThreeScene'); }

  public create(): void {
    this.bridge = this.registry.get('gameBridge') as GameBridge;
    this.stage = this.bridge.getStage();
    if (!this.stage.scene.stageThree || !this.stage.stageThree) throw new Error('Stage 3 scene configuration is missing.');
    this.drawRoom(); this.createFurniture(); this.createFanAndOutlet(); this.createObjects(this.bridge.getState());
    this.cat = new CatView(this, this.bridge.getState().actors.cat);
    if (this.debugZones) {
      this.debugGraphics = this.add.graphics().setDepth(ROOM_DEPTH.dragOverlay + 1);
      this.debugText = this.add.text(405, 110, '', { color: '#17213a', backgroundColor: '#fff8e8dd', fontFamily: 'monospace', fontSize: '17px', padding: { x: 10, y: 8 } }).setDepth(ROOM_DEPTH.dragOverlay + 2);
    }
    this.configureDragging(); this.renderState(this.bridge.getState());
    this.unsubscribe = this.bridge.subscribe((event) => this.handleCoreEvent(event));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.(); this.bridge.stopAudioLoops(); this.fan.dispose(); this.cake.dispose(); this.input.removeAllListeners(); this.tweens.killAll();
      if (this.debugZones) {
        delete (window as typeof window & { __PLACE_AND_SEE_STAGE3_DEBUG__?: unknown }).__PLACE_AND_SEE_STAGE3_DEBUG__;
        delete this.game.canvas.dataset.stage3Debug;
      }
    });
  }

  public update(_time: number, delta: number): void {
    this.fan.updateVisual(delta); this.renderPowerCord(); this.accumulatedMs += Math.min(delta, 100);
    if (this.accumulatedMs >= 50) { const step = this.accumulatedMs; this.accumulatedMs = 0; this.bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: step }); }
  }

  private drawRoom(): void {
    const graphics = this.add.graphics().setDepth(ROOM_DEPTH.background);
    graphics.fillStyle(0xf7f1e3).fillRect(0, 0, 1600, this.stage.scene.floorTopY);
    graphics.fillStyle(0xe8b45a, 0.28).fillRect(0, this.stage.scene.floorTopY, 1600, 900 - this.stage.scene.floorTopY);
    graphics.lineStyle(6, 0x17213a).lineBetween(0, this.stage.scene.floorTopY, 1600, this.stage.scene.floorTopY);
    for (const zone of this.stage.zones) {
      const overlay = this.add.graphics().setDepth(ROOM_DEPTH.zoneOverlay).setAlpha(0);
      overlay.fillStyle(zone.id.includes('plug') ? 0xff6b6b : zone.id.includes('candle') ? 0xffca5c : 0x59d8d0, 0.24).fillRoundedRect(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height, 22);
      overlay.lineStyle(4, 0x17213a, 0.38).strokeRoundedRect(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height, 22);
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
    const config = this.stage.scene.stageThree!;
    this.add.image(config.outletPosition.x, config.outletPosition.y, 'stage002.power-outlet').setDisplaySize(config.outletDisplaySize.width, config.outletDisplaySize.height).setDepth(STAGE_TWO_DEPTH.outlet);
    this.wire = this.add.graphics().setDepth(STAGE_TWO_DEPTH.powerCord);
    this.fan = new FanView(this, config.fanPosition.x, config.fanPosition.y, config.fanDisplaySize, this.stage.stageThree!.fanSlowdownMs).setDepth(STAGE_TWO_DEPTH.fan);
  }

  private createObjects(state: WorldState): void {
    for (const object of Object.values(state.objects)) {
      const view = object.kind === 'cake'
        ? new CakeView(this, object.position.x, object.position.y, this.stage.scene.stageThree!)
        : new DraggablePropView(this, object.id, object.graphicKey, object.position.x, object.position.y);
      view.setDepth(this.stage.scene.objectVisuals?.[object.id]?.depth ?? 42).setLocked(object.inputLocked);
      this.objectViews.set(object.id, view);
      if (object.kind === 'cake') this.cake = view as CakeView;
    }
  }

  private configureDragging(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView) => {
      if (!(target instanceof InteractiveObjectView) || target.isLocked() || !this.bridge.dispatch({ type: 'PICK_UP_OBJECT', objectId: target.objectId }).accepted) return;
      target.resetVisualState(); this.dragging.add(target.objectId); this.dragOrigins.set(target.objectId, { x: target.x, y: target.y }); target.setDepth(ROOM_DEPTH.dragOverlay);
      this.tweens.add({ targets: target, y: target.y - 12, scale: 1.07, duration: 90 }); this.showValidZones(this.bridge.getState().objects[target.objectId].kind);
    });
    this.input.on(Phaser.Input.Events.DRAG, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView, x: number, y: number) => {
      if (!(target instanceof InteractiveObjectView) || !this.dragging.has(target.objectId)) return;
      target.setPosition(Phaser.Math.Clamp(x, 30, 1570), Phaser.Math.Clamp(y, 70, 850));
      const object = this.bridge.getState().objects[target.objectId];
      this.lastDropResult = this.resolveDrop(target, object.kind);
      this.highlightZone(this.lastDropResult.type === 'reject' ? undefined : this.lastDropResult.zoneId);
      this.renderDebugState(this.bridge.getState());
    });
    this.input.on(Phaser.Input.Events.DRAG_END, (_pointer: Phaser.Input.Pointer, target: InteractiveObjectView) => {
      if (!(target instanceof InteractiveObjectView) || !this.dragging.delete(target.objectId)) return;
      this.hideZones(); target.setScale(1);
      const object = this.bridge.getState().objects[target.objectId];
      this.lastDropResult = this.resolveDrop(target, object.kind);
      const result = this.lastDropResult.type === 'ignite-candle'
        ? (this.lastCommand = 'LIGHT_CANDLE', this.bridge.dispatch({ type: 'LIGHT_CANDLE', lighterId: target.objectId }))
        : this.lastDropResult.type === 'place-object'
          ? (this.lastCommand = `DROP_OBJECT:${this.lastDropResult.zoneId}`, this.bridge.dispatch({ type: 'DROP_OBJECT', objectId: target.objectId, zoneId: this.lastDropResult.zoneId, worldPosition: this.lastDropResult.position }))
          : (this.lastCommand = 'REPORT_INVALID_DROP', this.bridge.dispatch({ type: 'REPORT_INVALID_DROP', objectId: target.objectId }));
      if (this.lastDropResult.type === 'reject' || !result.accepted) {
        this.bridge.dispatch({ type: 'CANCEL_DRAG', objectId: target.objectId });
        const origin = this.dragOrigins.get(target.objectId) ?? object.position;
        this.tweens.add({ targets: target, x: origin.x, y: origin.y, duration: 220, ease: 'Back.easeOut' });
      } else if (this.lastDropResult.type === 'ignite-candle') {
        const home = this.bridge.getState().objects[target.objectId].position;
        this.tweens.killTweensOf(target);
        target.setPosition(home.x, home.y).setScale(1);
      }
      this.dragOrigins.delete(target.objectId);
    });
  }

  private handleCoreEvent(event: GameEvent): void {
    if (['CANDLE_LIGHTING_STARTED', 'CANDLE_LIT', 'CANDLE_FLICKER_STARTED', 'CANDLE_FLICKER_STOPPED', 'CANDLE_BLOWN_OUT'].includes(event.type)) this.lastCandleEvent = event.type;
    if (event.type === 'STATE_CHANGED') this.renderState(event.state);
    else if (event.type === 'STAGE_RESET') this.resetViews(event.state);
    else if (event.type === 'OBJECT_DROPPED') { const view = this.objectViews.get(event.objectId); view?.setPosition(event.position.x, event.position.y); view?.animateDrop(); }
    else if (event.type === 'CANDLE_LIGHTING_STARTED') {
      const lighter = this.objectViews.get(this.stage.stageThree!.lighterObjectId);
      const home = this.bridge.getState().objects[this.stage.stageThree!.lighterObjectId].position;
      if (lighter) { this.tweens.killTweensOf(lighter); lighter.setPosition(home.x, home.y).setScale(1); }
    }
    else if (event.type === 'STAGE_COMPLETED') this.cameras.main.flash(420, 255, 244, 214);
  }

  private renderState(state: WorldState): void {
    if (state.stageThree) { this.fan.applyState(state.stageThree); this.cake.applyCakeState(state.stageThree); }
    for (const object of Object.values(state.objects)) { const view = this.objectViews.get(object.id); if (!view) continue; view.setLocked(object.inputLocked); view.setDepth(this.stage.scene.objectVisuals?.[object.id]?.depth ?? 42); if (!this.dragging.has(object.id) && !this.tweens.isTweening(view)) view.setPosition(object.position.x, object.position.y); }
    this.cat.applyState(state.actors.cat); this.renderPowerCord();
    this.renderDebugState(state);
  }

  private resolveDrop(target: InteractiveObjectView, kind: ObjectKind): StageThreeDropResult {
    const objectBounds = this.objectWorldBounds(target);
    this.lastDraggedObject = target.objectId;
    this.lastObjectBounds = objectBounds;
    const ignitionBounds = this.cake.getCandleIgnitionWorldBounds();
    return resolveStageThreeDrop({
      stage: this.stage,
      objectId: target.objectId,
      kind,
      objectBounds,
      candleIgnitionBounds: { x: ignitionBounds.x, y: ignitionBounds.y, width: ignitionBounds.width, height: ignitionBounds.height },
    });
  }

  private objectWorldBounds(target: InteractiveObjectView) {
    const hit = this.stage.scene.objectVisuals?.[target.objectId]?.hitSize ?? { width: target.width, height: target.height };
    return boundsFromCenter(
      { x: target.x, y: target.y },
      { width: hit.width * Math.abs(target.scaleX), height: hit.height * Math.abs(target.scaleY) },
    );
  }

  private resetViews(state: WorldState): void {
    this.tweens.killAll(); this.dragging.clear(); this.dragOrigins.clear(); this.hideZones();
    for (const object of Object.values(state.objects)) { const view = this.objectViews.get(object.id); view?.resetVisualState(); view?.setPosition(object.position.x, object.position.y).setDepth(this.stage.scene.objectVisuals?.[object.id]?.depth ?? 42).setLocked(object.inputLocked); }
    if (state.stageThree) { this.fan.resetTo(state.stageThree); this.cake.resetCakeState(state.stageThree); } this.cat.resetTo(state.actors.cat); this.renderPowerCord();
  }

  private renderPowerCord(): void {
    const plug = this.objectViews.get('power-plug'); const config = this.stage.scene.stageThree; const size = this.stage.scene.objectVisuals?.['power-plug']?.displaySize;
    if (!plug || !config || !size) return; const end = getPlugCableAnchor({ x: plug.x, y: plug.y }, size); const points = sampleQuadraticCurve(getPowerCordCurve(config.fanBaseCableAnchor, end));
    this.wire.clear().lineStyle(7, 0x17213a).beginPath().moveTo(points[0].x, points[0].y); for (const point of points.slice(1)) this.wire.lineTo(point.x, point.y); this.wire.strokePath();
  }
  private showValidZones(kind: ObjectKind): void {
    this.refreshCandleZoneOverlay();
    for (const zone of this.stage.zones) this.zoneOverlays.get(zone.id)?.setAlpha(zone.accepts.includes(kind) ? 0.25 : 0);
  }
  private highlightZone(id?: ZoneId): void { for (const [zoneId, overlay] of this.zoneOverlays) overlay.setAlpha(zoneId === id ? 0.48 : overlay.alpha > 0 ? 0.14 : 0); }
  private hideZones(): void { for (const overlay of this.zoneOverlays.values()) overlay.setAlpha(0); }

  private refreshCandleZoneOverlay(): void {
    const overlay = this.zoneOverlays.get(this.stage.stageThree!.ignitionZoneId);
    if (!overlay) return;
    const bounds = this.cake.getCandleIgnitionWorldBounds();
    overlay.clear().fillStyle(0xffca5c, 0.24).fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 16);
    overlay.lineStyle(4, 0x17213a, 0.38).strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 16);
  }

  private renderDebugState(state: WorldState): void {
    if (!this.debugZones || !state.stageThree) return;
    const ignition = this.cake.getCandleIgnitionWorldBounds();
    const cakeBounds = this.cake.getBounds();
    const lighter = this.objectViews.get(this.stage.stageThree!.lighterObjectId);
    const lighterBounds = lighter ? this.objectWorldBounds(lighter) : undefined;
    this.debugGraphics?.clear()
      .lineStyle(3, 0xff7d6b, 0.95).strokeRect(ignition.x, ignition.y, ignition.width, ignition.height)
      .lineStyle(2, 0x59d8d0, 0.9).strokeRect(cakeBounds.x, cakeBounds.y, cakeBounds.width, cakeBounds.height);
    if (lighterBounds) this.debugGraphics?.lineStyle(2, 0xffca5c, 0.95).strokeRect(lighterBounds.x, lighterBounds.y, lighterBounds.width, lighterBounds.height);
    const flame = this.cake.getFlameDebugState();
    const debug = {
      cakeLocation: state.stageThree.cakeLocation,
      cakeCondition: state.stageThree.cakeCondition,
      catThreat: state.stageThree.catThreat,
      candleState: state.stageThree.candleState,
      lighterZone: state.objects[this.stage.stageThree!.lighterObjectId].zoneId,
      dropResult: this.lastDropResult.type,
      draggedObject: this.lastDraggedObject,
      objectBounds: this.lastObjectBounds,
      command: this.lastCommand,
      candleEvent: this.lastCandleEvent,
      airflowProtection: state.stageThree.airflowProtection,
      airflowReachesCandle: state.stageThree.airflowReachesCandle,
      fanDirection: state.stageThree.fanDirection,
      fanPower: state.stageThree.fanPower,
      ignitionBounds: { x: ignition.x, y: ignition.y, width: ignition.width, height: ignition.height },
      flame,
    };
    (window as typeof window & { __PLACE_AND_SEE_STAGE3_DEBUG__?: typeof debug }).__PLACE_AND_SEE_STAGE3_DEBUG__ = debug;
    this.game.canvas.dataset.stage3Debug = JSON.stringify(debug);
    this.debugText?.setText(`drop=${debug.dropResult} cmd=${debug.command} event=${debug.candleEvent}\ncake=${debug.cakeLocation}/${debug.cakeCondition} candle=${debug.candleState} fan=${debug.fanPower}/${debug.fanDirection}\nairflow=${debug.airflowProtection} flame=${flame.visible ? 'visible' : 'hidden'} a=${flame.alpha.toFixed(2)}`);
  }
}
