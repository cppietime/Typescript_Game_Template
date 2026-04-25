import { ImageSpecs } from "../data/images.js";

export class ImageSystem {
    images: Map<string, HTMLImageElement>;
    doneLoading = false;

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

    async loadImages() {
        await Promise.all(ImageSpecs.map((spec) => {
            return this.loadImage(spec.name, spec.url);
        }));
    }
}