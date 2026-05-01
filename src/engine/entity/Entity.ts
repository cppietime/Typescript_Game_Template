import type { Game } from "../Game.js";
import type { CleanupFn } from "../entity/Uuid.js";

export type Entity<C extends Record<string, any>> = {
    game: Game,
    uuid: number,
    isAlive: boolean,
    cleanup?: CleanupFn | undefined,
    components: C,
};

export type PreEntity = Omit<Entity<any>, "game" | "uuid" | "isAlive">;

type ComponentKeys<T extends Entity<any>> = T extends Entity<infer C> ? keyof C : never;

export type With<T, K extends string> = {[name in K]: T};

export const entityHas = <T extends Entity<any>>(entity: Entity<any>, keys: ComponentKeys<T>[]): entity is Entity<T> => {
    return keys.every(k => k in entity.components);
}
