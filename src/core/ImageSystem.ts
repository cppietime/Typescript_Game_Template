import { ImageSpecs } from "../data/images.js";

export class ImageSystem {
    private readonly images: Map<string, HTMLImageElement>;
    private doneLoading = false;

    constructor() {
        this.images = new Map();
        this.loadImages().then(() => {
            this.doneLoading = true;
        });
    }

    loadImage(name: string, url: string): Promise<void> {
        return new Promise((resolve, err) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                console.log(`Loaded image:${name}`);
                this.images.set(name, img);
                resolve();
            };
            img.onerror = err;
        });
    }

    getImage = (name: string): HTMLImageElement | undefined => this.images.get(name);

    async loadImages() {
        await Promise.all(ImageSpecs.map((spec) => {
            return this.loadImage(spec.name, spec.url);
        }));
    }
}