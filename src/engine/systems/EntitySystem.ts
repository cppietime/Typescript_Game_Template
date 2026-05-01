import { type Entity } from "../entity/Entity.js";

export type EntitySystemPredicate = (entity: Entity<any>) => boolean;
export type AddEntityFn = (entity: Entity<any>) => void;
export type RemoveEntityFn = (uuid: number) => void;
export type ContainsEntityFn = (uuid: number) => boolean;

export type EntitySystem = {
    predicate: EntitySystemPredicate,
    addEntity: AddEntityFn,
    removeEntity: RemoveEntityFn,
    containsEntity: ContainsEntityFn,
};
