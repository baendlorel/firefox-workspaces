type IsSameType<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type KeysInBoth<A, B> = keyof A & keyof B;
type KeysOnlyInA<A, B> = Exclude<keyof A, keyof B>;
type KeysOnlyInB<A, B> = Exclude<keyof B, keyof A>;
type Merge<A, B> = {
  [K in KeysInBoth<A, B>]: A[K] extends B[K]
    ? B[K] extends A[K]
      ? A[K]
      : A[K] | B[K]
    : A[K] | B[K];
} & {
  [K in KeysOnlyInA<A, B>]?: A[K];
} & {
  [K in KeysOnlyInB<A, B>]?: B[K];
};

type PickUnderscore<T> = {
  [K in keyof T as K extends `_${string}` ? K : never]: T[K];
};

type PickNonUnderscore<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

type StripUnderscoreKeys<T> = {
  [K in keyof T as K extends `_${infer Rest}` ? Rest : K]: T[K];
};
