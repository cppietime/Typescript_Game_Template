import { State, Trigger } from "../data/inputs.js";
import type { Game } from "../game.js";

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
    game: Game;

    triggerMapping: Map<Trigger, (() => void)[]> = new Map();
    activeStates: Set<State> = new Set();
    currentClick: ClickState = {x: 0, y: 0, down: false, initial: false};
    inputRegions: InputRegion[] = [];
    regionStates: Set<State> = new Set();
    touchListeners: TouchListener[] = [];

    constructor(game: Game) {
        this.game = game;

        this.reset();
    }

    reset() {
        this.triggerMapping.clear();
        this.activeStates.clear();
        this.currentClick.down = false;
        this.inputRegions.length = 0;
        this.regionStates.clear();
        this.touchListeners.length = 0;

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
                this.touchListeners.forEach(listener => listener(this.currentClick));
            });
            this.game.canvas.addEventListener('mouseup', (ev: MouseEvent) => {
                this.currentClick.down = false;
                this.currentClick.initial = false;
                this.updateRegionStates();
            });
            this.game.canvas.addEventListener('mousemove', (ev: MouseEvent) => {
                this.setClickPos(ev.offsetX, ev.offsetY);
                this.currentClick.initial = false;
                this.updateRegionStates();
            });
    }

    setClickPos(screenX: number, screenY: number) {
        const {x, y} = this.game.positionOnCanvas(screenX, screenY);
        this.currentClick.x = x;
        this.currentClick.y = y;
    }

    updateRegionStates() {
        this.regionStates.clear();
        for (const inputRegion of this.inputRegions) {
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


}