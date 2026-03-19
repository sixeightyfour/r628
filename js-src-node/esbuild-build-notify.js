// src-node/esbuild-build-notify.ts
var buildNotifyPlugin = (buildName) => ({
  name: "raw",
  setup(build) {
    let startTime;
    build.onStart(() => {
      console.log(buildName + ": Build starting...");
      startTime = Date.now();
    });
    build.onEnd(() => {
      console.log(
        buildName + `: Build finished! (${Date.now() - startTime} ms)
`
      );
    });
  }
});
export {
  buildNotifyPlugin
};
