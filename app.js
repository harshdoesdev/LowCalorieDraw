import { ACTIONS, TOOL_TYPE } from "./constants.js";
import Emitter from "./lib/Emitter.js";
import { pointDistance } from "./lib/point-distance.js";
import { debounce } from "./lib/util.js";

const findErasable = (line, x, y) => 
    line.some(point => pointDistance(point.x, point.y, x, y) <= 5);

class Application extends Emitter {

    history = []

    prevLines = null

    lines = []

    currentLine = null

    currentTool = null

    pointer = {
        x: 0,
        y: 0,
        isDown: false
    }
    
    activeToolBtn = null
    
    historyPopBtn = null

    historyPushBtn = null

    handlePointer = ({ type, clientX, clientY }) => {
        if(type === 'pointerup') {
            this.pointer.isDown = false;
            this.emit('@pointerup');
            return;
        }

        if(type === 'pointerdown') {
            this.pointer.isDown = true;
            this.emit('@pointerdown');
        }

        if(!this.pointer.isDown) {
            return;
        }

        this.pointer.x = clientX;
        this.pointer.y = clientY;

        this.emit('@putpoint', this.pointer.x, this.pointer.y);
    }

    handleCtrlZ = () => {
        const line = this.lines.pop();

        if(line) {
            this.history.push(line);

            this.draw();

            this.emit('@history-pop');

            this.emit('@enable-history-push');

            if(!this.lines.length) {
                this.emit('@disable-history-pop');
            }
        }
    }

    handleCtrlY = () => {
        const line = this.history.pop();

        if(line) {
            this.lines.push(line);

            this.draw();

            this.emit('@history-push', this.lines.length);

            this.emit('@enable-history-pop');

            if(!this.history.length) {
                this.emit('@disable-history-push');
            }
        }
    }

    handleKey = ({ type, key, ctrlKey }) => {
        if(!ctrlKey || type !== 'keydown') {
            return;
        }

        if(key !== 'z' && key !== 'y') {
            return;
        }

        if(key === 'z') {
            this.handleCtrlZ();
        } else if(key === 'y') {
            this.handleCtrlY();
        }
    }

    init() {
        this.canvas = document.querySelector('#drawing-area');
        this.ctx = this.canvas.getContext('2d');

        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.draw();
        };

        this.current = [];

        this.history.push(this.current);

        this.on('@putpoint', (x, y) => {
            if(this.currentTool === TOOL_TYPE.ERASER) {
                const line = this.lines.find(line => findErasable(line, x, y));

                if(line) {
                    const index = this.lines.indexOf(line);

                    this.lines.splice(index, 1);

                    this.draw();
                }

                return;
            }

            if(!this.currentLine) {
                this.currentLine = [];

                this.lines.push(this.currentLine);

                this.history = [];
            }
            
            this.currentLine.push({ x, y });

            this.draw();
        });

        this.on('@pointerup', () => {
            this.currentLine = null;
            
            if(this.historyPopBtn.disabled && this.lines.length) {
                this.historyPopBtn.disabled = false;
            }
        });

        resize();
        
        window.addEventListener('resize', debounce(resize, 100));

        this.canvas.addEventListener('pointerdown', this.handlePointer);
        window.addEventListener('pointerup', this.handlePointer);
        this.canvas.addEventListener('pointermove', this.handlePointer);

        window.addEventListener('keydown', this.handleKey);
        window.addEventListener('keyup', this.handleKey);

        this.initUIBtns();
    }

    initUIBtns() {
        this.btns = Array.from(document.querySelectorAll('button[data-action]'));
        
        const handleBtn = (action, payload, btn) => {
            switch(action) {
                case ACTIONS.HISTORY_POP:
                    this.handleCtrlZ();
                break;
                case ACTIONS.HISTORY_PUSH:
                    this.handleCtrlY();
                break;
                case ACTIONS.SET_TOOL: {
                    if(this.currentTool === payload) {
                        return;
                    }

                    this.currentTool = payload;

                    if(this.activeToolBtn) {
                        this.activeToolBtn.classList.remove('active');
                    }

                    btn.classList.add('active');

                    this.activeToolBtn = btn;
                }
                break;
                case ACTIONS.CLEAR:
                    this.clear();
                break;
            }
        };

        this.btns.forEach(btn => {
            const action = btn.getAttribute('data-action');
            const payload = btn.getAttribute('data-payload');

            if(action === ACTIONS.SET_TOOL && payload === TOOL_TYPE.PEN) {
                this.currentTool = TOOL_TYPE.PEN;
                this.activeToolBtn = btn;
                this.activeToolBtn.classList.add('active');
            }

            if(action === ACTIONS.HISTORY_POP) {
                this.historyPopBtn = btn;
                btn.disabled = true;
                this.on('@enable-history-pop', () => {
                    btn.disabled = false;
                });
                this.on('@disable-history-pop', () => {
                    btn.disabled = true;
                })
            } else if(action === ACTIONS.HISTORY_PUSH) {
                this.historyPushBtn = btn;
                btn.disabled = true;
                this.on('@enable-history-push', () => {
                    btn.disabled = false;
                });
                this.on('@disable-history-push', () => {
                    btn.disabled = true;
                });
            }

            btn.addEventListener('click', () => handleBtn(action, payload, btn));
        });
    }

    clear() {
        this.lines = [];
        this.history = [];
        this.draw();
        this.historyPopBtn.disabled = true;
        this.historyPushBtn.disabled = true;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#000000';

        this.lines.forEach(([start, ...points]) => {
            this.ctx.beginPath();
            if(start) {
                this.ctx.moveTo(start.x, start.y);
            }
            points.forEach(point => {
                this.ctx.lineTo(point.x, point.y);
                this.ctx.moveTo(point.x, point.y);
            });
            this.ctx.closePath();
            this.ctx.stroke();
        });
    }
    
}

const app = new Application();

app.init();