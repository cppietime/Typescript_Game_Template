import type { Sprite } from "../data/sprites.js";
import { ImageSystem } from "./ImageSystem.js";
import * as constants from '../data/constants.js';
import type { TlRect, Vec2 } from "../util/Geometry.js";
import { IdMap } from "../util/IdMap.js";
import { hasRenderable, type RenderEntity } from "../component/render/RenderComponent.js";
import type { EntitySystem } from "./EntitySystem.js";
import type { Entity } from "../component/entity/Entity.js";

export class RenderGroup {
    static RenderGroups = new IdMap<RenderGroup>();
    id: number;
    renderables: RenderEntity[] = [];
    active: boolean = true;
    dirty: boolean = true;
    indices = new Map<number, number>();

    constructor() {
        this.id = RenderGroup.RenderGroups.add(this);
    }

    markDirty() {
        this.dirty = true;
    }

    clean() {
        if (!this.dirty) {
            return;
        }
        this.renderables.sort((a, b) => a.components.renderable.z - b.components.renderable.z);
        this.renderables.forEach((r, idx) => this.indices.set(r.uuid, idx));
        this.dirty = false;
    }

    clear() {
        this.renderables.length = 0;
        this.indices.clear();
        this.markDirty();
    }

    remove(uuid: number) {
        this.clean();
        const idx = this.indices.get(uuid);
        this.indices.delete(uuid);
        if (idx === undefined) {
            return;
        }
        this.renderables[idx] = this.renderables[this.renderables.length - 1]!;
        this.renderables.pop();
        this.markDirty();
    }

    render(renderSystem: RenderSystem) {
        if (!this.active) {
            return;
        }
        this.clean();
        for (const renderable of this.renderables) {
            if (renderable.isAlive && renderable.components.renderable.visible) {
                renderable.components.renderable.render(renderSystem, renderable);
            }
        }
    }
}

export class RenderSystem implements EntitySystem {
    canvas: HTMLCanvasElement;
    canvasWidth: number = 0;
    canvasHeight: number = 0;
    ctx: CanvasRenderingContext2D;
    spriteSystem = new ImageSystem();
    //renderGroups: RenderGroup[] = [];
    zSorted: RenderEntity[] = [];
    uuidToIdx = new Map<number, number>();
    clearColor: string = '#000';
    offset: Vec2 = {x: 0, y: 0};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;

        this.reset();
    }

    predicate(entity: Entity<any>): boolean {
        return hasRenderable(entity);
    }

    addEntity(entity: Entity<any>) {
        if (!hasRenderable(entity)) {
            return;
        }
        this.uuidToIdx.set(entity.uuid, this.zSorted.length);
        this.zSorted.push(entity);
    }

    removeEntity(uuid: number) {
        const idx = this.uuidToIdx.get(uuid);
        this.uuidToIdx.delete(uuid);
        if (idx === undefined) {
            return;
        }
        this.zSorted.splice(idx, 1);
    }

    containsEntity(uuid: number): boolean {
        return this.uuidToIdx.has(uuid);
    }

    reset() {
    }

    onResize() {
        const [width, height] = [window.innerWidth, window.innerHeight];
        const aspectRatio = width / height;
        if (aspectRatio > constants.CANVAS_ASPECT_RATIO) {
            [this.canvasWidth, this.canvasHeight] = [height * constants.CANVAS_ASPECT_RATIO, height];
        } else {
            [this.canvasWidth, this.canvasHeight] = [width, width / constants.CANVAS_ASPECT_RATIO];
        }
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;

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

    drawSprite(sprite: Sprite, x: number, y: number, w?: number, h?: number, relative: boolean = false) {
        const width = w ?? sprite.width;
        const height = h ?? sprite.height;

        if (relative) {
            x = x + this.canvas.width / 2 - this.offset.x;
            y = y + this.canvas.height / 2 - this.offset.y;
        }

        const img = this.spriteSystem.images.get(sprite.image);
        if (img === undefined) {
            this.ctx.fillStyle = sprite.color;
            this.ctx.fillRect(x, y, width, height);
            return;
        }

        this.ctx.drawImage(img, sprite.x0, sprite.y0, sprite.width, sprite.height, x, y, width, height);
    }

    render() {
        this.clear(this.clearColor);

        this.zSorted.sort((a, b) => a.components.renderable.z - b.components.renderable.z);
        this.zSorted.forEach((r, idx) => this.uuidToIdx.set(r.uuid, idx));

        for (const renderable of this.zSorted) {
            if (!renderable.components.renderable.visible) {
                continue;
            }
            renderable.components.renderable.render(this, renderable);
        }
    }
    
    positionOnCanvas(x: number, y: number): Vec2 {
        return {
            x: x / this.canvasWidth * this.canvas.width,
            y: y / this.canvasHeight * this.canvas.height,
        };
    }
}