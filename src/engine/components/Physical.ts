import type { Vec2 } from "../util/Geometry.js";
import { createFactory } from "../util/Typing.js";
import { entityHas, type Entity, type With } from "../entity/Entity.js";

export type OriginComponent = {
    origin: Vec2,
    inWorld: boolean,
};
type WithOrigin = With<OriginComponent, "origin">;
export type OriginEntity = Entity<WithOrigin>;
export const hasOrigin = (entity: Entity<any>): entity is OriginEntity => entityHas<OriginEntity>(entity, ["origin"]);
export const createOriginComponent = createFactory<OriginComponent, 'inWorld'>({inWorld: true});

type WithSize = With<Vec2, "size">;
export type SizeEntity = Entity<WithSize>;
export const hasSize = (entity: Entity<any>): entity is SizeEntity => entityHas<SizeEntity>(entity, ["size"]);

type WithVelocity = With<Vec2, "velocity">;
export type VelocityEntity = Entity<WithVelocity>;
export const hasVelocity = (entity: Entity<any>): entity is VelocityEntity => entityHas<VelocityEntity>(entity, ["velocity"]);
