import { multicast } from "./fp";
import { Vec3 } from "./math/vector.generated";

type Last<Arr extends any[]> = Arr extends [infer Final]
  ? Final
  : Arr extends [infer Head, ...infer Tail]
    ? Last<Tail>
    : never;

type First<Arr extends any[]> = Arr extends [infer Head, ...infer Tail]
  ? Head
  : never;

type WithoutLast<Arr extends any[]> = Arr extends [infer Final]
  ? []
  : Arr extends [infer Head, ...infer Tail]
    ? [Head, WithoutLast<Tail>]
    : never;

type SetTupleItem<Tpl, Index, Chain, NewType> = Tpl extends (infer Elem)[]
  ? Index extends 0
    ? Tpl extends [infer A, ...infer Rest]
      ? [NestedModification<A, Chain, NewType>, ...Rest]
      : (NestedModification<Elem, Chain, NewType> | NewType)[]
    : Index extends 1
      ? Tpl extends [infer A, infer B, ...infer Rest]
        ? [A, NestedModification<B, Chain, NewType>, ...Rest]
        : (Elem | NewType)[]
      : Index extends 2
        ? Tpl extends [infer A, infer B, infer C, ...infer Rest]
          ? [A, B, NestedModification<C, Chain, NewType>, ...Rest]
          : (Elem | NewType)[]
        : Index extends 3
          ? Tpl extends [infer A, infer B, infer C, infer D, ...infer Rest]
            ? [A, B, C, NestedModification<D, Chain, NewType>, ...Rest]
            : (Elem | NewType)[]
          : (NestedModification<Elem, Chain, NewType> | Elem)[]
  : never;

type NestedModification<Obj, Chain, Value> = Chain extends [
  infer K,
  ...infer Kr,
]
  ? Obj extends (infer Elem)[]
    ? [K, number] extends [number, K]
      ? NestedModification<Elem, Kr, Value>[]
      : SetTupleItem<Obj, K, Kr, Value>
    : // : (NestedModification<Elem, Kr, Value> | Elem)[]
      {
        [Key in keyof Obj]: Key extends K
          ? NestedModification<Obj[Key], Kr, Value>
          : Obj[Key];
      }
  : Value;

type NestedModKey = string | number | symbol;

type XRayWithModification<
  InitRoot,
  Root,
  NewAccess,
  Context,
  Chain extends NestedModKey[],
> = XRay<
  InitRoot,
  NestedModification<Root, Chain, NewAccess>,
  NewAccess,
  Context,
  Chain
>;

type XRay<InitRoot, Root, Access, Context, Chain extends NestedModKey[]> =
  // xray methods
  {
    $v: Root;
    $: <T>(
      a: T,
    ) => XRay<InitRoot, NestedModification<Root, Chain, T>, T, Context, Chain>;
    $s: <T>(
      fn: (a: Access, c: Context) => T,
    ) => XRay<InitRoot, NestedModification<Root, Chain, T>, T, Context, Chain>;
    $ctx: <T>(
      fn: (a: Access, s: Context) => T,
    ) => XRay<InitRoot, Root, Access, T, Chain>;
  } &
    // array-specific xray methods
    (Access extends (infer Elem)[]
      ? {
          $ec: (
            fn: (e: Elem, i: number, c: Context) => Elem,
          ) => XRay<
            InitRoot,
            Root,
            Elem,
            [Context, number],
            [...Chain, number]
          >;
          $e: XRay<InitRoot, Root, Elem, number, [...Chain, number]>;
          $i: <N extends number & keyof Access>(
            n: N,
          ) => XRay<InitRoot, Root, Access[N], Context, [...Chain, N]>;
        } & (Context extends any[] | undefined
          ? {
              $en: XRay<
                InitRoot,
                Root,
                Elem,
                [...(Context extends undefined ? [] : Context), number],
                [...Chain, number]
              >;
            }
          : {})
      : {}) &
    // object-specific xray methods
    (Access extends Record<infer K, infer V>
      ? {
          [K in keyof Access]: XRay<
            InitRoot,
            Root,
            Access[K],
            Context,
            [...Chain, K]
          >;
        } & {
          $m: <T extends Record<any, any>>(
            cb: (a: Access) => T,
          ) => XRayWithModification<
            InitRoot,
            Root,
            Omit<Access, keyof T> & T,
            Context,
            Chain
          >;

          $mx: <T extends Record<any, XRay<any, any, any, any, any>>>(
            cb: (t: {
              [K in keyof Access]: XRay<
                Access[K],
                Access[K],
                Access[K],
                Context,
                [...Chain, K]
              >;
            }) => T,
          ) => XRayWithModification<
            InitRoot,
            Root,
            Omit<Access, keyof T> & {
              [K in keyof T]: T[K] extends XRay<any, infer Root, any, any, any>
                ? Root
                : never;
            },
            Context,
            Chain
          >;
        }
      : {});

// const dummy = {
//   a: {
//     b: [2, 3, 4],
//     q: [2, 3, 4] as Vec3,
//   },
//   c: true,
//   fuck: "shit",
// };

// let asd = undefined as unknown as XRay<
//   typeof dummy,
//   typeof dummy,
//   typeof dummy,
//   undefined,
//   []
// >;

// const qwerty = asd.c.$("sdfsdf").$v;

// const querty2 = asd.a.b.$i(2).$(3).$v;

// const querty3 = asd.a.q.$i(1).$("asdf").$v;
/*
xray(oldtab).dark.$i(0).$(v).$v;


*/

export const xray = <A>(a: A): XRay<A, A, A, undefined, []> =>
  xrayInner(a, undefined, (x) => x);

function xrayMulticast(xrs: any[]) {
  return new Proxy(
    {},
    {
      get(target, prop, receiver) {
        const res = xrs.map((x) => x[prop]);

        if (prop === "$en") {
          return xrayMulticast(res);
        }

        if (
          prop === "$" ||
          prop === "$s" ||
          prop === "$ctx" ||
          prop === "$e" ||
          prop === "$ec" ||
          prop === "$i" ||
          prop === "$m" ||
          prop === "$mx"
        ) {
          return (...args) => xrayMulticast(multicast(res)(...args));
        }

        return res;
      },
    },
  );
}

export const xrayInner = <A>(
  a: A,
  ctx: any,
  set: (a: any) => any,
): XRay<A, A, A, undefined, []> =>
  new Proxy(
    {},
    {
      get(target, prop, receiver) {
        if (prop === "$v") {
          return set(a);
        } else if (prop === "$") {
          return (x) => xrayInner(a, ctx, () => set(x));
        } else if (prop === "$s") {
          return (cb) => xrayInner(a, ctx, () => set(cb(a, ctx)));
        } else if (prop === "$ctx") {
          return (cb) => xrayInner(a, cb(a, ctx), set);
        }

        if (Array.isArray(a)) {
          if (prop === "$e") {
            return xrayMulticast(a.map((e, i) => xrayInner(e, i, (x) => x)));
          } else if (prop === "$ec") {
          } else if (prop === "$en") {
            return xrayMulticast(
              a.map((e, i) => xrayInner(e, [...(ctx ?? []), i], (x) => x)),
            );
          } else if (prop === "$i") {
            return (p) =>
              xrayInner(a[p as keyof A], ctx, (x) =>
                set(a.map((e, i) => (i === p ? x : e))),
              );
          }
        } else if (typeof a === "object" && a) {
          if (prop === "$m") {
            return (cb) =>
              xrayInner(a, ctx, () =>
                set({
                  ...a,
                  ...cb(a, ctx),
                }),
              );
          } else if (prop === "$mx") {
          } else {
            return xrayInner(a[prop as keyof A], ctx, (x) =>
              set({
                ...a,
                [prop]: x,
              }),
            );
          }
        }
      },
    },
  ) as XRay<A, A, A, undefined, []>;

// export const xr: <R, A, C, Ch extends NestedModKey[]>() => ((
//   x: XRay<R, A, C, Ch>
// ) => XRay<R, A, C, Ch>) &
//   XRay<R, A, C, Ch> = undefined;

// const id: <T>(t: T) => T = (x) => x;

// const test2 = asd.c.$([4, 5]);

// const test3 = asd.$m((x) => ({
//   fuck: ["penis"],
//   cunt: 3,
// })).$v.cunt;

// const test4 = asd.$mx((o) => ({
//   fuck: o.fuck.$(["penis"]),
//   cunt: xray(3),
// })).$v.fuck;

// const test5 = asd.$f //
//   .fuck((f) => f.$(["penis"])) //
//   .$nf.cunt(() => x(3)).$v; //
