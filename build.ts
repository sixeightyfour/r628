import * as esbuild from "esbuild";
import { glob } from "glob";
import * as fs from "node:fs/promises";
import { demosPlugin } from "./src-node/esbuild-demos";
import * as path from "node:path";
import { wgslPlugin } from "./src-node/esbuild-wgsl-plugin";
import { rawQueryParamPlugin } from "./src-node/esbuild-raw-query-param";
import copy from "esbuild-plugin-copy";
import chokidar from "chokidar";
import { buildNotifyPlugin } from "./src-node/esbuild-build-notify";
import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";

const whatToBuild = process.argv[2];

chokidar
  // watch for lib files
  .watch(["src/**/*.ts", "src/**/*.tsx"], {
    ignored: ["src/index.ts"],
  })
  .on("all", async (evt, pathname) => {
    // regenerate codegen
    const filename = path.basename(pathname);
    const relpath = path.relative(process.cwd(), pathname);
    if (filename.endsWith(".codegen.ts")) {
      console.log("Running codegen for", relpath);
      const output = await Bun.spawn(["bun", "run", pathname]);
      if (output.exitCode === 0) {
        console.log("Done running codegen for", relpath);
      } else {
        console.log("Failed to run codegen for", relpath);
      }
    }

    console.log("Getting all library file names...");
    // get all library files
    const libFiles = [
      ...(await glob("src/**/*.ts")),
      ...(await glob("src/**/*.tsx")),
    ].filter((f) => !f.endsWith(".codegen.ts"));

    // regenerate index
    console.log("Regenerating index.ts...");
    await fs.writeFile(
      "src/index.ts",
      libFiles.map((e) => `export * from "./${path.relative("src", e)}"\n`),
    );
    console.log("Done regenerating index.ts!");
  });

if (whatToBuild === "lib") {
  // build r628 library
  const buildLib = await esbuild.context({
    entryPoints: ["src/index.ts"],
    outdir: "js-src",
    minify: false,
    bundle: false,
    format: "esm",
    plugins: [rawQueryParamPlugin, buildNotifyPlugin("LIB")],
  });

  // build node-specific r628 node libraries
  const buildNode = await esbuild.context({
    entryPoints: ["src-node/**/*.ts"],
    outdir: "js-src-node",
    minify: false,
    bundle: true,
    platform: "node",
    external: ["esbuild"],
    format: "esm",
    plugins: [
      rawQueryParamPlugin,
      copy({
        resolveFrom: "cwd",
        assets: {
          from: ["./assets/*"],
          to: ["./demos-build/assets"],
        },
      }),
      buildNotifyPlugin("LIBNODE"),
    ],
  });

  await Promise.all([buildNode.watch(), buildLib.watch()]);
} else if (whatToBuild === "demos") {
  const clients: Set<WebSocket> = new Set();

  const server = express();
  server.use("/demos-build", express.static("demos-build"));

  const serverWs = expressWs(server);

  serverWs.app.ws("/changes", (ws, req) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  const PORT = 5501;

  server.listen(5501, "r628.localhost");

  console.log(
    `Dev server up and running! Check out http://r628.localhost${PORT}/demos-build/webgpu/graph-renderer.html`,
  );

  const autoReloadPlugin: esbuild.Plugin = {
    name: "autoReload",
    setup(build) {
      build.onEnd(() => {
        for (const client of clients) {
          client.send({ type: "reload" });
        }
      });
    },
  };

  const demosWithAutoReload = demosPlugin({
    template(name) {
      return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" /> 
  </head>
  <body>
    <script>
      if (window.location.hostname === "r628.localhost") {
        const socket = new WebSocket("ws://r628.localhost:${PORT}/changes");
        socket.addEventListener("message", () => {
          window.location.reload();
        });
      }
    </script>
    <script src="${name.split("/").at(-1)!}"></script>
  </body>
</html>`;
    },
  });

  // build r628 demos
  const buildDemos = await esbuild.context({
    entryPoints: ["demos-src/**/*.demo.*"],
    outdir: "demos-build",
    minify: false,
    bundle: true,
    format: "iife",
    plugins: [
      demosWithAutoReload,
      wgslPlugin(),
      rawQueryParamPlugin,
      buildNotifyPlugin("DEMOS"),
      autoReloadPlugin,
    ],
  });

  await buildDemos.watch();
} else {
  console.error("Specify 'lib' or 'demos'.");
  process.exit(1);
}
