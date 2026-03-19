(() => {
  // src/math/vector.generated.ts
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  function mulMat4(a, b) {
    return [
      a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3],
      a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3],
      a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3],
      a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3],
      a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7],
      a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7],
      a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7],
      a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7],
      a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11],
      a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11],
      a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11],
      a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11],
      a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15],
      a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15],
      a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15],
      a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]
    ];
  }
  function add3(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
  function mul3(a, b) {
    return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
  }
  function sum3(a) {
    return a[0] + a[1] + a[2];
  }
  function dot3(a, b) {
    return sum3(mul3(a, b));
  }
  function scale3(a, b) {
    return [a[0] * b, a[1] * b, a[2] * b];
  }

  // src/webgl/buffer.ts
  function getDatatypeSize(gl2, datatype) {
    return {
      [gl2.BYTE]: 1,
      [gl2.SHORT]: 2,
      [gl2.UNSIGNED_BYTE]: 1,
      [gl2.UNSIGNED_SHORT]: 2,
      [gl2.FLOAT]: 4,
      [gl2.HALF_FLOAT]: 2,
      [gl2.INT]: 4,
      [gl2.UNSIGNED_INT]: 4,
      [gl2.INT_2_10_10_10_REV]: 4,
      [gl2.UNSIGNED_INT_2_10_10_10_REV]: 4
    }[datatype];
  }
  function createBufferWithLayout(gl2, layout, data) {
    const buffer = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, buffer);
    const layoutEntries = Object.entries(layout);
    let stride = 0;
    const offsets = /* @__PURE__ */ new Map();
    for (const [name, attrs] of layoutEntries) {
      offsets.set(name, stride);
      stride += attrs.size * getDatatypeSize(gl2, attrs.type);
    }
    const arraybuf = new ArrayBuffer(stride * data.length);
    const rawdata = new DataView(arraybuf);
    let i = 0;
    for (const d of data) {
      for (const [name, attrs] of layoutEntries) {
        for (let j = 0; j < attrs.size; j++) {
          const val = d[name][j];
          let pos = i * stride + offsets.get(name) + j * getDatatypeSize(gl2, attrs.type);
          if (attrs.type === gl2.BYTE) {
            rawdata.setInt8(pos, val);
          } else if (attrs.type === gl2.UNSIGNED_BYTE) {
            rawdata.setUint8(pos, val);
          } else if (attrs.type === gl2.FLOAT) {
            rawdata.setFloat32(pos, val, true);
          } else if (attrs.type === gl2.SHORT) {
            rawdata.setInt16(pos, val, true);
          } else if (attrs.type === gl2.UNSIGNED_SHORT) {
            rawdata.setUint16(pos, val, true);
          }
        }
      }
      i++;
    }
    gl2.bufferData(gl2.ARRAY_BUFFER, rawdata, gl2.STATIC_DRAW);
    return {
      vertexCount: data.length,
      buffer,
      setLayout(prog2) {
        gl2.bindBuffer(gl2.ARRAY_BUFFER, buffer);
        for (const [name, attrs] of layoutEntries) {
          const loc = gl2.getAttribLocation(prog2, name);
          if (attrs.isInt) {
            gl2.vertexAttribIPointer(
              loc,
              attrs.size,
              attrs.type,
              stride,
              offsets.get(name)
            );
          } else {
            gl2.vertexAttribPointer(
              loc,
              attrs.size,
              attrs.type,
              attrs.normalized ?? false,
              stride,
              offsets.get(name)
            );
          }
          gl2.enableVertexAttribArray(loc);
        }
      },
      bindArray(gl3) {
        gl3.bindBuffer(gl3.ARRAY_BUFFER, buffer);
      },
      bindIndex(gl3) {
        gl3.bindBuffer(gl3.ELEMENT_ARRAY_BUFFER, buffer);
      }
    };
  }

  // src/webgl/mesh.ts
  function parametric2D(x, y, attr, getPoint) {
    const data = [];
    for (let j = 0; j < y; j++) {
      for (let i = 0; i < x; i++) {
        const a = getPoint(i, j);
        const b = getPoint(i + 1, j);
        const c = getPoint(i, j + 1);
        const d = getPoint(i + 1, j + 1);
        data.push({ [attr]: a });
        data.push({ [attr]: c });
        data.push({ [attr]: b });
        data.push({ [attr]: c });
        data.push({ [attr]: d });
        data.push({ [attr]: b });
      }
    }
    return data;
  }
  function ring(x, rad, height, attr) {
    return parametric2D(x, 1, attr, (i, j) => {
      const a = (i + x) % x / x * Math.PI * 2;
      const px = Math.cos(a) * rad;
      const pz = Math.sin(a) * rad;
      const py = j === 1 ? height / 2 : -height / 2;
      return [px, py, pz];
    });
  }
  function perspective(fieldOfViewInRadians, aspectRatio, near, far) {
    const f = 1 / Math.tan(fieldOfViewInRadians / 2);
    const rangeInv = 1 / (near - far);
    return [
      f / aspectRatio,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (near + far) * rangeInv,
      -1,
      0,
      0,
      near * far * rangeInv * 2,
      0
    ];
  }
  function normalize(v) {
    const len = Math.hypot(...v);
    return scale3(v, 1 / len);
  }
  function rodrigues(v, k, theta) {
    k = normalize(k);
    return add3(
      add3(scale3(v, Math.cos(theta)), scale3(cross(k, v), Math.sin(theta))),
      scale3(k, dot3(k, v) * (1 - Math.cos(theta)))
    );
  }
  function rotate(axis, angle) {
    return [
      ...rodrigues([1, 0, 0], axis, angle),
      0,
      ...rodrigues([0, 1, 0], axis, angle),
      0,
      ...rodrigues([0, 0, 1], axis, angle),
      0,
      0,
      0,
      0,
      1
    ];
  }
  function scale(axes) {
    return [axes[0], 0, 0, 0, 0, axes[1], 0, 0, 0, 0, axes[2], 0, 0, 0, 0, 1];
  }
  function translate(v) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ...v, 1];
  }

  // src/webgl/scene.ts
  function applyUniform(gl2, prog2, name, spec) {
    const [t, d] = spec;
    const l = gl2.getUniformLocation(prog2, name);
    if (l === null) {
      throw new Error(
        `Uniform '${name}' does not exist, or some other error occurred (program didn't compile).`
      );
    }
    if (t === "float") gl2.uniform1f(l, d);
    if (t === "vec2") gl2.uniform2f(l, ...d);
    if (t === "vec3") gl2.uniform3f(l, ...d);
    if (t === "vec4") gl2.uniform4f(l, ...d);
    if (t === "int") gl2.uniform1i(l, d);
    if (t === "ivec2") gl2.uniform2i(l, ...d);
    if (t === "ivec3") gl2.uniform3i(l, ...d);
    if (t === "ivec4") gl2.uniform4i(l, ...d);
    if (t === "mat2") gl2.uniformMatrix2fv(l, false, d);
    if (t === "mat3") gl2.uniformMatrix3fv(l, false, d);
    if (t === "mat4") gl2.uniformMatrix4fv(l, false, d);
    if (t === "float[]") gl2.uniform1fv(l, d);
    if (t === "vec2[]") gl2.uniform2fv(l, d.flat());
    if (t === "vec3[]") gl2.uniform3fv(l, d.flat());
    if (t === "vec4[]") gl2.uniform4fv(l, d.flat());
    if (t === "int[]") gl2.uniform1iv(l, d);
    if (t === "ivec2[]") gl2.uniform2iv(l, d.flat());
    if (t === "ivec3[]") gl2.uniform3iv(l, d.flat());
    if (t === "ivec4[]") gl2.uniform4iv(l, d.flat());
    if (t === "mat2[]") gl2.uniformMatrix2fv(l, false, d.flat());
    if (t === "mat3[]") gl2.uniformMatrix3fv(l, false, d.flat());
    if (t === "mat4[]") gl2.uniformMatrix4fv(l, false, d.flat());
  }
  function applyUniforms(gl2, prog2, uniforms) {
    for (const [k, v] of Object.entries(uniforms)) {
      applyUniform(gl2, prog2, k, v);
    }
  }
  function createScene(sceneSpec) {
    const gl2 = sceneSpec.gl;
    const combineUniforms = sceneSpec.combineUniforms ?? ((s, o) => ({ ...s, ...o }));
    let sceneUniforms = sceneSpec.uniforms ?? {};
    return {
      uniforms() {
        return sceneUniforms;
      },
      resetUniforms(u) {
        sceneUniforms = u;
      },
      updateUniforms(u) {
        sceneUniforms = { ...sceneUniforms, ...u };
      },
      addObject3D(spec) {
        let objectUniforms = spec.uniforms ?? {};
        return {
          gl() {
            return gl2;
          },
          draw() {
            gl2.useProgram(spec.program);
            spec.buffer.setLayout(spec.program);
            applyUniforms(
              gl2,
              spec.program,
              combineUniforms(sceneUniforms, objectUniforms)
            );
            gl2.drawArrays(gl2.TRIANGLES, 0, spec.buffer.vertexCount);
          },
          uniforms() {
            return objectUniforms;
          },
          resetUniforms(u) {
            objectUniforms = u;
          },
          updateUniforms(u) {
            objectUniforms = { ...objectUniforms, ...u };
          }
        };
      }
    };
  }

  // src/result.ts
  function ok(t) {
    return {
      ok: true,
      data: t
    };
  }
  function err(e) {
    return {
      ok: false,
      error: e
    };
  }

  // src/webgl/shader.ts
  function source2shader(gl2, type, source) {
    const shader = gl2.createShader(
      type === "v" ? gl2.VERTEX_SHADER : gl2.FRAGMENT_SHADER
    );
    if (!shader) return err(void 0);
    gl2.shaderSource(shader, source);
    gl2.compileShader(shader);
    if (!gl2.getShaderParameter(shader, gl2.COMPILE_STATUS)) {
      console.error(gl2.getShaderInfoLog(shader));
      return err(void 0);
    }
    return ok(shader);
  }
  function shaders2program(gl2, v, f) {
    const program = gl2.createProgram();
    gl2.attachShader(program, v);
    gl2.attachShader(program, f);
    gl2.linkProgram(program);
    if (!gl2.getProgramParameter(program, gl2.LINK_STATUS)) {
      console.error(gl2.getProgramInfoLog(program));
      return err(void 0);
    }
    return ok(program);
  }
  function sources2program(gl2, vs, fs) {
    const v = source2shader(gl2, "v", vs);
    const f = source2shader(gl2, "f", fs);
    if (!v.ok || !f.ok) return err(void 0);
    return shaders2program(gl2, v.data, f.data);
  }

  // demos-src/3d.demo.ts
  var canvas = document.createElement("canvas");
  canvas.style = "position: fixed; top: 0; left: 0; width: 100lvw; height: 100lvh; pointer-events: none;";
  document.body.appendChild(canvas);
  document.body.style.height = "600lvh";
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    throw window.alert("No webgl2 :(");
  }
  var ASPECT = 1;
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    ASPECT = canvas.width / canvas.height;
  }
  resize();
  window.addEventListener("resize", resize);
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  var prog = sources2program(
    gl,
    `#version 300 es
precision highp float;

in vec3 in_pos;
out vec4 pos;

uniform mat4 mvp;

void main() {
  vec4 postemp = mvp * vec4(in_pos, 1.0);
  gl_Position = postemp;
  pos = postemp * 0.5 + 0.5;
}
`,
    `#version 300 es
precision highp float;

in vec4 pos;
out vec4 col;

uniform vec4 color;

void main() {
  col = color;
}
`
  ).data;
  if (!prog) {
    throw window.alert("No shader program :(");
  }
  var scene = createScene({
    gl,
    uniforms: {
      mvp: ["mat4", mulMat4(perspective(1, 1, 0.1, 100), translate([0, 0, -1]))]
    },
    combineUniforms(sceneUniforms, objectUniforms) {
      let combined = {
        ...sceneUniforms,
        ...objectUniforms
      };
      if (sceneUniforms.mvp && sceneUniforms.mvp[0] === "mat4" && objectUniforms.mvp && objectUniforms.mvp[0] === "mat4") {
        combined.mvp = [
          "mat4",
          mulMat4(sceneUniforms.mvp[1], objectUniforms.mvp[1])
        ];
      }
      return combined;
    }
  });
  gl.enable(gl.DEPTH_TEST);
  var mesh = ring(32, 2.5, 0.25, "in_pos");
  var obj = scene.addObject3D({
    buffer: createBufferWithLayout(
      gl,
      { in_pos: { type: gl.FLOAT, size: 3 } },
      mesh
    ),
    program: prog,
    uniforms: {
      // depthOffset: ["float", 0],
      color: ["vec4", [1, 0, 0, 1]],
      mvp: ["mat4", rotate([1, 0, 0], 0)]
    }
  });
  function loop(t) {
    scene.updateUniforms({
      mvp: [
        "mat4",
        mulMat4(
          translate([0, window.scrollY / window.outerHeight - 2.5, 0]),
          perspective(1, ASPECT, 0.1, 100)
        )
      ]
    });
    t += 1e7;
    for (let i = 0; i < 200; i++) {
      let scaleFactor = 0.3 + i * 0.01;
      obj.updateUniforms({
        mvp: [
          "mat4",
          mulMat4(
            rotate([0.5, 1, 0], Math.PI / 4),
            mulMat4(
              rotate([0, 0, 1], (i * t + 5) / 1e5),
              scale([scaleFactor, scaleFactor, scaleFactor])
            )
          )
        ],
        color: ["vec4", [i / 200, 0, 0, 1]]
      });
      obj.draw();
    }
    requestAnimationFrame(loop);
  }
  loop(document.timeline.currentTime ?? 0);
})();
