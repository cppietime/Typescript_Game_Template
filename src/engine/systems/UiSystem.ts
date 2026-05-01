import type { Game } from "../Game.js";
import {Trigger} from '../../game/data/Inputs.js';

export class UiSystem {
    private readonly game: Game;
    private pauseMenu: HTMLElement | null = null;

    constructor(game: Game) {
        this.game = game;
        this.setupUI();
    }
    
    showMenu(menu: HTMLElement | null, show?: boolean) {
        switch (show) {
            case undefined:
                menu?.classList.toggle('active');
                break;
            case true:
                menu?.classList.add('active');
                menu?.removeAttribute('inert');
                break;
            case false:
                menu?.classList.remove('active');
                menu?.setAttribute('inert', '');
                break;
        }
    }

    pause() {
        this.game.pause(true);
        this.showMenu(this.pauseMenu, true);
    }

    unpause() {
        this.game.pause(false);
        this.showMenu(this.pauseMenu, false);
    }

    setupUI() {
        this.pauseMenu = document.getElementById("pauseMenu") ?? null;
        
        const resumeBtn = document.getElementById("resumeBtn");
        resumeBtn?.addEventListener('click', (ev: PointerEvent) => {
            this.unpause();
            ev.stopPropagation();
        });

        this.game.registerTrigger(Trigger.PAUSE, () => {
            if (this.game.paused) {
                this.unpause();
            } else {
                this.pause();
            }
        });
    }
}