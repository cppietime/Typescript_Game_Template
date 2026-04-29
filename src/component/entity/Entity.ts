import type { Game } from "../../game.js";
import type { OriginRect, Vec2 } from "../../util/Geometry.js";
import type { CollisionComponent } from "../physics/Collision.js";
import type { RenderComponent } from "../render/RenderComponent.js";
import type { CleanupFn, UuidComponent } from "./Uuid.js";

export type UpdateComponent<T extends Entity<"update">> = (game: Game, data: T) => void;

export type ExtraComponent = any;

export interface ComponentMap {
    renderable: RenderComponent,
    rect: OriginRect,
    velocity: Vec2,
    update: UpdateComponent<Entity<any>>,
    extra: ExtraComponent,
    collision: CollisionComponent,
};

export type Entity<K extends keyof ComponentMap> = {
    game: Game,
    uuid: number,
    isAlive: boolean,
    cleanup?: CleanupFn | undefined,
    components: {
        [P in K]: ComponentMap[P]
    }
};

export const entityHas = <K extends keyof ComponentMap>(entity: Entity<never>, key: K): entity is Entity<K> => {
    return key in entity.components;
}
