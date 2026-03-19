import { groupBy } from "./array-utils";
import { id } from "./range";
import {
  InterfaceWithMethods,
  WorkerifyInterface,
  WorkerifyResponse,
} from "./workerify";

type ArrayifyMethods<T extends InterfaceWithMethods> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => ReturnType<T[K]>[];
};

type FunctionSerializerInner<
  Args extends any[],
  RetVal,
  SerializedArgs,
  SerializedRetVal,
> = {
  serializeArgs?: (args: Args) => SerializedArgs;
  parseArgs?: (args: SerializedArgs) => Args;
  serializeRetVal?: (args: RetVal) => SerializedRetVal;
  parseRetVal?: (args: SerializedRetVal) => SerializedRetVal;
  transferArgs?: (args: Args) => Transferable[];
  transferRetVal?: (args: RetVal) => Transferable[];
  runMode?: (args: Args) => "worker" | "main";
  estimateInputSize?: (args: Args) => number;
  getRuntimeMetadata?: (args: Args, retval: RetVal) => any;
};

type PerformanceRecord<T extends InterfaceWithMethods> = {
  name: keyof T;
  inputSize: number;
  runtime: number;
  metadata: any;
  thread:
    | {
        type: "main";
      }
    | {
        type: "worker";
        workerId: number;
      };
};

type PerformanceStatisticsRecord = {
  invocationCount: number;
  averageRuntime: number;
  worstCaseRuntime: number;
  bestCaseRuntime: number;
  totalRuntime: number;
};

type InterfacePerformanceStatisticsRecord<T extends InterfaceWithMethods> =
  Record<keyof T, PerformanceStatisticsRecord>;

export function getPerformanceStatistics<T extends InterfaceWithMethods>(
  records: PerformanceRecord<T>[],
): InterfacePerformanceStatisticsRecord<T> {
  return Object.fromEntries(
    Array.from(groupBy(records, (g) => g.name).entries()).map(([name, v]) => {
      const totalRuntime =
        v.reduce((prev, curr) => prev + curr.runtime, 0) / v.length;
      const invocationCount = v.length;
      return [
        name as keyof T,
        {
          totalRuntime,
          invocationCount,
          averageRuntime: totalRuntime / invocationCount,
          worstCaseRuntime: v.reduce(
            (prev, curr) => Math.max(prev, curr.runtime),
            0,
          ),
          bestCaseRuntime: v.reduce(
            (prev, curr) => Math.min(prev, curr.runtime),
            0,
          ),
        } satisfies PerformanceStatisticsRecord,
      ];
    }),
  ) as InterfacePerformanceStatisticsRecord<T>;
}

type SerializerMainThreaedProps =
  | "serializeArgs"
  | "parseRetVal"
  | "transferArgs"
  | "runMode"
  | "estimateInputSize"
  | "getRuntimeMetadata";

type SerializerWorkerThreaedProps =
  | "parseArgs"
  | "serializeRetVal"
  | "transferRetVal";

export type FunctionSerializer<
  Fn extends (...args: any[]) => any | Promise<any>,
> = Fn extends (...args: infer Args) => Promise<infer RetVal>
  ? FunctionSerializerInner<Args, RetVal, any, any>
  : Fn extends (...args: infer Args) => infer RetVal
    ? FunctionSerializerInner<Args, RetVal, any, any>
    : never;

function wrapWithPromise<T>(t: T | Promise<T>): Promise<T> {
  if (t instanceof Promise) {
    return t;
  }
  return Promise.resolve(t);
}

export function createRoundRobinThreadpool<T extends InterfaceWithMethods>(
  src: string,
  workerCount?: number,
  serialization?: {
    [K in keyof T]?: Pick<FunctionSerializer<T[K]>, SerializerMainThreaedProps>;
  },
  t?: T,
): {
  send: WorkerifyInterface<T>;
  sendToThread: (index: number) => WorkerifyInterface<T>;
  broadcast: WorkerifyInterface<ArrayifyMethods<T>>;
  threadCount: number;
  getCurrentPerformanceRecords: () => Promise<PerformanceRecord<T>[]>;
} {
  const count = workerCount ?? navigator.hardwareConcurrency;

  const performanceRecords: Promise<PerformanceRecord<T>>[] = [];

  const workers: Worker[] = [];
  let nextWorker = 0;
  for (let i = 0; i < count; i++) {
    workers.push(new Worker(src));
  }

  function getNextWorker() {
    // const w = workers[nextWorker];
    const workerChoice = nextWorker;
    nextWorker = (nextWorker + 1) % count;
    return workerChoice;
    // return w;
  }

  let id = 0;

  function sendMessageToWorkerWithResponse(
    prop: string | symbol,
    args: any[],
    workerIndex: number,
  ) {
    const worker = workers[workerIndex];

    const serializationInfo = serialization?.[prop as keyof T];

    const startTime = performance.now();
    const shouldRunInMain = serializationInfo?.runMode?.(args) ?? "worker";

    if (shouldRunInMain === "main") {
      if (!t)
        throw new Error(
          "If a threadpool method is to run in the main thread, its interface should be provided to the main thread!",
        );
      const res = t[prop as keyof T](...args);
      performanceRecords.push(
        wrapWithPromise(res).then((retval: any): PerformanceRecord<T> => {
          return {
            name: prop as keyof T,
            inputSize: serializationInfo?.estimateInputSize?.(args) ?? 1,
            runtime: performance.now() - startTime,
            metadata: serializationInfo?.getRuntimeMetadata?.(args, retval),
            thread: { type: "main" },
          };
        }),
      );
      return res;
    }

    const res = new Promise(async (resolve, reject) => {
      const myid = id;
      id++;
      const onResponse = async (e: MessageEvent) => {
        if (e.data.id !== myid) return;
        worker.removeEventListener("message", onResponse);
        const parseRetVal =
          serialization?.[prop as keyof T]?.parseRetVal ?? ((x) => x);
        resolve(await parseRetVal(e.data.returnValue));
      };
      worker.addEventListener("message", onResponse);
      const serializeArgs =
        serialization?.[prop as keyof T]?.serializeArgs ?? ((x) => x);
      worker.postMessage(
        {
          type: prop,
          args: await serializeArgs(args),
          id: myid,
        },
        serialization?.[prop as keyof T]?.transferArgs?.(args) ?? [],
      );
    });

    performanceRecords.push(
      res.then((retval): PerformanceRecord<T> => {
        return {
          name: prop as keyof T,
          inputSize: serializationInfo?.estimateInputSize?.(args) ?? 1,
          runtime: performance.now() - startTime,
          metadata: serializationInfo?.getRuntimeMetadata?.(args, retval),
          thread: { type: "worker", workerId: workerIndex },
        };
      }),
    );

    return res;
  }

  return {
    threadCount: count,

    getCurrentPerformanceRecords() {
      return Promise.all(performanceRecords);
    },

    send: new Proxy({} as T, {
      get(i, prop) {
        return async (...args: any[]) => {
          const nextWorker = getNextWorker();
          return sendMessageToWorkerWithResponse(prop, args, nextWorker);
        };
      },
    }),

    sendToThread: (threadIndex: number) =>
      new Proxy({} as T, {
        get(i, prop) {
          return async (...args: any[]) => {
            return sendMessageToWorkerWithResponse(prop, args, threadIndex);
          };
        },
      }),

    broadcast: new Proxy({} as T, {
      get(i, prop) {
        return async (...args: any[]) => {
          return await Promise.all(
            workers.map((w, i) =>
              sendMessageToWorkerWithResponse(prop, args, i),
            ),
          );
        };
      },
    }),
  };
}

export function createRoundRobinThread<T extends InterfaceWithMethods>(
  t: T,
  serialization?: {
    [K in keyof T]?: Pick<
      FunctionSerializer<T[K]>,
      SerializerWorkerThreaedProps
    >;
  },
) {
  self.addEventListener("message", async (e) => {
    const parseArgs = serialization?.[e.data.type]?.parseArgs ?? id;

    const args = await parseArgs(e.data.args);

    // @ts-expect-error
    const resp = await t[e.data.type](...args);

    const serializeReturnValue =
      serialization?.[e.data.type]?.serializeRetVal ?? id;

    postMessage(
      {
        returnValue: await serializeReturnValue(resp),
        id: e.data.id,
      },
      // @ts-expect-error
      serialization?.[e.data.type]?.transferRetVal?.(resp) ?? [],
    );
  });
}

export function createCombinedRoundRobinThreadpool<
  T extends InterfaceWithMethods,
>(
  getInterface: (isMainThread: boolean) => T,
  src?: string,
  workerCount?: number,
  serialization?: {
    [K in keyof T]?: FunctionSerializer<T[K]>;
  },
): ReturnType<typeof createRoundRobinThreadpool<T>> {
  // @ts-expect-error
  if (self.WorkerGlobalScope) {
    createRoundRobinThread(getInterface(false), serialization);
    return;
  } else {
    return createRoundRobinThreadpool(
      src ?? (document.currentScript as HTMLScriptElement).src,
      workerCount,
      serialization,
      getInterface(true),
    );
  }
}

export async function inMainThread<T>(
  cb: () => T | Promise<T>,
): Promise<T | undefined> {
  // @ts-expect-error
  if (self.WorkerGlobalScope) {
    return;
  }

  return await cb();
}
