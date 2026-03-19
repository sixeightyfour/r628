import {
  Mat2,
  Mat3,
  Mat4,
  Vec1,
  Vec2,
  Vec3,
  Vec4,
} from "../math/vector.generated";
import { BufferWithLayout, GL } from "./buffer";

export type Drawable = {
  draw(): void;
  gl(): WebGL2RenderingContext;
};

export type Disposable = {
  dispose(): void;
};

export type Uniformed = {
  uniforms(): Uniforms;
  resetUniforms(uniforms: Uniforms): void;
  updateUniforms(uniforms: Uniforms): void;
};

type Object3D = Drawable & Uniformed;

type UniformSpec =
  | ["float", number]
  | ["vec2", Vec2]
  | ["vec3", Vec3]
  | ["vec4", Vec4]
  | ["int", number]
  | ["ivec2", Vec2]
  | ["ivec3", Vec3]
  | ["ivec4", Vec4]
  | ["mat2", Mat2]
  | ["mat3", Mat3]
  | ["mat4", Mat4]
  | ["float[]", number[]]
  | ["vec2[]", Vec2[]]
  | ["vec3[]", Vec3[]]
  | ["vec4[]", Vec4[]]
  | ["int[]", number[]]
  | ["ivec2[]", Vec2[]]
  | ["ivec3[]", Vec3[]]
  | ["ivec4[]", Vec4[]]
  | ["mat2[]", Mat2[]]
  | ["mat3[]", Mat3[]]
  | ["mat4[]", Mat4[]];

export function applyUniform(
  gl: GL,
  prog: WebGLProgram,
  name: string,
  spec: UniformSpec,
) {
  const [t, d] = spec;
  const l = gl.getUniformLocation(prog, name);
  if (l === null) {
    throw new Error(
      `Uniform '${name}' does not exist, or some other error occurred (program didn't compile).`,
    );
  }

  if (t === "float") gl.uniform1f(l, d);
  if (t === "vec2") gl.uniform2f(l, ...d);
  if (t === "vec3") gl.uniform3f(l, ...d);
  if (t === "vec4") gl.uniform4f(l, ...d);
  if (t === "int") gl.uniform1i(l, d);
  if (t === "ivec2") gl.uniform2i(l, ...d);
  if (t === "ivec3") gl.uniform3i(l, ...d);
  if (t === "ivec4") gl.uniform4i(l, ...d);
  if (t === "mat2") gl.uniformMatrix2fv(l, false, d);
  if (t === "mat3") gl.uniformMatrix3fv(l, false, d);
  if (t === "mat4") gl.uniformMatrix4fv(l, false, d);
  if (t === "float[]") gl.uniform1fv(l, d);
  if (t === "vec2[]") gl.uniform2fv(l, d.flat());
  if (t === "vec3[]") gl.uniform3fv(l, d.flat());
  if (t === "vec4[]") gl.uniform4fv(l, d.flat());
  if (t === "int[]") gl.uniform1iv(l, d);
  if (t === "ivec2[]") gl.uniform2iv(l, d.flat());
  if (t === "ivec3[]") gl.uniform3iv(l, d.flat());
  if (t === "ivec4[]") gl.uniform4iv(l, d.flat());
  if (t === "mat2[]") gl.uniformMatrix2fv(l, false, d.flat());
  if (t === "mat3[]") gl.uniformMatrix3fv(l, false, d.flat());
  if (t === "mat4[]") gl.uniformMatrix4fv(l, false, d.flat());
}

export function applyUniforms(gl: GL, prog: WebGLProgram, uniforms: Uniforms) {
  for (const [k, v] of Object.entries(uniforms)) {
    applyUniform(gl, prog, k, v);
  }
}

export type Uniforms = Record<string, UniformSpec>;

export type Object3DSpec = {
  program: WebGLProgram;
  buffer: BufferWithLayout;
  uniforms?: Uniforms;
  onDraw?: (obj: Object3D) => void;
  onDispose?: (obj: Object3D) => void;
};

export type Scene = {
  addObject3D(object: Object3DSpec): Object3D;
} & Uniformed;

type SceneSpec = {
  gl: GL;
  uniforms?: Uniforms;
  combineUniforms?(sceneUniforms: Uniforms, objectUniforms: Uniforms): Uniforms;
};

export function createScene(sceneSpec: SceneSpec): Scene {
  const gl = sceneSpec.gl;

  const combineUniforms =
    sceneSpec.combineUniforms ?? ((s, o) => ({ ...s, ...o }));

  let sceneUniforms = sceneSpec.uniforms ?? {};

  return {
    uniforms() {
      return sceneUniforms;
    },
    resetUniforms(u: Uniforms) {
      sceneUniforms = u;
    },
    updateUniforms(u: Uniforms) {
      sceneUniforms = { ...sceneUniforms, ...u };
    },
    addObject3D(spec) {
      let objectUniforms = spec.uniforms ?? {};
      return {
        gl() {
          return gl;
        },
        draw() {
          gl.useProgram(spec.program);
          spec.buffer.setLayout(spec.program);
          applyUniforms(
            gl,
            spec.program,
            combineUniforms(sceneUniforms, objectUniforms),
          );
          gl.drawArrays(gl.TRIANGLES, 0, spec.buffer.vertexCount);
        },
        uniforms() {
          return objectUniforms;
        },
        resetUniforms(u: Uniforms) {
          objectUniforms = u;
        },
        updateUniforms(u: Uniforms) {
          objectUniforms = { ...objectUniforms, ...u };
        },
      };
    },
  };
}
