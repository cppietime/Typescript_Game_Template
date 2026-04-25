export class RenderSystem {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = this.canvas.getContext('2d')!;
    }

    clear(style: string = '#000000') {
        this.ctx.fillStyle = style;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}