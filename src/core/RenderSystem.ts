import type { Sprite } from "../data/sprites.js";
import { ImageSystem } from "./ImageSystem.js";
import * as constants from '../data/constants.js';
import type { TlRect, Vec2 } from "../util/Geometry.js";
import { IdMap } from "../util/IdMap.js";
import type { RenderEntity } from "../component/render/RenderComponent.js";

export class RenderGroup {
    static RenderGroups = new IdMap<RenderGroup>();
    id: number;
    renderables = new IdMap<RenderEntity>();
    active: boolean = true;

    constructor() {
        this.id = RenderGroup.RenderGroups.add(this);
    }

    clear() {
        this.renderables.clear();
    }

    add(renderable: RenderEntity, index?: number): number {
        return this.renderables.add(renderable);
    }

    remove(index: number) {
        this.renderables.remove(index);
    }

    render(renderSystem: RenderSystem) {
        if (!this.active) {
            return;
        }
        for (const renderable of this.renderables.values()) {
            renderable.components.renderable.render(renderSystem, renderable);
        }
    }
}

export class RenderSystem {
    canvas: HTMLCanvasElement;
    canvasWidth: number = 0;
    canvasHeight: number = 0;
    ctx: CanvasRenderingContext2D;
    spriteSystem = new ImageSystem();
    renderGroups = new Map<number, RenderGroup>();
    clearColor: string = '#000';
    offset: Vec2 = {x: 0, y: 0};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;

        this.reset();
    }

    reset() {
        this.renderGroups.clear();
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

    getRenderGroup(index: number): RenderGroup {
        if (!this.renderGroups.has(index)) {
            this.renderGroups.set(index, new RenderGroup());
        }
        return this.renderGroups.get(index)!;
    }

    render() {
        this.clear(this.clearColor);

        for (const renderGroup of this.renderGroups.values()) {
            renderGroup.render(this);
        }
    }
    
    positionOnCanvas(x: number, y: number): Vec2 {
        return {
            x: x / this.canvasWidth * this.canvas.width,
            y: y / this.canvasHeight * this.canvas.height,
        };
    }
}