export const $set = Reflect.set;
export const $get = Reflect.get;

export const $NumberToString = Number.prototype.toString;
export const $SubString = String.prototype.substring;

export const $assign = Object.assign;

export const $isArray = Array.isArray;
export const $ArrayFrom = Array.from;
export const $ArrayPush = Array.prototype.push;
export const $ArrayJoin = Array.prototype.join;
export const $ArrayFind = Array.prototype.find;
export const $ArrayFindIndex = Array.prototype.findIndex;
export const $ArrayFilter = Array.prototype.filter;
export const $ArraySplice = Array.prototype.splice;

export const $MapSet = Map.prototype.set;
export const $MapGet = Map.prototype.get;
export const $MapHas = Map.prototype.has;
export const $MapValues = Map.prototype.values;

export const $now = Date.now;

export const $rand = Math.random;
export const $floor = Math.floor;
export const $randInt = (max: number) => $floor($rand() * max);

export const $setTimeout = setTimeout;

export const $JSONParse = JSON.parse;
