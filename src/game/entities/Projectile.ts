import { type CollisionComponent, type CollisionEntity, createCollisionSet } from "../../engine/components/Collision.js";
import { type OriginComponent, type SizeEntity, type VelocityEntity } from "../../engine/components/Physical.js";
import { type RenderComponent, type RenderEntity } from "../../engine/components/RenderComponent.js";
import { type TickComponent, type TickEntity } from "../../engine/components/Tick.js";
import { type Entity, entityHas } from "../../engine/entity/Entity.js";
import { UNASSIGNED } from "../../engine/entity/Uuid.js";
import { Game } from "../../engine/Game.js";
import type { RenderSystem } from "../../engine/systems/RenderSystem.js";
import { createOriginRect, createVec2, type Vec2 } from "../../engine/util/Geometry.js";

export type ProjectileComponent = {
    timeToLive: number | undefined
};
type WithProjectile = {projectile: ProjectileComponent};
export type ProjectileEntity = RenderEntity & TickEntity & CollisionEntity & VelocityEntity & SizeEntity & Entity<WithProjectile>;
export const hasProjectile = (entity: Entity<any>): entity is ProjectileEntity => entityHas<ProjectileEntity>(entity, ["projectile"]);

export const ProjectileModule = {
    create(
        game: Game,
        render: RenderComponent,
        origin: OriginComponent,
        tick?: TickComponent,
        collision?: CollisionComponent,
        velocity?: Vec2,
        size?: Vec2,
        timeToLive?: number,
    ) {
        if (collision === undefined && size !== undefined) {
            collision = {
                collisionSets: [createCollisionSet({
                    rects: [createOriginRect({origin: createVec2({}), size: size})]
                })]
            };
        }
        const projectile: ProjectileEntity = {
            game: game,
            components: {
                renderable: render,
                origin,
                tick: (game, data) => ProjectileModule.projectileTick(game, data, tick),
                collision: collision ?? {collisionSets: []},
                velocity: velocity ?? createVec2({}),
                size: size ?? createVec2({}),
                projectile: {timeToLive}
            },
            uuid: UNASSIGNED,
            isAlive: true,
        };
        return projectile;
    },

    projectileTick: (game: Game, data: Entity<any>, tick: TickComponent | undefined) => {
        if (!hasProjectile(data)) {
            return;
        }
        const projectile = data.components.projectile;
        if (projectile.timeToLive !== undefined) {
            projectile.timeToLive -= game.deltaTime;
            if (projectile.timeToLive <= 0) {
                game.destroyEntity(data.uuid);
            }
        }
        tick?.(game, data);
    },
};
