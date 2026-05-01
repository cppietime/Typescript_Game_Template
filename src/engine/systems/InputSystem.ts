import { State, Trigger } from "../../game/data/Inputs.js";
import {TouchType} from "../../engine/data/types/Inputs.js";
import type { Game } from "../../Game.js";
import { createOriginRect, createVec2 } from "../util/Geometry.js";
import { IdMap } from "../util/IdMap.js";
import type { SapEdge, SapHandle } from "./PhysicsSystem.js";

export type InputRegion = {
    predicate: (click: ClickState, regionStates: Set<State>) => boolean
};

export type TouchListener = (click: ClickState) => void;

export type ClickState = {
    x: number,
    y: number,
    down: boolean,
    initial: boolean,
};

export class InputSystem {
    private readonly game: Game;
    private readonly triggerMapping: Map<Trigger, (() => void)[]> = new Map();
    private readonly activeStates: Set<State> = new Set();
    private readonly currentClick: ClickState = {x: 0, y: 0, down: false, initial: false};
    private readonly regionStates: Set<State> = new Set();
    private readonly edgesX: SapEdge[] = [];
    private readonly edgesY: SapEdge[] = [];
    private readonly handles: SapHandle[] = [];
    
    inputRegions: IdMap<InputRegion> = new IdMap();
    touchListeners: IdMap<TouchListener> = new IdMap();

    constructor(game: Game) {
        this.game = game;

        this.reset();
    }

    reset() {
        this.triggerMapping.clear();
        this.activeStates.clear();
        this.currentClick.down = false;
        this.inputRegions.clear()
        this.regionStates.clear();
        this.touchListeners.clear()

        for (const key of Object.keys(Trigger) as (keyof typeof Trigger)[]) {
            const input = Trigger[key];
            this.triggerMapping.set(input, []);
        }

        this.setupInputs();
    }

    triggerInput(input: Trigger) {
        this.triggerMapping.get(input)?.forEach(cb => cb());
    }

    setState(state: State, status: boolean) {
        if (status) {
            this.activeStates.add(state);
        } else {
            this.activeStates.delete(state);
        }
    }

    queueRegion(state: State) {
        this.regionStates.add(state);
    }

    setupInputs() {
            // Keyboard inputs
            window.addEventListener('keydown', (ev: KeyboardEvent) => {
                switch (ev.key.toLowerCase()) {
                    case 'escape':
                        this.triggerInput(Trigger.PAUSE);
                        break;
                    
                    case 'w':
                    case 'arrowup':
                        this.setState(State.UP, true);
                        break;
                    case 'a':
                    case 'arrowleft':
                        this.setState(State.LEFT, true);
                        break;
                    case 's':
                    case 'arrowdown':
                        this.setState(State.DOWN, true);
                        break;
                    case 'd':
                    case 'arrowright':
                        this.setState(State.RIGHT, true);
                        break;
                }
            });

            window.addEventListener('keyup', (ev: KeyboardEvent) => {
                switch (ev.key.toLowerCase()) {
                    case 'w':
                    case 'arrowup':
                        this.setState(State.UP, false);
                        break;
                    case 'a':
                    case 'arrowleft':
                        this.setState(State.LEFT, false);
                        break;
                    case 's':
                    case 'arrowdown':
                        this.setState(State.DOWN, false);
                        break;
                    case 'd':
                    case 'arrowright':
                        this.setState(State.RIGHT, false);
                        break;
                }
            });

            // Mouse/touch inputs
            this.game.canvas.addEventListener('mousedown', (ev: MouseEvent) => {
                this.setClickPos(ev.offsetX, ev.offsetY);
                this.currentClick.down = true;
                this.currentClick.initial = true;
                this.updateRegionStates();
                for (const listener of this.touchListeners.values()) {
                    listener(this.currentClick);
                }
                this.game.physicsSystem.fireInputEvents(this.game, TouchType.BEGIN, createOriginRect({
                    origin: this.game.renderSystem.positionOnCanvas(createVec2({x: ev.offsetX, y: ev.offsetY})),
                    size: createVec2({}),
                }));
            });
            this.game.canvas.addEventListener('mouseup', (ev: MouseEvent) => {
                this.currentClick.down = false;
                this.currentClick.initial = false;
                this.updateRegionStates();
                this.game.physicsSystem.fireInputEvents(this.game, TouchType.END, createOriginRect({
                    origin: this.game.renderSystem.positionOnCanvas(createVec2({x: ev.offsetX, y: ev.offsetY})),
                    size: createVec2({}),
                }));
            });
            this.game.canvas.addEventListener('mousemove', (ev: MouseEvent) => {
                this.setClickPos(ev.offsetX, ev.offsetY);
                this.currentClick.initial = false;
                this.updateRegionStates();
                this.game.physicsSystem.fireInputEvents(this.game, TouchType.MOVE, createOriginRect({
                    origin: this.game.renderSystem.positionOnCanvas(createVec2({x: ev.offsetX, y: ev.offsetY})),
                    size: createVec2({}),
                }));
            });
    }

    fireTouchEvent() {
        if (this.currentClick.down) {
            this.game.physicsSystem.fireInputEvents(this.game, TouchType.TOUCHING, createOriginRect({
                origin: createVec2({...this.currentClick}),
                size: createVec2({}),
            }));
        }
    }

    setClickPos(screenX: number, screenY: number) {
        const {x, y} = this.game.positionOnCanvas(screenX, screenY);
        this.currentClick.x = x;
        this.currentClick.y = y;
    }

    updateRegionStates() {
        this.regionStates.clear();
        for (const inputRegion of this.inputRegions.values()) {
            if (inputRegion.predicate(this.currentClick, this.regionStates)) {
                return;
            }
        }
    }

    onInterrupt() {
        // Call this when UI pops up to reset click status
        this.currentClick.down = false;
        this.updateRegionStates();
    }

    registerTrigger(input: Trigger, callback: () => void) {
        this.triggerMapping.get(input)?.push(callback);
    }

    isPressed(state: State): boolean {
        return this.activeStates.has(state) || this.regionStates.has(state);
    }

    clearRegions() {
        this.regionStates.clear();
    }


}