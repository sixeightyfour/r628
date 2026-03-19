(() => {
  // src/range.ts
  function range(hi) {
    let arr = [];
    for (let i = 0; i < hi && i < 1e7; i++) {
      arr.push(i);
    }
    return arr;
  }
  function id(x2) {
    return x2;
  }

  // src/threadpool.ts
  function wrapWithPromise(t) {
    if (t instanceof Promise) {
      return t;
    }
    return Promise.resolve(t);
  }
  function createRoundRobinThreadpool(src, workerCount, serialization, t) {
    const count = workerCount ?? navigator.hardwareConcurrency;
    const performanceRecords = [];
    const workers = [];
    let nextWorker = 0;
    for (let i = 0; i < count; i++) {
      workers.push(new Worker(src));
    }
    function getNextWorker() {
      const workerChoice = nextWorker;
      nextWorker = (nextWorker + 1) % count;
      return workerChoice;
    }
    let id2 = 0;
    function sendMessageToWorkerWithResponse(prop, args, workerIndex) {
      const worker = workers[workerIndex];
      const serializationInfo = serialization?.[prop];
      const startTime = performance.now();
      const shouldRunInMain = serializationInfo?.runMode?.(args) ?? "worker";
      if (shouldRunInMain === "main") {
        if (!t)
          throw new Error(
            "If a threadpool method is to run in the main thread, its interface should be provided to the main thread!"
          );
        const res2 = t[prop](...args);
        performanceRecords.push(
          wrapWithPromise(res2).then((retval) => {
            return {
              name: prop,
              inputSize: serializationInfo?.estimateInputSize?.(args) ?? 1,
              runtime: performance.now() - startTime,
              metadata: serializationInfo?.getRuntimeMetadata?.(args, retval),
              thread: { type: "main" }
            };
          })
        );
        return res2;
      }
      const res = new Promise(async (resolve, reject) => {
        const myid = id2;
        id2++;
        const onResponse = async (e) => {
          if (e.data.id !== myid) return;
          worker.removeEventListener("message", onResponse);
          const parseRetVal = serialization?.[prop]?.parseRetVal ?? ((x2) => x2);
          resolve(await parseRetVal(e.data.returnValue));
        };
        worker.addEventListener("message", onResponse);
        const serializeArgs = serialization?.[prop]?.serializeArgs ?? ((x2) => x2);
        worker.postMessage(
          {
            type: prop,
            args: await serializeArgs(args),
            id: myid
          },
          serialization?.[prop]?.transferArgs?.(args) ?? []
        );
      });
      performanceRecords.push(
        res.then((retval) => {
          return {
            name: prop,
            inputSize: serializationInfo?.estimateInputSize?.(args) ?? 1,
            runtime: performance.now() - startTime,
            metadata: serializationInfo?.getRuntimeMetadata?.(args, retval),
            thread: { type: "worker", workerId: workerIndex }
          };
        })
      );
      return res;
    }
    return {
      threadCount: count,
      getCurrentPerformanceRecords() {
        return Promise.all(performanceRecords);
      },
      send: new Proxy({}, {
        get(i, prop) {
          return async (...args) => {
            const nextWorker2 = getNextWorker();
            return sendMessageToWorkerWithResponse(prop, args, nextWorker2);
          };
        }
      }),
      sendToThread: (threadIndex) => new Proxy({}, {
        get(i, prop) {
          return async (...args) => {
            return sendMessageToWorkerWithResponse(prop, args, threadIndex);
          };
        }
      }),
      broadcast: new Proxy({}, {
        get(i, prop) {
          return async (...args) => {
            return await Promise.all(
              workers.map(
                (w, i2) => sendMessageToWorkerWithResponse(prop, args, i2)
              )
            );
          };
        }
      })
    };
  }
  function createRoundRobinThread(t, serialization) {
    self.addEventListener("message", async (e) => {
      const parseArgs = serialization?.[e.data.type]?.parseArgs ?? id;
      const args = await parseArgs(e.data.args);
      const resp = await t[e.data.type](...args);
      const serializeReturnValue = serialization?.[e.data.type]?.serializeRetVal ?? id;
      postMessage(
        {
          returnValue: await serializeReturnValue(resp),
          id: e.data.id
        },
        // @ts-expect-error
        serialization?.[e.data.type]?.transferRetVal?.(resp) ?? []
      );
    });
  }
  function createCombinedRoundRobinThreadpool(getInterface, src, workerCount, serialization) {
    if (self.WorkerGlobalScope) {
      createRoundRobinThread(getInterface(false), serialization);
      return;
    } else {
      return createRoundRobinThreadpool(
        src ?? document.currentScript.src,
        workerCount,
        serialization,
        getInterface(true)
      );
    }
  }

  // demos-src/threadpool.demo.ts
  var x = 0;
  var threadpool = createCombinedRoundRobinThreadpool(() => ({
    double(x2) {
      return x2 * 2;
    },
    addX(a) {
      return a + x;
    },
    setX(newx) {
      x = newx;
    }
  }));
  async function main() {
    console.log(
      await Promise.all(range(100).map((d) => threadpool.send.double(d)))
    );
    console.log(await threadpool.broadcast.setX(10));
    console.log(await threadpool.broadcast.addX(5));
    console.log(await threadpool.broadcast.setX(3));
    console.log(await threadpool.broadcast.addX(5));
    console.log(
      await Promise.all(range(100).map((d) => threadpool.send.addX(d)))
    );
  }
  if (!self.WorkerGlobalScope) main();
})();
