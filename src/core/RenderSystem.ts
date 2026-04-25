import type { Sprite } from "../data/sprites.js";
import { ImageSystem } from "./ImageSystem.js";
import * as constants from '../data/constants.js';

export type Renderable = {
    render: (_: RenderSystem) => void;
};

export class RenderGroup {
    renderables: Renderable[] = [];
    active: boolean = true;

    clear() {
        this.renderables.splice(0, this.renderables.length);
    }

    add(renderable: Renderable, index?: number) {
        this.renderables.splice(index ?? this.renderables.length, 0, renderable);
    }

    render(renderSystem: RenderSystem) {
        if (!this.active) {
            return;
        }
        this.renderables.forEach(r => r.render(renderSystem));
    }
}

export class RenderSystem {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    spriteSystem: ImageSystem;
    renderGroups: RenderGroup[] = [];
    clearColor: string = '#000';

    constructor(canvas: HTMLCanvasElement) {
        this.spriteSystem = new ImageSystem();
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
    }

    onResize() {
        let w, h;
        const [width, height] = [window.innerWidth, window.innerHeight];
        const aspectRatio = width / height;
        if (aspectRatio > constants.CANVAS_ASPECT_RATIO) {
            [w, h] = [height * constants.CANVAS_ASPECT_RATIO, height];
        } else {
            [w, h] = [width, width / constants.CANVAS_ASPECT_RATIO];
        }
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;

        this.ctx.imageSmoothingEnabled = false;

        this.clear('#008800');
    }

    clear(style: string = '#000000') {
        this.ctx.fillStyle = style;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawSprite(sprite: Sprite, x: number, y: number, w?: number, h?: number) {
        const width = w ?? sprite.width;
        const height = h ?? sprite.height;

        const img = this.spriteSystem.images.get(sprite.image);
        if (img === undefined) {
            this.ctx.fillStyle = sprite.color;
            this.ctx.fillRect(x, y, width, height);
            return;
        }

        this.ctx.drawImage(img, sprite.x0, sprite.y0, sprite.width, sprite.height, x, y, width, height);
    }

    registerRenderGroup(renderGroup: RenderGroup, index?: number) {
        this.renderGroups.splice(index ?? this.renderGroups.length, 0, renderGroup);
    }

    render() {
        this.clear(this.clearColor);

        this.renderGroups.forEach(rg => rg.render(this));
    }
}