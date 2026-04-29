import type {Game} from "../../game.js";
import { type Entity, entityHas } from "../entity/Entity.js";

export type TickComponent = (game: Game, data: TickEntity) => void;
type WithTick = {tick: TickComponent};
export type TickEntity = Entity<WithTick>;
export const hasTick = (entity: Entity<any>): entity is TickEntity => entityHas<TickEntity>(entity, ["tick"]);