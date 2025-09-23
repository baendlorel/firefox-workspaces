export const $NumberToString = Number.prototype.toString;

export const $assign = Object.assign;

export const $isArray = Array.isArray;
export const $ArrayFrom = Array.from;
export const $ArrayPush = Array.prototype.push;
export const $ArrayJoin = Array.prototype.join;
export const $ArrayFind = Array.prototype.find;
export const $ArrayFilter = Array.prototype.filter;

export const $MapSet = Map.prototype.set;
export const $MapGet = Map.prototype.get;
export const $MapHas = Map.prototype.has;
export const $MapValues = Map.prototype.values;

export const $now = Date.now;

export const $rand = Math.random;
export const $floor = Math.floor;
export const $randInt = (max: number) => $floor($rand() * max);

const alphabets = '0123456789abcdefghijklmnopqrstuvwxyz' as const;

export const $genId = () => {
  const digits: string[] = ['kskb_', $NumberToString.call($now())];
  for (let i = 0; i < 16; i++) {
    $ArrayPush.call(digits, alphabets[$randInt(36)]);
  }
  return $ArrayJoin.call(digits, '');
};
