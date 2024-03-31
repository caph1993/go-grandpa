// Wrapper for wgo board

//@ts-ignore
export const WGo = window["WGo"] as any;

WGo.DIR = "/public";


export class MyBoard {
  board: any;
  constructor(container: HTMLElement, options: any) {
    this.board = new WGo.Board(container, options);
    // this.board.addCustomObject(numberIndicator);
    // Custom layers
    this.board.localCursorLayer = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.localCursorLayer, 308);
    this.board.remoteCursorLayer = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.remoteCursorLayer, 309);
    this.board.numberLayer = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.numberLayer, 304);

    // Bug: numbers hide neighbors when placed on the same layer
    this.board.numberLayer00 = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.numberLayer00, 304);
    this.board.numberLayer01 = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.numberLayer01, 304);
    this.board.numberLayer10 = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.numberLayer10, 304);
    this.board.numberLayer11 = new WGo.Board.CanvasLayer();
    this.board.addLayer(this.board.numberLayer11, 304);

  }
  getX(x: number): number { return this.board.getX(x); }
  getY(x: number): number { return this.board.getY(x); }
  get stoneRadius(): number { return this.board.stoneRadius; }
  get obj_arr() { return this.board.obj_arr; }
  get font() { return this.board.font; }
  get size() { return this.board.size; }
  addObject(obj: any) { this.board.addObject(obj); }
  removeObject(obj: any) { this.board.removeObject(obj); }
  addCustomObject(obj: any) { this.board.addCustomObject(obj); }
  removeCustomObject(obj: any) { this.board.removeCustomObject(obj); }
  addEventListener(type: string, callback: any, more: any = undefined) { this.board.addEventListener(type, callback, more); }
  removeEventListener(type: string, callback: any) { this.board.removeEventListener(type, callback); }
  removeAllObjects() { this.board.removeAllObjects(); }
  removeObjectsAt(x: number, y: number) { this.board.removeObjectsAt(x, y); }

  get left() { return this.board.left; }
  get top() { return this.board.top; }
  get fieldWidth() { return this.board.fieldWidth; }
  get fieldHeight() { return this.board.fieldHeight; }
  get pixelRatio() { return this.board.pixelRatio; }

  getMousePos(offsetX: number, offsetY: number) {
    // new hopefully better translation of coordinates
    var x, y;
    x = offsetX * this.pixelRatio;
    x -= this.left;
    x /= this.fieldWidth;
    x = Math.round(x);
    y = offsetY * this.pixelRatio;
    y -= this.top;
    y /= this.fieldHeight;
    y = Math.round(y);
    return {
      x: x >= this.size ? -1 : x,
      y: y >= this.size ? -1 : y,
    };
  }

}





export const numberSymbol = (() => {
  function draw({ x, y, customType }: { x: number, y: number, customType: string }, board: any) {
    let xr = board.getX(x), // get absolute x coordinate of intersection
      yr = board.getY(y), // get absolute y coordinate of intersection
      sr = board.stoneRadius; // get field radius in px

    //@ts-ignore
    let _this = this as any as CanvasRenderingContext2D;
    if (x < 0 || y < 0 || x >= board.size || y >= board.size) return;
    if (board.obj_arr[x][y][0].c == WGo.B) _this.strokeStyle = "rgba(255,255,255,0.9)";
    else _this.strokeStyle = "rgba(0,0,0,0.9)";

    const n = parseInt(customType);
    const text = n.toString();
    const font = board.font;
    if (text.length == 1) _this.font = Math.round(sr * 1.5) + "px " + font;
    else if (text.length == 2) _this.font = Math.round(sr * 1.2) + "px " + font;
    else _this.font = Math.round(sr) + "px " + font;

    _this.beginPath();
    _this.textBaseline = "middle";
    _this.textAlign = "center";
    _this.fillText(text, xr, yr, 2 * sr);
    _this.fillStyle = _this.strokeStyle;
  }
  return {
    numberLayer: { draw },
  }
})()

export const cursorSymbol = {
  _some_layer: {
    // draw function is called in context of CanvasRenderingContext2D, so we can paint immediately using this
    draw: function ({ x, y, color }: { x: number, y: number, color?: string }, board: any) {
      let xr = board.getX(x), // get absolute x coordinate of intersection
        yr = board.getY(y), // get absolute y coordinate of intersection
        sr = board.stoneRadius; // get field radius in px

      let _this = this as any as CanvasRenderingContext2D;
      if (x < 0 || y < 0 || x >= board.size || y >= board.size) return;
      if (!color) color = (board.obj_arr[x][y][0].c == WGo.B) ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
      // if there is a black stone, draw white plane
      _this.lineWidth = 3;
      _this.fillStyle = color;
      _this.beginPath();
      _this.arc(xr, yr, 0.25 * Math.max(0, sr - _this.lineWidth), 0, 2 * Math.PI, true);
      _this.fill();
    }
  },
}


export class Cursor {
  color: string;
  board: MyBoard;
  boardObj: { x: number; y: number; type: any, color: string, isInside: boolean };
  private __update: (x: number, y: number) => void;

  constructor(color: string, board: MyBoard, layer: 'local' | 'remote' = 'local') {
    const symbol = (layer === 'local') ?
      { localCursorLayer: cursorSymbol._some_layer } :
      { remoteCursorLayer: cursorSymbol._some_layer };

    this.boardObj = { x: -1, y: -1, type: symbol, color: color, isInside: false };
    this.color = color;
    this.board = board;
    const self = this;
    function _update(x: number, y: number) {
      if (self.boardObj.isInside) self.board.removeObject(self.boardObj);
      const newObj = { ...self.boardObj, x, y };
      newObj.isInside = (0 <= x && x < self.board.size && 0 <= y && y < self.board.size);
      self.boardObj = newObj;
      if (self.boardObj.isInside) self.board.addObject(self.boardObj);
    }
    this.__update = debounce(_update, 100, { immediate: true, interval: 100 });
  }
  update(x: number, y: number) {
    if (this.boardObj.x === x && this.boardObj.y === y) return;
    this.__update(x, y);
  }
}


function debounce<T extends (...any: any) => any>(func: T, delay: number, { immediate = false, interval = 1e30 } = {}) {
  let awaiting = false;
  let last_params, deadline_A: number, deadline_B = 1e30;
  async function deadlineSleep() {
    while (true) {
      if (deadline_B + delay < Date.now()) deadline_B = 1e30;
      let ms = Math.min(deadline_A, deadline_B) - Date.now();
      if (ms <= 0) return;
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  async function wrapper(...args: any) {
    //@ts-ignore
    last_params = { arg0: this, args };
    deadline_A = Date.now() + delay;
    if (awaiting) return;
    awaiting = true;
    if (!immediate) await deadlineSleep();
    while (last_params) {
      const { arg0, args } = last_params;
      last_params = null;
      deadline_B = Date.now() + interval;
      try { await func.apply(arg0, args); }
      catch (e) { console.error(e); }
      await deadlineSleep();
    }
    awaiting = false;
  };
  return wrapper as T;
}