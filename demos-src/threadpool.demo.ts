import { range } from "../src/range";
import { createCombinedRoundRobinThreadpool } from "../src/threadpool";

let x = 0;

const threadpool = createCombinedRoundRobinThreadpool(() => ({
  double(x) {
    return x * 2;
  },
  addX(a) {
    return a + x;
  },
  setX(newx) {
    x = newx;
  },
}));

async function main() {
  console.log(
    await Promise.all(range(100).map((d) => threadpool.send.double(d))),
  );

  console.log(await threadpool.broadcast.setX(10));
  console.log(await threadpool.broadcast.addX(5));
  console.log(await threadpool.broadcast.setX(3));
  console.log(await threadpool.broadcast.addX(5));
  console.log(
    await Promise.all(range(100).map((d) => threadpool.send.addX(d))),
  );
}

// @ts-expect-error
if (!self.WorkerGlobalScope) main();
