import type { OriginRect, Vec2 } from "../../util/geometry.js";
import type { RenderComponent } from "../render/RenderComponent.js";

export interface ComponentMap {
    renderable: RenderComponent<any>,
    rect: OriginRect,
};

export type Entity<K extends keyof ComponentMap> = {
    components: {
        [P in K]: ComponentMap[P]
    }
};