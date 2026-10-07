import { Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

type ChemType = 'acid' | 'base' | 'salt' | 'metal' | 'indicator';
interface VesselSlot { color: string; amount: number; type: ChemType; }
type VesselKind = 'bottle' | 'testtube';

const TILT_POUR_THRESHOLD = 0.55; // radians (~31°)
const TILT_MAX = 1.15; // radians (~66°)
const POUR_TICK_MS = 220;
const MAX_METAL_PIECES = 6;
const CAP_COLOR: Record<ChemType, number> = { acid: 0xe0645c, base: 0x4b6fd1, salt: 0x37c2b5, indicator: 0xe0a23a, metal: 0x8a8f94 };
const SHELF_BOTTLE_COLORS = [0xe0645c, 0x4b6fd1, 0x37c2b5, 0xe0a23a, 0x8e5fd1, 0x4caf50, 0xe87fc4, 0x3f7fd1];

interface VesselRig {
  group: THREE.Group;
  grab: THREE.Mesh;
  spoutLocal: THREE.Vector3;
  liquid?: THREE.Mesh; baseLiquidH?: number; cap?: THREE.Mesh;
  pieces?: THREE.Mesh[];
}

interface SideState {
  kind: VesselKind;
  bottleRig: VesselRig;
  testtubeRig: VesselRig;
  rot: number; pouring: boolean; lastTickAt: number; amount: number;
  fallT: number; fallFrom: THREE.Vector3;
}

/**
 * Renders the reaction beaker plus the two source vessels (reagent bottle for liquids,
 * test tube for solid metals — matching real equipment) as a Three.js scene, on a dressed
 * lab bench. Purely a rendering/interaction layer — all reaction chemistry stays in the
 * parent component; this reflects liquidColor/liquidHeight/bubbles/precipitate and reports
 * amount changes from pouring.
 */
@Component({
  selector: 'app-chem-beaker-3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="beaker3d-host" #hostRef>
      <canvas #canvasRef></canvas>
      <div class="gas-label" *ngIf="gasLabel">{{ gasLabel }}</div>
      <div class="smell-label" *ngIf="smellLabel">{{ smellLabel }}</div>
      <div class="pour-hint" *ngIf="(slotA || slotB) && !pouredOnce">🖱️ {{ isEn ? 'Drag & tilt a vessel onto the beaker to pour' : 'পাত্র ধরে টেনে বেকারের দিকে কাত করে ঢালুন' }}</div>
    </div>
  `,
  styles: [`
    .beaker3d-host { position: relative; width: 100%; height: 380px; touch-action: none; border-radius: 10px; overflow: hidden; }
    canvas { width: 100%; height: 100%; display: block; cursor: grab; }
    .gas-label { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); font-size: 0.8rem; font-weight: 700; color: #e0a23a; white-space: nowrap; pointer-events: none; }
    .smell-label { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: #9fb0bf; white-space: nowrap; pointer-events: none; }
    .pour-hint { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); font-size: 0.72rem; color: #eef; background: rgba(0,0,0,0.35); padding: 3px 10px; border-radius: 999px; pointer-events: none; }
  `],
})
export class ChemBeaker3dComponent implements OnChanges, OnDestroy {
  @ViewChild('hostRef', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() liquidColor = '#cfe8f5';
  @Input() liquidHeight = 10; // 0-100
  @Input() precipitateColor = 'transparent';
  @Input() precipitateHeight = 0; // 0-100
  @Input() bubbleCount = 0; // 0-15
  @Input() gasLabel = '';
  @Input() smellLabel = '';
  @Input() slotA: VesselSlot | null = null; // amount 1-10
  @Input() slotB: VesselSlot | null = null;
  @Input() isEn = false;

  @Output() amountAChange = new EventEmitter<number>();
  @Output() amountBChange = new EventEmitter<number>();

  pouredOnce = false;

  private zone = inject(NgZone);
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private raycaster = new THREE.Raycaster();
  private resizeObs?: ResizeObserver;
  private rafId = 0;

  // Target (smoothed) visual state
  private targetLiquidColor = new THREE.Color('#cfe8f5');
  private displayLiquidColor = new THREE.Color('#cfe8f5');
  private displayLiquidFrac = 0.1;
  private displayPrecipFrac = 0;
  private targetPrecipColor = new THREE.Color(0, 0, 0);

  private beakerLiquidBaseH = 1.7;
  private beakerLiquid!: THREE.Mesh;
  private precipMesh!: THREE.Mesh;
  private bubbleMeshes: THREE.Mesh[] = [];
  private bubblePhase: number[] = [];

  private sides: Record<'A' | 'B', SideState | null> = { A: null, B: null };
  private stream!: { A: THREE.Mesh; B: THREE.Mesh };
  private fallingPiece!: { A: THREE.Mesh; B: THREE.Mesh };

  private activeSide: 'A' | 'B' | null = null;
  private dragStartX = 0;
  private dragStartRot = 0;
  private lastFrameAt = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['liquidColor']) this.targetLiquidColor.set(this.liquidColor === 'transparent' ? '#cfe8f5' : this.liquidColor);
    if (changes['precipitateColor']) this.targetPrecipColor.set(this.precipitateColor === 'transparent' ? '#000000' : this.precipitateColor);
    if (changes['bubbleCount']) this.syncBubbleCount();
    if (changes['slotA']) this.syncSide('A');
    if (changes['slotB']) this.syncSide('B');
    if (!this.renderer && this.canvasRef) this.init();
  }

  ngOnDestroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.resizeObs?.disconnect();
    const canvas = this.canvasRef?.nativeElement;
    canvas?.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer?.dispose();
  }

  private init() {
    const canvas = this.canvasRef.nativeElement;
    const host = this.hostRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d3b3a);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 2.0, 6.4);
    this.camera.lookAt(0, 0.8, 0);

    this.scene.add(new THREE.AmbientLight(0xfff4e6, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(3, 5, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fe0d6, 0.4);
    rim.position.set(-4, 2, -3);
    this.scene.add(rim);
    const warmFill = new THREE.PointLight(0xffcf8a, 0.5, 12);
    warmFill.position.set(0, 3, 3);
    this.scene.add(warmFill);

    this.buildBench();
    this.buildDecorShelf();
    this.buildBeaker();
    this.sides.A = this.buildSide('A', -1.95);
    this.sides.B = this.buildSide('B', 1.95);
    this.buildProjectiles();

    this.resizeObs = new ResizeObserver(() => this.onResize());
    this.resizeObs.observe(host);
    this.onResize();

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);

    this.syncSide('A');
    this.syncSide('B');
    this.syncBubbleCount();

    this.zone.runOutsideAngular(() => {
      const loop = () => { this.rafId = requestAnimationFrame(loop); this.tick(); };
      loop();
    });
  }

  private onResize() {
    const host = this.hostRef.nativeElement;
    const w = host.clientWidth || 300;
    const h = host.clientHeight || 380;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ---------- Bench dressing ----------

  private buildBench() {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.3, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x7a4a29, roughness: 0.75 }),
    );
    bench.position.y = -0.15;
    const benchEdge = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x4d2f1a, roughness: 0.7 }),
    );
    benchEdge.position.set(0, -0.02, 2.2);

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 4),
      new THREE.MeshStandardMaterial({ color: 0x123634, roughness: 0.95 }),
    );
    backWall.position.set(0, 1.85, -2.15);

    this.scene.add(bench, benchEdge, backWall);
  }

  private buildDecorShelf() {
    const shelfY = 2.3;
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.12, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 }),
    );
    plank.position.set(0, shelfY, -1.9);
    this.scene.add(plank);

    const n = SHELF_BOTTLE_COLORS.length;
    for (let i = 0; i < n; i++) {
      const x = -3.0 + (i / (n - 1)) * 6.0;
      const bodyH = 0.34 + (i % 3) * 0.05;
      const group = new THREE.Group();
      group.position.set(x, shelfY + bodyH / 2 + 0.06, -1.9);
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.12, bodyH, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.1 }),
      );
      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.1, bodyH * 0.75, 16),
        new THREE.MeshStandardMaterial({ color: SHELF_BOTTLE_COLORS[i], roughness: 0.25, transparent: true, opacity: 0.92 }),
      );
      liquid.position.y = -bodyH * 0.06;
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 }),
      );
      cap.position.y = bodyH / 2 + 0.05;
      group.add(glass, liquid, cap);
      this.scene.add(group);
    }
  }

  // ---------- Geometry helpers ----------

  private setFill(mesh: THREE.Mesh, baseHeight: number, frac: number) {
    const f = Math.max(0.02, Math.min(1, frac));
    mesh.scale.y = f;
    mesh.position.y = (baseHeight * f) / 2;
    mesh.visible = frac > 0.005;
  }

  private buildBeaker() {
    const rTop = 0.95, rBot = 0.85, h = 2.0;
    const shellMat = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ea, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 40, 1, true), shellMat);
    shell.position.y = h / 2;
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(rBot, 40), shellMat);
    bottom.rotation.x = -Math.PI / 2;
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xdfeef4, transparent: true, opacity: 0.5, roughness: 0.2 });
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(rTop, 0.035, 8, 40), rimMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = h;

    this.beakerLiquidBaseH = h * 0.88;
    const liqMat = new THREE.MeshStandardMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.92, roughness: 0.2 });
    this.beakerLiquid = new THREE.Mesh(new THREE.CylinderGeometry(rTop * 0.94, rBot * 0.94, this.beakerLiquidBaseH, 40), liqMat);
    this.setFill(this.beakerLiquid, this.beakerLiquidBaseH, this.liquidHeight / 100);

    const precipMat = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.92, roughness: 0.9 });
    this.precipMesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop * 0.9, rBot * 0.9, this.beakerLiquidBaseH, 40), precipMat);
    this.setFill(this.precipMesh, this.beakerLiquidBaseH, this.precipitateHeight / 100);

    this.scene.add(shell, bottom, rimRing, this.beakerLiquid, this.precipMesh);

    for (let i = 0; i < 15; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      b.visible = false;
      this.bubbleMeshes.push(b);
      this.bubblePhase.push(Math.random() * 10);
      this.scene.add(b);
    }
  }

  /** A reagent/stock bottle — the real container liquid acids/bases/salts are stored and poured from. */
  private buildBottleRig(restX: number): VesselRig {
    const bodyH = 0.85, neckH = 0.32, bodyR = 0.3, neckTopR = 0.11;
    const pivot = 0.78;
    const group = new THREE.Group();
    group.position.set(restX, pivot, 0.35);

    const baseY = -pivot;
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xdfeaf0, transparent: true, opacity: 0.22, roughness: 0.06, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyR, bodyR * 0.92, bodyH, 24), bodyMat);
    body.position.y = baseY + bodyH / 2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(neckTopR, bodyR, neckH, 24), bodyMat);
    neck.position.y = baseY + bodyH + neckH / 2;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(neckTopR * 1.05, neckTopR * 1.05, 0.14, 16), new THREE.MeshStandardMaterial({ color: CAP_COLOR.acid, roughness: 0.4 }));
    cap.position.y = baseY + bodyH + neckH + 0.07;

    const baseLiquidH = bodyH * 0.8;
    const liqMat = new THREE.MeshStandardMaterial({ color: 0xeef6fb, transparent: true, opacity: 0.9, roughness: 0.2 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(bodyR * 0.85, bodyR * 0.8, baseLiquidH, 24), liqMat);
    liquid.position.y = baseY + (baseLiquidH * 0.5) / 2;
    liquid.scale.y = 0.5;

    const grab = new THREE.Mesh(new THREE.CylinderGeometry(bodyR * 1.4, bodyR * 1.4, bodyH + neckH, 12), new THREE.MeshBasicMaterial({ visible: false }));
    grab.position.y = baseY + (bodyH + neckH) / 2;

    group.add(body, neck, cap, liquid, grab);
    return { group, grab, spoutLocal: new THREE.Vector3(0, baseY + bodyH + neckH, 0), liquid, baseLiquidH, cap };
  }

  /** A test tube — the real container solid metal pieces sit in before acid is poured over them. */
  private buildTestTubeRig(restX: number, pieceColor: number): VesselRig {
    const tubeH = 0.95, tubeR = 0.2;
    const pivot = 0.75;
    const group = new THREE.Group();
    group.position.set(restX, pivot, 0.35);
    const baseY = -pivot;

    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xdfeaf0, transparent: true, opacity: 0.18, roughness: 0.05, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, tubeH, 20, 1, true), glassMat);
    body.position.y = baseY + tubeH / 2 + tubeR;
    const bottomCap = new THREE.Mesh(new THREE.SphereGeometry(tubeR, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glassMat);
    bottomCap.position.y = baseY + tubeR;
    const lipRing = new THREE.Mesh(new THREE.TorusGeometry(tubeR, 0.02, 6, 20), new THREE.MeshStandardMaterial({ color: 0xdfeef4, transparent: true, opacity: 0.5, roughness: 0.2 }));
    lipRing.rotation.x = Math.PI / 2;
    lipRing.position.y = baseY + tubeH + tubeR;

    // A small wooden test-tube stand clamp for that "organized bench" look.
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.85 }));
    standBase.position.y = baseY - 0.03;
    const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.85 }));
    standPost.position.set(0.19, baseY + 0.22, 0);
    const clampRing = new THREE.Mesh(new THREE.TorusGeometry(tubeR + 0.03, 0.02, 6, 16), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 }));
    clampRing.rotation.x = Math.PI / 2;
    clampRing.position.set(0.05, baseY + 0.42, 0);

    const pieceMat = new THREE.MeshStandardMaterial({ color: pieceColor, roughness: 0.35, metalness: 0.6 });
    const pieces: THREE.Mesh[] = [];
    for (let i = 0; i < MAX_METAL_PIECES; i++) {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.05), pieceMat);
      piece.position.set((i - MAX_METAL_PIECES / 2) * 0.05, baseY + tubeR + 0.05, 0);
      piece.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.25;
      piece.visible = false;
      pieces.push(piece);
    }

    const grab = new THREE.Mesh(new THREE.CylinderGeometry(tubeR * 1.6, tubeR * 1.6, tubeH + tubeR, 12), new THREE.MeshBasicMaterial({ visible: false }));
    grab.position.y = baseY + (tubeH + tubeR) / 2;

    group.add(body, bottomCap, lipRing, standBase, standPost, clampRing, grab, ...pieces);
    return { group, grab, spoutLocal: new THREE.Vector3(0, baseY + tubeH + tubeR, 0), pieces };
  }

  private buildSide(side: 'A' | 'B', restX: number): SideState {
    const bottleRig = this.buildBottleRig(restX);
    const testtubeRig = this.buildTestTubeRig(restX, CAP_COLOR.metal);
    this.scene.add(bottleRig.group, testtubeRig.group);
    return { kind: 'bottle', bottleRig, testtubeRig, rot: 0, pouring: false, lastTickAt: 0, amount: 5, fallT: 1, fallFrom: new THREE.Vector3() };
  }

  private buildProjectiles() {
    const mkStream = () => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 8), new THREE.MeshBasicMaterial({ color: 0xeef6fb, transparent: true, opacity: 0.85 }));
      m.visible = false;
      this.scene.add(m);
      return m;
    };
    const mkPiece = () => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.05), new THREE.MeshStandardMaterial({ color: 0xb7bec4, roughness: 0.35, metalness: 0.6 }));
      m.visible = false;
      this.scene.add(m);
      return m;
    };
    this.stream = { A: mkStream(), B: mkStream() };
    this.fallingPiece = { A: mkPiece(), B: mkPiece() };
  }

  // ---------- Reactive syncs from @Input changes ----------

  private activeRig(s: SideState): VesselRig { return s.kind === 'bottle' ? s.bottleRig : s.testtubeRig; }

  private syncSide(side: 'A' | 'B') {
    const slot = side === 'A' ? this.slotA : this.slotB;
    const s = this.sides[side];
    if (!s) return;

    if (!slot) { s.bottleRig.group.visible = false; s.testtubeRig.group.visible = false; return; }

    s.kind = slot.type === 'metal' ? 'testtube' : 'bottle';
    s.amount = slot.amount;
    s.bottleRig.group.visible = s.kind === 'bottle';
    s.testtubeRig.group.visible = s.kind === 'testtube';

    if (s.kind === 'bottle') {
      const rig = s.bottleRig;
      (rig.liquid!.material as THREE.MeshStandardMaterial).color.set(slot.color === 'transparent' ? '#eef6fb' : slot.color);
      (rig.cap!.material as THREE.MeshStandardMaterial).color.setHex(CAP_COLOR[slot.type]);
      this.setFill(rig.liquid!, rig.baseLiquidH!, slot.amount / 10);
    } else {
      const rig = s.testtubeRig;
      const visibleCount = Math.max(1, Math.round((slot.amount / 10) * MAX_METAL_PIECES));
      rig.pieces!.forEach((p, i) => {
        p.visible = i < visibleCount;
        (p.material as THREE.MeshStandardMaterial).color.set(slot.color);
      });
    }
  }

  private syncBubbleCount() {
    const n = Math.max(0, Math.min(15, Math.round(this.bubbleCount)));
    this.bubbleMeshes.forEach((m, i) => { m.visible = i < n; });
  }

  // ---------- Pointer / drag-tilt-pour interaction ----------

  private ndc(clientX: number, clientY: number) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private onPointerDown = (e: PointerEvent) => {
    const p = this.ndc(e.clientX, e.clientY);
    this.raycaster.setFromCamera(p, this.camera);
    const targets = (['A', 'B'] as const)
      .filter(s => this.sides[s] && this.activeRig(this.sides[s]!).group.visible)
      .map(s => ({ side: s, grab: this.activeRig(this.sides[s]!).grab }));
    const hits = this.raycaster.intersectObjects(targets.map(t => t.grab), false);
    if (hits.length) {
      const hitTarget = targets.find(t => t.grab === hits[0].object);
      if (hitTarget) {
        this.activeSide = hitTarget.side;
        this.dragStartX = e.clientX;
        this.dragStartRot = this.sides[hitTarget.side]!.rot;
        this.canvasRef.nativeElement.style.cursor = 'grabbing';
      }
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.activeSide) return;
    const side = this.activeSide;
    const s = this.sides[side]!;
    const dir = side === 'A' ? 1 : -1; // tilt so the spout swings toward the beaker (which sits at x=0)
    const deltaPx = (e.clientX - this.dragStartX) * dir;
    const rot = Math.max(0, Math.min(TILT_MAX, this.dragStartRot + deltaPx / 140));
    s.rot = rot;
    s.pouring = rot >= TILT_POUR_THRESHOLD && s.amount < 10;
  };

  private onPointerUp = () => {
    if (this.activeSide) this.canvasRef.nativeElement.style.cursor = 'grab';
    if (this.activeSide) this.sides[this.activeSide]!.pouring = false;
    this.activeSide = null;
  };

  // ---------- Render loop ----------

  private tick() {
    const now = performance.now();
    const dt = Math.min(0.05, this.lastFrameAt ? (now - this.lastFrameAt) / 1000 : 0.016);
    this.lastFrameAt = now;

    // Smooth beaker liquid color/height/precipitate toward target (mirrors the old CSS transition feel)
    this.displayLiquidColor.lerp(this.targetLiquidColor, 1 - Math.pow(0.001, dt));
    (this.beakerLiquid.material as THREE.MeshStandardMaterial).color.copy(this.displayLiquidColor);
    this.displayLiquidFrac += (this.liquidHeight / 100 - this.displayLiquidFrac) * Math.min(1, dt * 3);
    this.setFill(this.beakerLiquid, this.beakerLiquidBaseH, this.displayLiquidFrac);

    (this.precipMesh.material as THREE.MeshStandardMaterial).color.copy(this.targetPrecipColor);
    this.displayPrecipFrac += (this.precipitateHeight / 100 - this.displayPrecipFrac) * Math.min(1, dt * 2);
    this.setFill(this.precipMesh, this.beakerLiquidBaseH, this.displayPrecipFrac);

    // Bubbles rising inside the beaker
    const liquidTopY = this.beakerLiquidBaseH * this.displayLiquidFrac;
    this.bubbleMeshes.forEach((m, i) => {
      if (!m.visible) return;
      const phase = (this.bubblePhase[i] + now / 900) % 3;
      m.position.set(Math.sin(i * 1.7 + now / 1400) * 0.5, phase / 3 * Math.max(0.2, liquidTopY), Math.cos(i * 1.3 + now / 1100) * 0.5);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - phase / 3);
    });

    (['A', 'B'] as const).forEach(side => {
      const s = this.sides[side];
      if (!s) return;
      const rig = this.activeRig(s);
      if (!rig.group.visible) return;
      rig.group.rotation.z = (side === 'A' ? -1 : 1) * s.rot;

      const impact = new THREE.Vector3(0, Math.max(0.15, liquidTopY), 0.1);
      const spoutWorld = rig.group.localToWorld(rig.spoutLocal.clone());

      if (s.pouring && now - s.lastTickAt > POUR_TICK_MS) {
        s.lastTickAt = now;
        s.amount = Math.min(10, s.amount + 1);
        this.pouredOnce = true;
        if (s.kind === 'testtube') { s.fallT = 0; s.fallFrom = spoutWorld.clone(); }
        this.zone.run(() => (side === 'A' ? this.amountAChange : this.amountBChange).emit(s.amount));
        if (s.amount >= 10) s.pouring = false;
      }

      const streamMesh = this.stream[side];
      if (s.kind === 'bottle' && s.pouring) {
        const mid = spoutWorld.clone().add(impact).multiplyScalar(0.5);
        const dirVec = impact.clone().sub(spoutWorld);
        const len = Math.max(0.05, dirVec.length());
        streamMesh.visible = true;
        streamMesh.position.copy(mid);
        streamMesh.scale.set(1, len, 1);
        streamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec.clone().normalize());
      } else {
        streamMesh.visible = false;
      }

      const fallingMesh = this.fallingPiece[side];
      if (s.kind === 'testtube' && s.fallT < 1) {
        s.fallT = Math.min(1, s.fallT + dt / 0.4);
        const ease = 1 - (1 - s.fallT) * (1 - s.fallT);
        fallingMesh.visible = true;
        fallingMesh.position.lerpVectors(s.fallFrom, impact, ease);
        fallingMesh.position.y -= 0.3 * Math.sin(ease * Math.PI); // slight arc
        fallingMesh.rotation.x += dt * 10;
        fallingMesh.rotation.z += dt * 6;
      } else {
        fallingMesh.visible = false;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}
