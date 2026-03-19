import * as esbuild from "esbuild";

export const buildNotifyPlugin = (buildName: string) =>
  ({
    name: "raw",
    setup(build) {
      let startTime;
      build.onStart(() => {
        console.log(buildName + ": Build starting...");
        startTime = Date.now();
      });
      build.onEnd(() => {
        console.log(
          buildName + `: Build finished! (${Date.now() - startTime} ms)\n`,
        );
      });
    },
  }) satisfies esbuild.Plugin;
