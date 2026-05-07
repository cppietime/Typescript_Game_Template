import { Entity, entityHas } from "../entity/Entity.js";
import { Game } from "../Game.js";

export enum LifecycleEvent {
    CREATE = "CREATE",
    DESTROY = "DESTROY",
};

export type LifecycleFn = (data: LifecycleEntity, event: LifecycleEvent) => void;

export type LifecycleComponent = {
    onCreate: LifecycleFn,
    onDestroy: LifecycleFn,
};
type WithLifecycle = {lifecycle: LifecycleComponent};
export type LifecycleEntity = Entity<WithLifecycle>;
export const hasLifecycle = (entity: Entity<any>): entity is LifecycleEntity => entityHas<LifecycleEntity>(entity, ["lifecycle"]);
