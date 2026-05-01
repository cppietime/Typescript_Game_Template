import type { TlRect } from "../../util/Geometry.js";

export type Sprite = {
    image: string;
    source: TlRect;
    color: string;
};

export type ImageSpec = {
    name: string;
    url: string;
};
