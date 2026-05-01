import type { Sprite } from "../data/types/Sprites.js";
import { ImageSystem } from "./ImageSystem.js";
import * as constants from '../../game/data/Constants.js';
import { createVec2, type TlRect, type Vec2 } from "../util/Geometry.js";
import { IdMap } from "../util/IdMap.js";
import { hasRenderable, type RenderEntity } from "../components/RenderComponent.js";
import type { EntitySystem } from "./EntitySystem.js";
import type { Entity } from "../entity/Entity.js";

export class RenderSystem implements EntitySystem {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly spriteSystem = new ImageSystem();
    private readonly zSorted: RenderEntity[] = [];
    private readonly uuidToIdx = new Map<number, number>();
    private physWidth: number = 0;
    private physHeight: number = 0;
    private dirty: boolean = false;

    clearColor: string = '#000';
    offset: Vec2 = createVec2({});

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;

        this.reset();
    }

    canvasSize = () => createVec2({x: this.canvas.width, y: this.canvas.height});

    predicate(entity: Entity<any>): boolean {
        return hasRenderable(entity);
    }

    markDirty() {
        this.dirty = true;
    }

    addEntity(entity: Entity<any>) {
        if (!hasRenderable(entity)) {
            return;
        }
        this.uuidToIdx.set(entity.uuid, this.zSorted.length);
        this.zSorted.push(entity);
        this.markDirty();
    }

    removeEntity(uuid: number) {
        const idx = this.uuidToIdx.get(uuid);
        this.uuidToIdx.delete(uuid);
        if (idx === undefined) {
            return;
        }
        this.zSorted.splice(idx, 1);
        this.markDirty();
    }

    containsEntity(uuid: number): boolean {
        return this.uuidToIdx.has(uuid);
    }

    setZ(id: number, z: number) {
        const idx = this.uuidToIdx.get(id);
        if (idx === undefined) {
            return;
        }
        const entity = this.zSorted[idx]!;
        entity.components.renderable.z = z;
        this.markDirty();
    }

    clean() {
        if (!this.dirty) {
            return;
        }
        this.zSorted.sort((a, b) => a.components.renderable.z - b.components.renderable.z);
        this.zSorted.forEach((r, idx) => this.uuidToIdx.set(r.uuid, idx));
        this.dirty = false;
    }

    reset() {
    }

    onResize() {
        const [width, height] = [window.innerWidth, window.innerHeight];
        const aspectRatio = width / height;
        let canvasWidth: number, canvasHeight: number;
        if (aspectRatio > constants.CANVAS_ASPECT_RATIO) {
            ([this.physWidth, this.physHeight] = [height * constants.CANVAS_ASPECT_RATIO, height]);
        } else {
            ([this.physWidth, this.physHeight] = [width, width / constants.CANVAS_ASPECT_RATIO]);
        }
        this.canvas.style.width = `${this.physWidth}px`;
        this.canvas.style.height = `${this.physHeight}px`;

        this.ctx.imageSmoothingEnabled = false;

        this.clear('#008800');
    }

    clear(style: string = '#000000') {
        this.ctx.fillStyle = style;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawOutline(rect: TlRect, color: string, relative: boolean = false) {
        let {x, y} = rect.topLeft;
        let {x: w, y: h} = rect.size;
        if (relative) {
            x = x + this.canvas.width / 2 - this.offset.x;
            y = y + this.canvas.height / 2 - this.offset.y;
        }
        this.ctx.strokeStyle = color;
        this.ctx.setLineDash([4, 4]);
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = "butt";
        this.ctx.strokeRect(x, y, w, h);
    }

    worldToScreen(pos: Vec2): Vec2 {
        const x = pos.x + this.canvas.width / 2 - this.offset.x;
        const y = pos.y + this.canvas.height / 2 - this.offset.y;
        return {x, y};
    }

    screenToWorld(pos: Vec2): Vec2 {
        const x = pos.x - this.canvas.width / 2 + this.offset.x;
        const y = pos.y - this.canvas.height / 2 + this.offset.y;
        return {x, y};
    }

    positionOnCanvas(pos: Vec2): Vec2 {
        return createVec2({
            x: pos.x / this.physWidth * this.canvas.width,
            y: pos.y / this.physHeight * this.canvas.height,
        });
    }

    drawSprite(sprite: Sprite, x: number, y: number, w?: number, h?: number, relative: boolean = false) {
        const {topLeft: {x: x0, y: y0}, size: {x: dx, y: dy}} = sprite.source;
        const width = w ?? dx;
        const height = h ?? dy;

        if (relative) {
            ({x, y} = this.worldToScreen({x, y}));
        }

        const img = this.spriteSystem.getImage(sprite.image);
        if (img === undefined) {
            this.ctx.fillStyle = sprite.color;
            this.ctx.fillRect(x, y, width, height);
            return;
        }

        this.ctx.drawImage(img, x0, y0, dx, dy, x, y, width, height);
    }

    render() {
        this.clean();

        this.clear(this.clearColor);

        for (const renderable of this.zSorted) {
            if (!renderable.components.renderable.visible) {
                continue;
            }
            renderable.components.renderable.render(this, renderable);
        }
    }
}