import type { OriginRect, Vec2 } from "../../util/Geometry.js";
import { entityHas, type Entity, type With } from "../entity/Entity.js";

type WithOrigin = With<Vec2, "origin">;
export type OriginEntity = Entity<WithOrigin>;
export const hasOrigin = (entity: Entity<any>): entity is OriginEntity => entityHas<OriginEntity>(entity, ["origin"]);

type WithSize = With<Vec2, "size">;
export type SizeEntity = Entity<WithSize>;
export const hasSize = (entity: Entity<any>): entity is SizeEntity => entityHas<SizeEntity>(entity, ["size"]);

type WithVelocity = With<Vec2, "velocity">;
export type VelocityEntity = Entity<WithVelocity>;
export const hasVelocity = (entity: Entity<any>): entity is VelocityEntity => entityHas<VelocityEntity>(entity, ["velocity"]);
