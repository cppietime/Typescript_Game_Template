import type { Game } from "../../game.js";
import type { OriginRect, Vec2 } from "../../util/Geometry.js";
import type { CollisionComponent } from "../physics/Collision.js";
import type { RenderComponent } from "../render/RenderComponent.js";
import type { CleanupFn, UuidComponent } from "./Uuid.js";

export type Entity<C extends Record<string, any>> = {
    game: Game,
    uuid: number,
    isAlive: boolean,
    cleanup?: CleanupFn | undefined,
    components: C,
};

type ComponentKeys<T extends Entity<any>> = T extends Entity<infer C> ? keyof C : never;

export type With<T, K extends string> = {[name in K]: T};

export const entityHas = <T extends Entity<any>>(entity: Entity<any>, keys: ComponentKeys<T>[]): entity is Entity<T> => {
    return keys.every(k => k in entity.components);
}
