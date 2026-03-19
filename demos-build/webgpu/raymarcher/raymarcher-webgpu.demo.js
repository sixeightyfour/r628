(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/is-any-array/lib/index.js
  var require_lib = __commonJS({
    "node_modules/is-any-array/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isAnyArray = void 0;
      var toString = Object.prototype.toString;
      function isAnyArray(value) {
        const tag = toString.call(value);
        return tag.endsWith("Array]") && !tag.includes("Big");
      }
      exports.isAnyArray = isAnyArray;
    }
  });

  // node_modules/ml-array-max/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/ml-array-max/lib/index.js"(exports, module) {
      "use strict";
      var isAnyArray = require_lib();
      function max(input, options = {}) {
        if (!isAnyArray.isAnyArray(input)) {
          throw new TypeError("input must be an array");
        }
        if (input.length === 0) {
          throw new TypeError("input must not be empty");
        }
        const { fromIndex = 0, toIndex = input.length } = options;
        if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
          throw new Error("fromIndex must be a positive integer smaller than length");
        }
        if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
          throw new Error(
            "toIndex must be an integer greater than fromIndex and at most equal to length"
          );
        }
        let maxValue = input[fromIndex];
        for (let i = fromIndex + 1; i < toIndex; i++) {
          if (input[i] > maxValue) maxValue = input[i];
        }
        return maxValue;
      }
      module.exports = max;
    }
  });

  // node_modules/ml-array-min/lib/index.js
  var require_lib3 = __commonJS({
    "node_modules/ml-array-min/lib/index.js"(exports, module) {
      "use strict";
      var isAnyArray = require_lib();
      function min(input, options = {}) {
        if (!isAnyArray.isAnyArray(input)) {
          throw new TypeError("input must be an array");
        }
        if (input.length === 0) {
          throw new TypeError("input must not be empty");
        }
        const { fromIndex = 0, toIndex = input.length } = options;
        if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
          throw new Error("fromIndex must be a positive integer smaller than length");
        }
        if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
          throw new Error(
            "toIndex must be an integer greater than fromIndex and at most equal to length"
          );
        }
        let minValue = input[fromIndex];
        for (let i = fromIndex + 1; i < toIndex; i++) {
          if (input[i] < minValue) minValue = input[i];
        }
        return minValue;
      }
      module.exports = min;
    }
  });

  // node_modules/ml-array-rescale/lib/index.js
  var require_lib4 = __commonJS({
    "node_modules/ml-array-rescale/lib/index.js"(exports, module) {
      "use strict";
      var isAnyArray = require_lib();
      var max = require_lib2();
      var min = require_lib3();
      function _interopDefaultLegacy(e) {
        return e && typeof e === "object" && "default" in e ? e : { "default": e };
      }
      var max__default = /* @__PURE__ */ _interopDefaultLegacy(max);
      var min__default = /* @__PURE__ */ _interopDefaultLegacy(min);
      function rescale(input, options = {}) {
        if (!isAnyArray.isAnyArray(input)) {
          throw new TypeError("input must be an array");
        } else if (input.length === 0) {
          throw new TypeError("input must not be empty");
        }
        let output;
        if (options.output !== void 0) {
          if (!isAnyArray.isAnyArray(options.output)) {
            throw new TypeError("output option must be an array if specified");
          }
          output = options.output;
        } else {
          output = new Array(input.length);
        }
        const currentMin = min__default["default"](input);
        const currentMax = max__default["default"](input);
        if (currentMin === currentMax) {
          throw new RangeError(
            "minimum and maximum input values are equal. Cannot rescale a constant array"
          );
        }
        const {
          min: minValue = options.autoMinMax ? currentMin : 0,
          max: maxValue = options.autoMinMax ? currentMax : 1
        } = options;
        if (minValue >= maxValue) {
          throw new RangeError("min option must be smaller than max option");
        }
        const factor = (maxValue - minValue) / (currentMax - currentMin);
        for (let i = 0; i < input.length; i++) {
          output[i] = (input[i] - currentMin) * factor + minValue;
        }
        return output;
      }
      module.exports = rescale;
    }
  });

  // node_modules/ml-matrix/matrix.js
  var require_matrix = __commonJS({
    "node_modules/ml-matrix/matrix.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var isAnyArray = require_lib();
      var rescale = require_lib4();
      var indent = " ".repeat(2);
      var indentData = " ".repeat(4);
      function inspectMatrix() {
        return inspectMatrixWithOptions(this);
      }
      function inspectMatrixWithOptions(matrix2, options = {}) {
        const {
          maxRows = 15,
          maxColumns = 10,
          maxNumSize = 8,
          padMinus = "auto"
        } = options;
        return `${matrix2.constructor.name} {
${indent}[
${indentData}${inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus)}
${indent}]
${indent}rows: ${matrix2.rows}
${indent}columns: ${matrix2.columns}
}`;
      }
      function inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus) {
        const { rows, columns } = matrix2;
        const maxI = Math.min(rows, maxRows);
        const maxJ = Math.min(columns, maxColumns);
        const result = [];
        if (padMinus === "auto") {
          padMinus = false;
          loop: for (let i = 0; i < maxI; i++) {
            for (let j = 0; j < maxJ; j++) {
              if (matrix2.get(i, j) < 0) {
                padMinus = true;
                break loop;
              }
            }
          }
        }
        for (let i = 0; i < maxI; i++) {
          let line = [];
          for (let j = 0; j < maxJ; j++) {
            line.push(formatNumber(matrix2.get(i, j), maxNumSize, padMinus));
          }
          result.push(`${line.join(" ")}`);
        }
        if (maxJ !== columns) {
          result[result.length - 1] += ` ... ${columns - maxColumns} more columns`;
        }
        if (maxI !== rows) {
          result.push(`... ${rows - maxRows} more rows`);
        }
        return result.join(`
${indentData}`);
      }
      function formatNumber(num, maxNumSize, padMinus) {
        return (num >= 0 && padMinus ? ` ${formatNumber2(num, maxNumSize - 1)}` : formatNumber2(num, maxNumSize)).padEnd(maxNumSize);
      }
      function formatNumber2(num, len) {
        let str = num.toString();
        if (str.length <= len) return str;
        let fix = num.toFixed(len);
        if (fix.length > len) {
          fix = num.toFixed(Math.max(0, len - (fix.length - len)));
        }
        if (fix.length <= len && !fix.startsWith("0.000") && !fix.startsWith("-0.000")) {
          return fix;
        }
        let exp = num.toExponential(len);
        if (exp.length > len) {
          exp = num.toExponential(Math.max(0, len - (exp.length - len)));
        }
        return exp.slice(0);
      }
      function installMathOperations(AbstractMatrix3, Matrix4) {
        AbstractMatrix3.prototype.add = function add(value) {
          if (typeof value === "number") return this.addS(value);
          return this.addM(value);
        };
        AbstractMatrix3.prototype.addS = function addS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.addM = function addM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.add = function add(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.add(value);
        };
        AbstractMatrix3.prototype.sub = function sub(value) {
          if (typeof value === "number") return this.subS(value);
          return this.subM(value);
        };
        AbstractMatrix3.prototype.subS = function subS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.subM = function subM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.sub = function sub(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.sub(value);
        };
        AbstractMatrix3.prototype.subtract = AbstractMatrix3.prototype.sub;
        AbstractMatrix3.prototype.subtractS = AbstractMatrix3.prototype.subS;
        AbstractMatrix3.prototype.subtractM = AbstractMatrix3.prototype.subM;
        AbstractMatrix3.subtract = AbstractMatrix3.sub;
        AbstractMatrix3.prototype.mul = function mul(value) {
          if (typeof value === "number") return this.mulS(value);
          return this.mulM(value);
        };
        AbstractMatrix3.prototype.mulS = function mulS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.mulM = function mulM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.mul = function mul(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.mul(value);
        };
        AbstractMatrix3.prototype.multiply = AbstractMatrix3.prototype.mul;
        AbstractMatrix3.prototype.multiplyS = AbstractMatrix3.prototype.mulS;
        AbstractMatrix3.prototype.multiplyM = AbstractMatrix3.prototype.mulM;
        AbstractMatrix3.multiply = AbstractMatrix3.mul;
        AbstractMatrix3.prototype.div = function div(value) {
          if (typeof value === "number") return this.divS(value);
          return this.divM(value);
        };
        AbstractMatrix3.prototype.divS = function divS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.divM = function divM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.div = function div(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.div(value);
        };
        AbstractMatrix3.prototype.divide = AbstractMatrix3.prototype.div;
        AbstractMatrix3.prototype.divideS = AbstractMatrix3.prototype.divS;
        AbstractMatrix3.prototype.divideM = AbstractMatrix3.prototype.divM;
        AbstractMatrix3.divide = AbstractMatrix3.div;
        AbstractMatrix3.prototype.mod = function mod(value) {
          if (typeof value === "number") return this.modS(value);
          return this.modM(value);
        };
        AbstractMatrix3.prototype.modS = function modS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) % value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.modM = function modM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) % matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.mod = function mod(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.mod(value);
        };
        AbstractMatrix3.prototype.modulus = AbstractMatrix3.prototype.mod;
        AbstractMatrix3.prototype.modulusS = AbstractMatrix3.prototype.modS;
        AbstractMatrix3.prototype.modulusM = AbstractMatrix3.prototype.modM;
        AbstractMatrix3.modulus = AbstractMatrix3.mod;
        AbstractMatrix3.prototype.and = function and(value) {
          if (typeof value === "number") return this.andS(value);
          return this.andM(value);
        };
        AbstractMatrix3.prototype.andS = function andS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) & value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.andM = function andM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) & matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.and = function and(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.and(value);
        };
        AbstractMatrix3.prototype.or = function or(value) {
          if (typeof value === "number") return this.orS(value);
          return this.orM(value);
        };
        AbstractMatrix3.prototype.orS = function orS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) | value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.orM = function orM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) | matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.or = function or(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.or(value);
        };
        AbstractMatrix3.prototype.xor = function xor(value) {
          if (typeof value === "number") return this.xorS(value);
          return this.xorM(value);
        };
        AbstractMatrix3.prototype.xorS = function xorS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ^ value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.xorM = function xorM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ^ matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.xor = function xor(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.xor(value);
        };
        AbstractMatrix3.prototype.leftShift = function leftShift(value) {
          if (typeof value === "number") return this.leftShiftS(value);
          return this.leftShiftM(value);
        };
        AbstractMatrix3.prototype.leftShiftS = function leftShiftS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) << value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.leftShiftM = function leftShiftM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) << matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.leftShift = function leftShift(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.leftShift(value);
        };
        AbstractMatrix3.prototype.signPropagatingRightShift = function signPropagatingRightShift(value) {
          if (typeof value === "number") return this.signPropagatingRightShiftS(value);
          return this.signPropagatingRightShiftM(value);
        };
        AbstractMatrix3.prototype.signPropagatingRightShiftS = function signPropagatingRightShiftS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >> value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.signPropagatingRightShiftM = function signPropagatingRightShiftM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >> matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.signPropagatingRightShift = function signPropagatingRightShift(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.signPropagatingRightShift(value);
        };
        AbstractMatrix3.prototype.rightShift = function rightShift(value) {
          if (typeof value === "number") return this.rightShiftS(value);
          return this.rightShiftM(value);
        };
        AbstractMatrix3.prototype.rightShiftS = function rightShiftS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >>> value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.rightShiftM = function rightShiftM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) >>> matrix2.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.rightShift = function rightShift(matrix2, value) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.rightShift(value);
        };
        AbstractMatrix3.prototype.zeroFillRightShift = AbstractMatrix3.prototype.rightShift;
        AbstractMatrix3.prototype.zeroFillRightShiftS = AbstractMatrix3.prototype.rightShiftS;
        AbstractMatrix3.prototype.zeroFillRightShiftM = AbstractMatrix3.prototype.rightShiftM;
        AbstractMatrix3.zeroFillRightShift = AbstractMatrix3.rightShift;
        AbstractMatrix3.prototype.not = function not() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, ~this.get(i, j));
            }
          }
          return this;
        };
        AbstractMatrix3.not = function not(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.not();
        };
        AbstractMatrix3.prototype.abs = function abs() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.abs(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.abs = function abs(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.abs();
        };
        AbstractMatrix3.prototype.acos = function acos() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.acos(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.acos = function acos(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.acos();
        };
        AbstractMatrix3.prototype.acosh = function acosh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.acosh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.acosh = function acosh(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.acosh();
        };
        AbstractMatrix3.prototype.asin = function asin() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.asin(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.asin = function asin(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.asin();
        };
        AbstractMatrix3.prototype.asinh = function asinh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.asinh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.asinh = function asinh(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.asinh();
        };
        AbstractMatrix3.prototype.atan = function atan() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.atan(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.atan = function atan(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.atan();
        };
        AbstractMatrix3.prototype.atanh = function atanh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.atanh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.atanh = function atanh(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.atanh();
        };
        AbstractMatrix3.prototype.cbrt = function cbrt() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.cbrt(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.cbrt = function cbrt(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.cbrt();
        };
        AbstractMatrix3.prototype.ceil = function ceil() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.ceil(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.ceil = function ceil(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.ceil();
        };
        AbstractMatrix3.prototype.clz32 = function clz32() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.clz32(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.clz32 = function clz32(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.clz32();
        };
        AbstractMatrix3.prototype.cos = function cos() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.cos(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.cos = function cos(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.cos();
        };
        AbstractMatrix3.prototype.cosh = function cosh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.cosh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.cosh = function cosh(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.cosh();
        };
        AbstractMatrix3.prototype.exp = function exp() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.exp(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.exp = function exp(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.exp();
        };
        AbstractMatrix3.prototype.expm1 = function expm1() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.expm1(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.expm1 = function expm1(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.expm1();
        };
        AbstractMatrix3.prototype.floor = function floor() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.floor(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.floor = function floor(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.floor();
        };
        AbstractMatrix3.prototype.fround = function fround() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.fround(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.fround = function fround(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.fround();
        };
        AbstractMatrix3.prototype.log = function log() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log = function log(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.log();
        };
        AbstractMatrix3.prototype.log1p = function log1p() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log1p(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log1p = function log1p(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.log1p();
        };
        AbstractMatrix3.prototype.log10 = function log10() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log10(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log10 = function log10(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.log10();
        };
        AbstractMatrix3.prototype.log2 = function log2() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.log2(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.log2 = function log2(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.log2();
        };
        AbstractMatrix3.prototype.round = function round() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.round(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.round = function round(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.round();
        };
        AbstractMatrix3.prototype.sign = function sign() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sign(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sign = function sign(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.sign();
        };
        AbstractMatrix3.prototype.sin = function sin() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sin(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sin = function sin(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.sin();
        };
        AbstractMatrix3.prototype.sinh = function sinh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sinh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sinh = function sinh(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.sinh();
        };
        AbstractMatrix3.prototype.sqrt = function sqrt() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.sqrt(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.sqrt = function sqrt(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.sqrt();
        };
        AbstractMatrix3.prototype.tan = function tan() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.tan(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.tan = function tan(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.tan();
        };
        AbstractMatrix3.prototype.tanh = function tanh() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.tanh(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.tanh = function tanh(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.tanh();
        };
        AbstractMatrix3.prototype.trunc = function trunc() {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, Math.trunc(this.get(i, j)));
            }
          }
          return this;
        };
        AbstractMatrix3.trunc = function trunc(matrix2) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.trunc();
        };
        AbstractMatrix3.pow = function pow(matrix2, arg0) {
          const newMatrix = new Matrix4(matrix2);
          return newMatrix.pow(arg0);
        };
        AbstractMatrix3.prototype.pow = function pow(value) {
          if (typeof value === "number") return this.powS(value);
          return this.powM(value);
        };
        AbstractMatrix3.prototype.powS = function powS(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ** value);
            }
          }
          return this;
        };
        AbstractMatrix3.prototype.powM = function powM(matrix2) {
          matrix2 = Matrix4.checkMatrix(matrix2);
          if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
            throw new RangeError("Matrices dimensions must be equal");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) ** matrix2.get(i, j));
            }
          }
          return this;
        };
      }
      function checkRowIndex(matrix2, index, outer) {
        let max = outer ? matrix2.rows : matrix2.rows - 1;
        if (index < 0 || index > max) {
          throw new RangeError("Row index out of range");
        }
      }
      function checkColumnIndex(matrix2, index, outer) {
        let max = outer ? matrix2.columns : matrix2.columns - 1;
        if (index < 0 || index > max) {
          throw new RangeError("Column index out of range");
        }
      }
      function checkRowVector(matrix2, vector) {
        if (vector.to1DArray) {
          vector = vector.to1DArray();
        }
        if (vector.length !== matrix2.columns) {
          throw new RangeError(
            "vector size must be the same as the number of columns"
          );
        }
        return vector;
      }
      function checkColumnVector(matrix2, vector) {
        if (vector.to1DArray) {
          vector = vector.to1DArray();
        }
        if (vector.length !== matrix2.rows) {
          throw new RangeError("vector size must be the same as the number of rows");
        }
        return vector;
      }
      function checkRowIndices(matrix2, rowIndices) {
        if (!isAnyArray.isAnyArray(rowIndices)) {
          throw new TypeError("row indices must be an array");
        }
        for (let i = 0; i < rowIndices.length; i++) {
          if (rowIndices[i] < 0 || rowIndices[i] >= matrix2.rows) {
            throw new RangeError("row indices are out of range");
          }
        }
      }
      function checkColumnIndices(matrix2, columnIndices) {
        if (!isAnyArray.isAnyArray(columnIndices)) {
          throw new TypeError("column indices must be an array");
        }
        for (let i = 0; i < columnIndices.length; i++) {
          if (columnIndices[i] < 0 || columnIndices[i] >= matrix2.columns) {
            throw new RangeError("column indices are out of range");
          }
        }
      }
      function checkRange(matrix2, startRow, endRow, startColumn, endColumn) {
        if (arguments.length !== 5) {
          throw new RangeError("expected 4 arguments");
        }
        checkNumber("startRow", startRow);
        checkNumber("endRow", endRow);
        checkNumber("startColumn", startColumn);
        checkNumber("endColumn", endColumn);
        if (startRow > endRow || startColumn > endColumn || startRow < 0 || startRow >= matrix2.rows || endRow < 0 || endRow >= matrix2.rows || startColumn < 0 || startColumn >= matrix2.columns || endColumn < 0 || endColumn >= matrix2.columns) {
          throw new RangeError("Submatrix indices are out of range");
        }
      }
      function newArray(length, value = 0) {
        let array = [];
        for (let i = 0; i < length; i++) {
          array.push(value);
        }
        return array;
      }
      function checkNumber(name, value) {
        if (typeof value !== "number") {
          throw new TypeError(`${name} must be a number`);
        }
      }
      function checkNonEmpty(matrix2) {
        if (matrix2.isEmpty()) {
          throw new Error("Empty matrix has no elements to index");
        }
      }
      function sumByRow(matrix2) {
        let sum = newArray(matrix2.rows);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[i] += matrix2.get(i, j);
          }
        }
        return sum;
      }
      function sumByColumn(matrix2) {
        let sum = newArray(matrix2.columns);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[j] += matrix2.get(i, j);
          }
        }
        return sum;
      }
      function sumAll(matrix2) {
        let v = 0;
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            v += matrix2.get(i, j);
          }
        }
        return v;
      }
      function productByRow(matrix2) {
        let sum = newArray(matrix2.rows, 1);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[i] *= matrix2.get(i, j);
          }
        }
        return sum;
      }
      function productByColumn(matrix2) {
        let sum = newArray(matrix2.columns, 1);
        for (let i = 0; i < matrix2.rows; ++i) {
          for (let j = 0; j < matrix2.columns; ++j) {
            sum[j] *= matrix2.get(i, j);
          }
        }
        return sum;
      }
      function productAll(matrix2) {
        let v = 1;
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            v *= matrix2.get(i, j);
          }
        }
        return v;
      }
      function varianceByRow(matrix2, unbiased, mean) {
        const rows = matrix2.rows;
        const cols = matrix2.columns;
        const variance = [];
        for (let i = 0; i < rows; i++) {
          let sum1 = 0;
          let sum2 = 0;
          let x = 0;
          for (let j = 0; j < cols; j++) {
            x = matrix2.get(i, j) - mean[i];
            sum1 += x;
            sum2 += x * x;
          }
          if (unbiased) {
            variance.push((sum2 - sum1 * sum1 / cols) / (cols - 1));
          } else {
            variance.push((sum2 - sum1 * sum1 / cols) / cols);
          }
        }
        return variance;
      }
      function varianceByColumn(matrix2, unbiased, mean) {
        const rows = matrix2.rows;
        const cols = matrix2.columns;
        const variance = [];
        for (let j = 0; j < cols; j++) {
          let sum1 = 0;
          let sum2 = 0;
          let x = 0;
          for (let i = 0; i < rows; i++) {
            x = matrix2.get(i, j) - mean[j];
            sum1 += x;
            sum2 += x * x;
          }
          if (unbiased) {
            variance.push((sum2 - sum1 * sum1 / rows) / (rows - 1));
          } else {
            variance.push((sum2 - sum1 * sum1 / rows) / rows);
          }
        }
        return variance;
      }
      function varianceAll(matrix2, unbiased, mean) {
        const rows = matrix2.rows;
        const cols = matrix2.columns;
        const size = rows * cols;
        let sum1 = 0;
        let sum2 = 0;
        let x = 0;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            x = matrix2.get(i, j) - mean;
            sum1 += x;
            sum2 += x * x;
          }
        }
        if (unbiased) {
          return (sum2 - sum1 * sum1 / size) / (size - 1);
        } else {
          return (sum2 - sum1 * sum1 / size) / size;
        }
      }
      function centerByRow(matrix2, mean) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) - mean[i]);
          }
        }
      }
      function centerByColumn(matrix2, mean) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) - mean[j]);
          }
        }
      }
      function centerAll(matrix2, mean) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) - mean);
          }
        }
      }
      function getScaleByRow(matrix2) {
        const scale = [];
        for (let i = 0; i < matrix2.rows; i++) {
          let sum = 0;
          for (let j = 0; j < matrix2.columns; j++) {
            sum += matrix2.get(i, j) ** 2 / (matrix2.columns - 1);
          }
          scale.push(Math.sqrt(sum));
        }
        return scale;
      }
      function scaleByRow(matrix2, scale) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) / scale[i]);
          }
        }
      }
      function getScaleByColumn(matrix2) {
        const scale = [];
        for (let j = 0; j < matrix2.columns; j++) {
          let sum = 0;
          for (let i = 0; i < matrix2.rows; i++) {
            sum += matrix2.get(i, j) ** 2 / (matrix2.rows - 1);
          }
          scale.push(Math.sqrt(sum));
        }
        return scale;
      }
      function scaleByColumn(matrix2, scale) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) / scale[j]);
          }
        }
      }
      function getScaleAll(matrix2) {
        const divider = matrix2.size - 1;
        let sum = 0;
        for (let j = 0; j < matrix2.columns; j++) {
          for (let i = 0; i < matrix2.rows; i++) {
            sum += matrix2.get(i, j) ** 2 / divider;
          }
        }
        return Math.sqrt(sum);
      }
      function scaleAll(matrix2, scale) {
        for (let i = 0; i < matrix2.rows; i++) {
          for (let j = 0; j < matrix2.columns; j++) {
            matrix2.set(i, j, matrix2.get(i, j) / scale);
          }
        }
      }
      var AbstractMatrix2 = class _AbstractMatrix {
        static from1DArray(newRows, newColumns, newData) {
          let length = newRows * newColumns;
          if (length !== newData.length) {
            throw new RangeError("data length does not match given dimensions");
          }
          let newMatrix = new Matrix3(newRows, newColumns);
          for (let row = 0; row < newRows; row++) {
            for (let column = 0; column < newColumns; column++) {
              newMatrix.set(row, column, newData[row * newColumns + column]);
            }
          }
          return newMatrix;
        }
        static rowVector(newData) {
          let vector = new Matrix3(1, newData.length);
          for (let i = 0; i < newData.length; i++) {
            vector.set(0, i, newData[i]);
          }
          return vector;
        }
        static columnVector(newData) {
          let vector = new Matrix3(newData.length, 1);
          for (let i = 0; i < newData.length; i++) {
            vector.set(i, 0, newData[i]);
          }
          return vector;
        }
        static zeros(rows, columns) {
          return new Matrix3(rows, columns);
        }
        static ones(rows, columns) {
          return new Matrix3(rows, columns).fill(1);
        }
        static rand(rows, columns, options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { random = Math.random } = options;
          let matrix2 = new Matrix3(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              matrix2.set(i, j, random());
            }
          }
          return matrix2;
        }
        static randInt(rows, columns, options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { min = 0, max = 1e3, random = Math.random } = options;
          if (!Number.isInteger(min)) throw new TypeError("min must be an integer");
          if (!Number.isInteger(max)) throw new TypeError("max must be an integer");
          if (min >= max) throw new RangeError("min must be smaller than max");
          let interval = max - min;
          let matrix2 = new Matrix3(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              let value = min + Math.round(random() * interval);
              matrix2.set(i, j, value);
            }
          }
          return matrix2;
        }
        static eye(rows, columns, value) {
          if (columns === void 0) columns = rows;
          if (value === void 0) value = 1;
          let min = Math.min(rows, columns);
          let matrix2 = this.zeros(rows, columns);
          for (let i = 0; i < min; i++) {
            matrix2.set(i, i, value);
          }
          return matrix2;
        }
        static diag(data, rows, columns) {
          let l = data.length;
          if (rows === void 0) rows = l;
          if (columns === void 0) columns = rows;
          let min = Math.min(l, rows, columns);
          let matrix2 = this.zeros(rows, columns);
          for (let i = 0; i < min; i++) {
            matrix2.set(i, i, data[i]);
          }
          return matrix2;
        }
        static min(matrix1, matrix2) {
          matrix1 = this.checkMatrix(matrix1);
          matrix2 = this.checkMatrix(matrix2);
          let rows = matrix1.rows;
          let columns = matrix1.columns;
          let result = new Matrix3(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              result.set(i, j, Math.min(matrix1.get(i, j), matrix2.get(i, j)));
            }
          }
          return result;
        }
        static max(matrix1, matrix2) {
          matrix1 = this.checkMatrix(matrix1);
          matrix2 = this.checkMatrix(matrix2);
          let rows = matrix1.rows;
          let columns = matrix1.columns;
          let result = new this(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              result.set(i, j, Math.max(matrix1.get(i, j), matrix2.get(i, j)));
            }
          }
          return result;
        }
        static checkMatrix(value) {
          return _AbstractMatrix.isMatrix(value) ? value : new Matrix3(value);
        }
        static isMatrix(value) {
          return value != null && value.klass === "Matrix";
        }
        get size() {
          return this.rows * this.columns;
        }
        apply(callback) {
          if (typeof callback !== "function") {
            throw new TypeError("callback must be a function");
          }
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              callback.call(this, i, j);
            }
          }
          return this;
        }
        to1DArray() {
          let array = [];
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              array.push(this.get(i, j));
            }
          }
          return array;
        }
        to2DArray() {
          let copy = [];
          for (let i = 0; i < this.rows; i++) {
            copy.push([]);
            for (let j = 0; j < this.columns; j++) {
              copy[i].push(this.get(i, j));
            }
          }
          return copy;
        }
        toJSON() {
          return this.to2DArray();
        }
        isRowVector() {
          return this.rows === 1;
        }
        isColumnVector() {
          return this.columns === 1;
        }
        isVector() {
          return this.rows === 1 || this.columns === 1;
        }
        isSquare() {
          return this.rows === this.columns;
        }
        isEmpty() {
          return this.rows === 0 || this.columns === 0;
        }
        isSymmetric() {
          if (this.isSquare()) {
            for (let i = 0; i < this.rows; i++) {
              for (let j = 0; j <= i; j++) {
                if (this.get(i, j) !== this.get(j, i)) {
                  return false;
                }
              }
            }
            return true;
          }
          return false;
        }
        isDistance() {
          if (!this.isSymmetric()) return false;
          for (let i = 0; i < this.rows; i++) {
            if (this.get(i, i) !== 0) return false;
          }
          return true;
        }
        isEchelonForm() {
          let i = 0;
          let j = 0;
          let previousColumn = -1;
          let isEchelonForm = true;
          let checked = false;
          while (i < this.rows && isEchelonForm) {
            j = 0;
            checked = false;
            while (j < this.columns && checked === false) {
              if (this.get(i, j) === 0) {
                j++;
              } else if (this.get(i, j) === 1 && j > previousColumn) {
                checked = true;
                previousColumn = j;
              } else {
                isEchelonForm = false;
                checked = true;
              }
            }
            i++;
          }
          return isEchelonForm;
        }
        isReducedEchelonForm() {
          let i = 0;
          let j = 0;
          let previousColumn = -1;
          let isReducedEchelonForm = true;
          let checked = false;
          while (i < this.rows && isReducedEchelonForm) {
            j = 0;
            checked = false;
            while (j < this.columns && checked === false) {
              if (this.get(i, j) === 0) {
                j++;
              } else if (this.get(i, j) === 1 && j > previousColumn) {
                checked = true;
                previousColumn = j;
              } else {
                isReducedEchelonForm = false;
                checked = true;
              }
            }
            for (let k = j + 1; k < this.rows; k++) {
              if (this.get(i, k) !== 0) {
                isReducedEchelonForm = false;
              }
            }
            i++;
          }
          return isReducedEchelonForm;
        }
        echelonForm() {
          let result = this.clone();
          let h = 0;
          let k = 0;
          while (h < result.rows && k < result.columns) {
            let iMax = h;
            for (let i = h; i < result.rows; i++) {
              if (result.get(i, k) > result.get(iMax, k)) {
                iMax = i;
              }
            }
            if (result.get(iMax, k) === 0) {
              k++;
            } else {
              result.swapRows(h, iMax);
              let tmp = result.get(h, k);
              for (let j = k; j < result.columns; j++) {
                result.set(h, j, result.get(h, j) / tmp);
              }
              for (let i = h + 1; i < result.rows; i++) {
                let factor = result.get(i, k) / result.get(h, k);
                result.set(i, k, 0);
                for (let j = k + 1; j < result.columns; j++) {
                  result.set(i, j, result.get(i, j) - result.get(h, j) * factor);
                }
              }
              h++;
              k++;
            }
          }
          return result;
        }
        reducedEchelonForm() {
          let result = this.echelonForm();
          let m = result.columns;
          let n = result.rows;
          let h = n - 1;
          while (h >= 0) {
            if (result.maxRow(h) === 0) {
              h--;
            } else {
              let p = 0;
              let pivot = false;
              while (p < n && pivot === false) {
                if (result.get(h, p) === 1) {
                  pivot = true;
                } else {
                  p++;
                }
              }
              for (let i = 0; i < h; i++) {
                let factor = result.get(i, p);
                for (let j = p; j < m; j++) {
                  let tmp = result.get(i, j) - factor * result.get(h, j);
                  result.set(i, j, tmp);
                }
              }
              h--;
            }
          }
          return result;
        }
        set() {
          throw new Error("set method is unimplemented");
        }
        get() {
          throw new Error("get method is unimplemented");
        }
        repeat(options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { rows = 1, columns = 1 } = options;
          if (!Number.isInteger(rows) || rows <= 0) {
            throw new TypeError("rows must be a positive integer");
          }
          if (!Number.isInteger(columns) || columns <= 0) {
            throw new TypeError("columns must be a positive integer");
          }
          let matrix2 = new Matrix3(this.rows * rows, this.columns * columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              matrix2.setSubMatrix(this, this.rows * i, this.columns * j);
            }
          }
          return matrix2;
        }
        fill(value) {
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, value);
            }
          }
          return this;
        }
        neg() {
          return this.mulS(-1);
        }
        getRow(index) {
          checkRowIndex(this, index);
          let row = [];
          for (let i = 0; i < this.columns; i++) {
            row.push(this.get(index, i));
          }
          return row;
        }
        getRowVector(index) {
          return Matrix3.rowVector(this.getRow(index));
        }
        setRow(index, array) {
          checkRowIndex(this, index);
          array = checkRowVector(this, array);
          for (let i = 0; i < this.columns; i++) {
            this.set(index, i, array[i]);
          }
          return this;
        }
        swapRows(row1, row2) {
          checkRowIndex(this, row1);
          checkRowIndex(this, row2);
          for (let i = 0; i < this.columns; i++) {
            let temp = this.get(row1, i);
            this.set(row1, i, this.get(row2, i));
            this.set(row2, i, temp);
          }
          return this;
        }
        getColumn(index) {
          checkColumnIndex(this, index);
          let column = [];
          for (let i = 0; i < this.rows; i++) {
            column.push(this.get(i, index));
          }
          return column;
        }
        getColumnVector(index) {
          return Matrix3.columnVector(this.getColumn(index));
        }
        setColumn(index, array) {
          checkColumnIndex(this, index);
          array = checkColumnVector(this, array);
          for (let i = 0; i < this.rows; i++) {
            this.set(i, index, array[i]);
          }
          return this;
        }
        swapColumns(column1, column2) {
          checkColumnIndex(this, column1);
          checkColumnIndex(this, column2);
          for (let i = 0; i < this.rows; i++) {
            let temp = this.get(i, column1);
            this.set(i, column1, this.get(i, column2));
            this.set(i, column2, temp);
          }
          return this;
        }
        addRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + vector[j]);
            }
          }
          return this;
        }
        subRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - vector[j]);
            }
          }
          return this;
        }
        mulRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * vector[j]);
            }
          }
          return this;
        }
        divRowVector(vector) {
          vector = checkRowVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / vector[j]);
            }
          }
          return this;
        }
        addColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) + vector[i]);
            }
          }
          return this;
        }
        subColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) - vector[i]);
            }
          }
          return this;
        }
        mulColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) * vector[i]);
            }
          }
          return this;
        }
        divColumnVector(vector) {
          vector = checkColumnVector(this, vector);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              this.set(i, j, this.get(i, j) / vector[i]);
            }
          }
          return this;
        }
        mulRow(index, value) {
          checkRowIndex(this, index);
          for (let i = 0; i < this.columns; i++) {
            this.set(index, i, this.get(index, i) * value);
          }
          return this;
        }
        mulColumn(index, value) {
          checkColumnIndex(this, index);
          for (let i = 0; i < this.rows; i++) {
            this.set(i, index, this.get(i, index) * value);
          }
          return this;
        }
        max(by) {
          if (this.isEmpty()) {
            return NaN;
          }
          switch (by) {
            case "row": {
              const max = new Array(this.rows).fill(Number.NEGATIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) > max[row]) {
                    max[row] = this.get(row, column);
                  }
                }
              }
              return max;
            }
            case "column": {
              const max = new Array(this.columns).fill(Number.NEGATIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) > max[column]) {
                    max[column] = this.get(row, column);
                  }
                }
              }
              return max;
            }
            case void 0: {
              let max = this.get(0, 0);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) > max) {
                    max = this.get(row, column);
                  }
                }
              }
              return max;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        maxIndex() {
          checkNonEmpty(this);
          let v = this.get(0, 0);
          let idx = [0, 0];
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              if (this.get(i, j) > v) {
                v = this.get(i, j);
                idx[0] = i;
                idx[1] = j;
              }
            }
          }
          return idx;
        }
        min(by) {
          if (this.isEmpty()) {
            return NaN;
          }
          switch (by) {
            case "row": {
              const min = new Array(this.rows).fill(Number.POSITIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) < min[row]) {
                    min[row] = this.get(row, column);
                  }
                }
              }
              return min;
            }
            case "column": {
              const min = new Array(this.columns).fill(Number.POSITIVE_INFINITY);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) < min[column]) {
                    min[column] = this.get(row, column);
                  }
                }
              }
              return min;
            }
            case void 0: {
              let min = this.get(0, 0);
              for (let row = 0; row < this.rows; row++) {
                for (let column = 0; column < this.columns; column++) {
                  if (this.get(row, column) < min) {
                    min = this.get(row, column);
                  }
                }
              }
              return min;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        minIndex() {
          checkNonEmpty(this);
          let v = this.get(0, 0);
          let idx = [0, 0];
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              if (this.get(i, j) < v) {
                v = this.get(i, j);
                idx[0] = i;
                idx[1] = j;
              }
            }
          }
          return idx;
        }
        maxRow(row) {
          checkRowIndex(this, row);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(row, 0);
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) > v) {
              v = this.get(row, i);
            }
          }
          return v;
        }
        maxRowIndex(row) {
          checkRowIndex(this, row);
          checkNonEmpty(this);
          let v = this.get(row, 0);
          let idx = [row, 0];
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) > v) {
              v = this.get(row, i);
              idx[1] = i;
            }
          }
          return idx;
        }
        minRow(row) {
          checkRowIndex(this, row);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(row, 0);
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) < v) {
              v = this.get(row, i);
            }
          }
          return v;
        }
        minRowIndex(row) {
          checkRowIndex(this, row);
          checkNonEmpty(this);
          let v = this.get(row, 0);
          let idx = [row, 0];
          for (let i = 1; i < this.columns; i++) {
            if (this.get(row, i) < v) {
              v = this.get(row, i);
              idx[1] = i;
            }
          }
          return idx;
        }
        maxColumn(column) {
          checkColumnIndex(this, column);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(0, column);
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) > v) {
              v = this.get(i, column);
            }
          }
          return v;
        }
        maxColumnIndex(column) {
          checkColumnIndex(this, column);
          checkNonEmpty(this);
          let v = this.get(0, column);
          let idx = [0, column];
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) > v) {
              v = this.get(i, column);
              idx[0] = i;
            }
          }
          return idx;
        }
        minColumn(column) {
          checkColumnIndex(this, column);
          if (this.isEmpty()) {
            return NaN;
          }
          let v = this.get(0, column);
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) < v) {
              v = this.get(i, column);
            }
          }
          return v;
        }
        minColumnIndex(column) {
          checkColumnIndex(this, column);
          checkNonEmpty(this);
          let v = this.get(0, column);
          let idx = [0, column];
          for (let i = 1; i < this.rows; i++) {
            if (this.get(i, column) < v) {
              v = this.get(i, column);
              idx[0] = i;
            }
          }
          return idx;
        }
        diag() {
          let min = Math.min(this.rows, this.columns);
          let diag = [];
          for (let i = 0; i < min; i++) {
            diag.push(this.get(i, i));
          }
          return diag;
        }
        norm(type = "frobenius") {
          switch (type) {
            case "max":
              return this.max();
            case "frobenius":
              return Math.sqrt(this.dot(this));
            default:
              throw new RangeError(`unknown norm type: ${type}`);
          }
        }
        cumulativeSum() {
          let sum = 0;
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              sum += this.get(i, j);
              this.set(i, j, sum);
            }
          }
          return this;
        }
        dot(vector2) {
          if (_AbstractMatrix.isMatrix(vector2)) vector2 = vector2.to1DArray();
          let vector1 = this.to1DArray();
          if (vector1.length !== vector2.length) {
            throw new RangeError("vectors do not have the same size");
          }
          let dot = 0;
          for (let i = 0; i < vector1.length; i++) {
            dot += vector1[i] * vector2[i];
          }
          return dot;
        }
        mmul(other) {
          other = Matrix3.checkMatrix(other);
          let m = this.rows;
          let n = this.columns;
          let p = other.columns;
          let result = new Matrix3(m, p);
          let Bcolj = new Float64Array(n);
          for (let j = 0; j < p; j++) {
            for (let k = 0; k < n; k++) {
              Bcolj[k] = other.get(k, j);
            }
            for (let i = 0; i < m; i++) {
              let s = 0;
              for (let k = 0; k < n; k++) {
                s += this.get(i, k) * Bcolj[k];
              }
              result.set(i, j, s);
            }
          }
          return result;
        }
        mpow(scalar) {
          if (!this.isSquare()) {
            throw new RangeError("Matrix must be square");
          }
          if (!Number.isInteger(scalar) || scalar < 0) {
            throw new RangeError("Exponent must be a non-negative integer");
          }
          let result = Matrix3.eye(this.rows);
          let bb = this;
          for (let e = scalar; e >= 1; e /= 2) {
            if ((e & 1) !== 0) {
              result = result.mmul(bb);
            }
            bb = bb.mmul(bb);
          }
          return result;
        }
        strassen2x2(other) {
          other = Matrix3.checkMatrix(other);
          let result = new Matrix3(2, 2);
          const a11 = this.get(0, 0);
          const b11 = other.get(0, 0);
          const a12 = this.get(0, 1);
          const b12 = other.get(0, 1);
          const a21 = this.get(1, 0);
          const b21 = other.get(1, 0);
          const a22 = this.get(1, 1);
          const b22 = other.get(1, 1);
          const m1 = (a11 + a22) * (b11 + b22);
          const m2 = (a21 + a22) * b11;
          const m3 = a11 * (b12 - b22);
          const m4 = a22 * (b21 - b11);
          const m5 = (a11 + a12) * b22;
          const m6 = (a21 - a11) * (b11 + b12);
          const m7 = (a12 - a22) * (b21 + b22);
          const c00 = m1 + m4 - m5 + m7;
          const c01 = m3 + m5;
          const c10 = m2 + m4;
          const c11 = m1 - m2 + m3 + m6;
          result.set(0, 0, c00);
          result.set(0, 1, c01);
          result.set(1, 0, c10);
          result.set(1, 1, c11);
          return result;
        }
        strassen3x3(other) {
          other = Matrix3.checkMatrix(other);
          let result = new Matrix3(3, 3);
          const a00 = this.get(0, 0);
          const a01 = this.get(0, 1);
          const a02 = this.get(0, 2);
          const a10 = this.get(1, 0);
          const a11 = this.get(1, 1);
          const a12 = this.get(1, 2);
          const a20 = this.get(2, 0);
          const a21 = this.get(2, 1);
          const a22 = this.get(2, 2);
          const b00 = other.get(0, 0);
          const b01 = other.get(0, 1);
          const b02 = other.get(0, 2);
          const b10 = other.get(1, 0);
          const b11 = other.get(1, 1);
          const b12 = other.get(1, 2);
          const b20 = other.get(2, 0);
          const b21 = other.get(2, 1);
          const b22 = other.get(2, 2);
          const m1 = (a00 + a01 + a02 - a10 - a11 - a21 - a22) * b11;
          const m2 = (a00 - a10) * (-b01 + b11);
          const m3 = a11 * (-b00 + b01 + b10 - b11 - b12 - b20 + b22);
          const m4 = (-a00 + a10 + a11) * (b00 - b01 + b11);
          const m5 = (a10 + a11) * (-b00 + b01);
          const m6 = a00 * b00;
          const m7 = (-a00 + a20 + a21) * (b00 - b02 + b12);
          const m8 = (-a00 + a20) * (b02 - b12);
          const m9 = (a20 + a21) * (-b00 + b02);
          const m10 = (a00 + a01 + a02 - a11 - a12 - a20 - a21) * b12;
          const m11 = a21 * (-b00 + b02 + b10 - b11 - b12 - b20 + b21);
          const m12 = (-a02 + a21 + a22) * (b11 + b20 - b21);
          const m13 = (a02 - a22) * (b11 - b21);
          const m14 = a02 * b20;
          const m15 = (a21 + a22) * (-b20 + b21);
          const m16 = (-a02 + a11 + a12) * (b12 + b20 - b22);
          const m17 = (a02 - a12) * (b12 - b22);
          const m18 = (a11 + a12) * (-b20 + b22);
          const m19 = a01 * b10;
          const m20 = a12 * b21;
          const m21 = a10 * b02;
          const m22 = a20 * b01;
          const m23 = a22 * b22;
          const c00 = m6 + m14 + m19;
          const c01 = m1 + m4 + m5 + m6 + m12 + m14 + m15;
          const c02 = m6 + m7 + m9 + m10 + m14 + m16 + m18;
          const c10 = m2 + m3 + m4 + m6 + m14 + m16 + m17;
          const c11 = m2 + m4 + m5 + m6 + m20;
          const c12 = m14 + m16 + m17 + m18 + m21;
          const c20 = m6 + m7 + m8 + m11 + m12 + m13 + m14;
          const c21 = m12 + m13 + m14 + m15 + m22;
          const c22 = m6 + m7 + m8 + m9 + m23;
          result.set(0, 0, c00);
          result.set(0, 1, c01);
          result.set(0, 2, c02);
          result.set(1, 0, c10);
          result.set(1, 1, c11);
          result.set(1, 2, c12);
          result.set(2, 0, c20);
          result.set(2, 1, c21);
          result.set(2, 2, c22);
          return result;
        }
        mmulStrassen(y) {
          y = Matrix3.checkMatrix(y);
          let x = this.clone();
          let r1 = x.rows;
          let c1 = x.columns;
          let r2 = y.rows;
          let c2 = y.columns;
          if (c1 !== r2) {
            console.warn(
              `Multiplying ${r1} x ${c1} and ${r2} x ${c2} matrix: dimensions do not match.`
            );
          }
          function embed(mat, rows, cols) {
            let r3 = mat.rows;
            let c3 = mat.columns;
            if (r3 === rows && c3 === cols) {
              return mat;
            } else {
              let resultat = _AbstractMatrix.zeros(rows, cols);
              resultat = resultat.setSubMatrix(mat, 0, 0);
              return resultat;
            }
          }
          let r = Math.max(r1, r2);
          let c = Math.max(c1, c2);
          x = embed(x, r, c);
          y = embed(y, r, c);
          function blockMult(a, b, rows, cols) {
            if (rows <= 512 || cols <= 512) {
              return a.mmul(b);
            }
            if (rows % 2 === 1 && cols % 2 === 1) {
              a = embed(a, rows + 1, cols + 1);
              b = embed(b, rows + 1, cols + 1);
            } else if (rows % 2 === 1) {
              a = embed(a, rows + 1, cols);
              b = embed(b, rows + 1, cols);
            } else if (cols % 2 === 1) {
              a = embed(a, rows, cols + 1);
              b = embed(b, rows, cols + 1);
            }
            let halfRows = parseInt(a.rows / 2, 10);
            let halfCols = parseInt(a.columns / 2, 10);
            let a11 = a.subMatrix(0, halfRows - 1, 0, halfCols - 1);
            let b11 = b.subMatrix(0, halfRows - 1, 0, halfCols - 1);
            let a12 = a.subMatrix(0, halfRows - 1, halfCols, a.columns - 1);
            let b12 = b.subMatrix(0, halfRows - 1, halfCols, b.columns - 1);
            let a21 = a.subMatrix(halfRows, a.rows - 1, 0, halfCols - 1);
            let b21 = b.subMatrix(halfRows, b.rows - 1, 0, halfCols - 1);
            let a22 = a.subMatrix(halfRows, a.rows - 1, halfCols, a.columns - 1);
            let b22 = b.subMatrix(halfRows, b.rows - 1, halfCols, b.columns - 1);
            let m1 = blockMult(
              _AbstractMatrix.add(a11, a22),
              _AbstractMatrix.add(b11, b22),
              halfRows,
              halfCols
            );
            let m2 = blockMult(_AbstractMatrix.add(a21, a22), b11, halfRows, halfCols);
            let m3 = blockMult(a11, _AbstractMatrix.sub(b12, b22), halfRows, halfCols);
            let m4 = blockMult(a22, _AbstractMatrix.sub(b21, b11), halfRows, halfCols);
            let m5 = blockMult(_AbstractMatrix.add(a11, a12), b22, halfRows, halfCols);
            let m6 = blockMult(
              _AbstractMatrix.sub(a21, a11),
              _AbstractMatrix.add(b11, b12),
              halfRows,
              halfCols
            );
            let m7 = blockMult(
              _AbstractMatrix.sub(a12, a22),
              _AbstractMatrix.add(b21, b22),
              halfRows,
              halfCols
            );
            let c11 = _AbstractMatrix.add(m1, m4);
            c11.sub(m5);
            c11.add(m7);
            let c12 = _AbstractMatrix.add(m3, m5);
            let c21 = _AbstractMatrix.add(m2, m4);
            let c22 = _AbstractMatrix.sub(m1, m2);
            c22.add(m3);
            c22.add(m6);
            let result = _AbstractMatrix.zeros(2 * c11.rows, 2 * c11.columns);
            result = result.setSubMatrix(c11, 0, 0);
            result = result.setSubMatrix(c12, c11.rows, 0);
            result = result.setSubMatrix(c21, 0, c11.columns);
            result = result.setSubMatrix(c22, c11.rows, c11.columns);
            return result.subMatrix(0, rows - 1, 0, cols - 1);
          }
          return blockMult(x, y, r, c);
        }
        scaleRows(options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { min = 0, max = 1 } = options;
          if (!Number.isFinite(min)) throw new TypeError("min must be a number");
          if (!Number.isFinite(max)) throw new TypeError("max must be a number");
          if (min >= max) throw new RangeError("min must be smaller than max");
          let newMatrix = new Matrix3(this.rows, this.columns);
          for (let i = 0; i < this.rows; i++) {
            const row = this.getRow(i);
            if (row.length > 0) {
              rescale(row, { min, max, output: row });
            }
            newMatrix.setRow(i, row);
          }
          return newMatrix;
        }
        scaleColumns(options = {}) {
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { min = 0, max = 1 } = options;
          if (!Number.isFinite(min)) throw new TypeError("min must be a number");
          if (!Number.isFinite(max)) throw new TypeError("max must be a number");
          if (min >= max) throw new RangeError("min must be smaller than max");
          let newMatrix = new Matrix3(this.rows, this.columns);
          for (let i = 0; i < this.columns; i++) {
            const column = this.getColumn(i);
            if (column.length) {
              rescale(column, {
                min,
                max,
                output: column
              });
            }
            newMatrix.setColumn(i, column);
          }
          return newMatrix;
        }
        flipRows() {
          const middle = Math.ceil(this.columns / 2);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < middle; j++) {
              let first = this.get(i, j);
              let last = this.get(i, this.columns - 1 - j);
              this.set(i, j, last);
              this.set(i, this.columns - 1 - j, first);
            }
          }
          return this;
        }
        flipColumns() {
          const middle = Math.ceil(this.rows / 2);
          for (let j = 0; j < this.columns; j++) {
            for (let i = 0; i < middle; i++) {
              let first = this.get(i, j);
              let last = this.get(this.rows - 1 - i, j);
              this.set(i, j, last);
              this.set(this.rows - 1 - i, j, first);
            }
          }
          return this;
        }
        kroneckerProduct(other) {
          other = Matrix3.checkMatrix(other);
          let m = this.rows;
          let n = this.columns;
          let p = other.rows;
          let q = other.columns;
          let result = new Matrix3(m * p, n * q);
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
              for (let k = 0; k < p; k++) {
                for (let l = 0; l < q; l++) {
                  result.set(p * i + k, q * j + l, this.get(i, j) * other.get(k, l));
                }
              }
            }
          }
          return result;
        }
        kroneckerSum(other) {
          other = Matrix3.checkMatrix(other);
          if (!this.isSquare() || !other.isSquare()) {
            throw new Error("Kronecker Sum needs two Square Matrices");
          }
          let m = this.rows;
          let n = other.rows;
          let AxI = this.kroneckerProduct(Matrix3.eye(n, n));
          let IxB = Matrix3.eye(m, m).kroneckerProduct(other);
          return AxI.add(IxB);
        }
        transpose() {
          let result = new Matrix3(this.columns, this.rows);
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              result.set(j, i, this.get(i, j));
            }
          }
          return result;
        }
        sortRows(compareFunction = compareNumbers) {
          for (let i = 0; i < this.rows; i++) {
            this.setRow(i, this.getRow(i).sort(compareFunction));
          }
          return this;
        }
        sortColumns(compareFunction = compareNumbers) {
          for (let i = 0; i < this.columns; i++) {
            this.setColumn(i, this.getColumn(i).sort(compareFunction));
          }
          return this;
        }
        subMatrix(startRow, endRow, startColumn, endColumn) {
          checkRange(this, startRow, endRow, startColumn, endColumn);
          let newMatrix = new Matrix3(
            endRow - startRow + 1,
            endColumn - startColumn + 1
          );
          for (let i = startRow; i <= endRow; i++) {
            for (let j = startColumn; j <= endColumn; j++) {
              newMatrix.set(i - startRow, j - startColumn, this.get(i, j));
            }
          }
          return newMatrix;
        }
        subMatrixRow(indices, startColumn, endColumn) {
          if (startColumn === void 0) startColumn = 0;
          if (endColumn === void 0) endColumn = this.columns - 1;
          if (startColumn > endColumn || startColumn < 0 || startColumn >= this.columns || endColumn < 0 || endColumn >= this.columns) {
            throw new RangeError("Argument out of range");
          }
          let newMatrix = new Matrix3(indices.length, endColumn - startColumn + 1);
          for (let i = 0; i < indices.length; i++) {
            for (let j = startColumn; j <= endColumn; j++) {
              if (indices[i] < 0 || indices[i] >= this.rows) {
                throw new RangeError(`Row index out of range: ${indices[i]}`);
              }
              newMatrix.set(i, j - startColumn, this.get(indices[i], j));
            }
          }
          return newMatrix;
        }
        subMatrixColumn(indices, startRow, endRow) {
          if (startRow === void 0) startRow = 0;
          if (endRow === void 0) endRow = this.rows - 1;
          if (startRow > endRow || startRow < 0 || startRow >= this.rows || endRow < 0 || endRow >= this.rows) {
            throw new RangeError("Argument out of range");
          }
          let newMatrix = new Matrix3(endRow - startRow + 1, indices.length);
          for (let i = 0; i < indices.length; i++) {
            for (let j = startRow; j <= endRow; j++) {
              if (indices[i] < 0 || indices[i] >= this.columns) {
                throw new RangeError(`Column index out of range: ${indices[i]}`);
              }
              newMatrix.set(j - startRow, i, this.get(j, indices[i]));
            }
          }
          return newMatrix;
        }
        setSubMatrix(matrix2, startRow, startColumn) {
          matrix2 = Matrix3.checkMatrix(matrix2);
          if (matrix2.isEmpty()) {
            return this;
          }
          let endRow = startRow + matrix2.rows - 1;
          let endColumn = startColumn + matrix2.columns - 1;
          checkRange(this, startRow, endRow, startColumn, endColumn);
          for (let i = 0; i < matrix2.rows; i++) {
            for (let j = 0; j < matrix2.columns; j++) {
              this.set(startRow + i, startColumn + j, matrix2.get(i, j));
            }
          }
          return this;
        }
        selection(rowIndices, columnIndices) {
          checkRowIndices(this, rowIndices);
          checkColumnIndices(this, columnIndices);
          let newMatrix = new Matrix3(rowIndices.length, columnIndices.length);
          for (let i = 0; i < rowIndices.length; i++) {
            let rowIndex = rowIndices[i];
            for (let j = 0; j < columnIndices.length; j++) {
              let columnIndex = columnIndices[j];
              newMatrix.set(i, j, this.get(rowIndex, columnIndex));
            }
          }
          return newMatrix;
        }
        trace() {
          let min = Math.min(this.rows, this.columns);
          let trace = 0;
          for (let i = 0; i < min; i++) {
            trace += this.get(i, i);
          }
          return trace;
        }
        clone() {
          return this.constructor.copy(this, new Matrix3(this.rows, this.columns));
        }
        /**
         * @template {AbstractMatrix} M
         * @param {AbstractMatrix} from
         * @param {M} to
         * @return {M}
         */
        static copy(from, to) {
          for (const [row, column, value] of from.entries()) {
            to.set(row, column, value);
          }
          return to;
        }
        sum(by) {
          switch (by) {
            case "row":
              return sumByRow(this);
            case "column":
              return sumByColumn(this);
            case void 0:
              return sumAll(this);
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        product(by) {
          switch (by) {
            case "row":
              return productByRow(this);
            case "column":
              return productByColumn(this);
            case void 0:
              return productAll(this);
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        mean(by) {
          const sum = this.sum(by);
          switch (by) {
            case "row": {
              for (let i = 0; i < this.rows; i++) {
                sum[i] /= this.columns;
              }
              return sum;
            }
            case "column": {
              for (let i = 0; i < this.columns; i++) {
                sum[i] /= this.rows;
              }
              return sum;
            }
            case void 0:
              return sum / this.size;
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        variance(by, options = {}) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { unbiased = true, mean = this.mean(by) } = options;
          if (typeof unbiased !== "boolean") {
            throw new TypeError("unbiased must be a boolean");
          }
          switch (by) {
            case "row": {
              if (!isAnyArray.isAnyArray(mean)) {
                throw new TypeError("mean must be an array");
              }
              return varianceByRow(this, unbiased, mean);
            }
            case "column": {
              if (!isAnyArray.isAnyArray(mean)) {
                throw new TypeError("mean must be an array");
              }
              return varianceByColumn(this, unbiased, mean);
            }
            case void 0: {
              if (typeof mean !== "number") {
                throw new TypeError("mean must be a number");
              }
              return varianceAll(this, unbiased, mean);
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        standardDeviation(by, options) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          const variance = this.variance(by, options);
          if (by === void 0) {
            return Math.sqrt(variance);
          } else {
            for (let i = 0; i < variance.length; i++) {
              variance[i] = Math.sqrt(variance[i]);
            }
            return variance;
          }
        }
        center(by, options = {}) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          const { center = this.mean(by) } = options;
          switch (by) {
            case "row": {
              if (!isAnyArray.isAnyArray(center)) {
                throw new TypeError("center must be an array");
              }
              centerByRow(this, center);
              return this;
            }
            case "column": {
              if (!isAnyArray.isAnyArray(center)) {
                throw new TypeError("center must be an array");
              }
              centerByColumn(this, center);
              return this;
            }
            case void 0: {
              if (typeof center !== "number") {
                throw new TypeError("center must be a number");
              }
              centerAll(this, center);
              return this;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        scale(by, options = {}) {
          if (typeof by === "object") {
            options = by;
            by = void 0;
          }
          if (typeof options !== "object") {
            throw new TypeError("options must be an object");
          }
          let scale = options.scale;
          switch (by) {
            case "row": {
              if (scale === void 0) {
                scale = getScaleByRow(this);
              } else if (!isAnyArray.isAnyArray(scale)) {
                throw new TypeError("scale must be an array");
              }
              scaleByRow(this, scale);
              return this;
            }
            case "column": {
              if (scale === void 0) {
                scale = getScaleByColumn(this);
              } else if (!isAnyArray.isAnyArray(scale)) {
                throw new TypeError("scale must be an array");
              }
              scaleByColumn(this, scale);
              return this;
            }
            case void 0: {
              if (scale === void 0) {
                scale = getScaleAll(this);
              } else if (typeof scale !== "number") {
                throw new TypeError("scale must be a number");
              }
              scaleAll(this, scale);
              return this;
            }
            default:
              throw new Error(`invalid option: ${by}`);
          }
        }
        toString(options) {
          return inspectMatrixWithOptions(this, options);
        }
        [Symbol.iterator]() {
          return this.entries();
        }
        /**
         * iterator from left to right, from top to bottom
         * yield [row, column, value]
         * @returns {Generator<[number, number, number], void, void>}
         */
        *entries() {
          for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
              yield [row, col, this.get(row, col)];
            }
          }
        }
        /**
         * iterator from left to right, from top to bottom
         * yield value
         * @returns {Generator<number, void, void>}
         */
        *values() {
          for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
              yield this.get(row, col);
            }
          }
        }
      };
      AbstractMatrix2.prototype.klass = "Matrix";
      if (typeof Symbol !== "undefined") {
        AbstractMatrix2.prototype[Symbol.for("nodejs.util.inspect.custom")] = inspectMatrix;
      }
      function compareNumbers(a, b) {
        return a - b;
      }
      function isArrayOfNumbers(array) {
        return array.every((element) => {
          return typeof element === "number";
        });
      }
      AbstractMatrix2.random = AbstractMatrix2.rand;
      AbstractMatrix2.randomInt = AbstractMatrix2.randInt;
      AbstractMatrix2.diagonal = AbstractMatrix2.diag;
      AbstractMatrix2.prototype.diagonal = AbstractMatrix2.prototype.diag;
      AbstractMatrix2.identity = AbstractMatrix2.eye;
      AbstractMatrix2.prototype.negate = AbstractMatrix2.prototype.neg;
      AbstractMatrix2.prototype.tensorProduct = AbstractMatrix2.prototype.kroneckerProduct;
      var Matrix3 = class _Matrix extends AbstractMatrix2 {
        /**
         * @type {Float64Array[]}
         */
        data;
        /**
         * Init an empty matrix
         * @param {number} nRows
         * @param {number} nColumns
         */
        #initData(nRows, nColumns) {
          this.data = [];
          if (Number.isInteger(nColumns) && nColumns >= 0) {
            for (let i = 0; i < nRows; i++) {
              this.data.push(new Float64Array(nColumns));
            }
          } else {
            throw new TypeError("nColumns must be a positive integer");
          }
          this.rows = nRows;
          this.columns = nColumns;
        }
        constructor(nRows, nColumns) {
          super();
          if (_Matrix.isMatrix(nRows)) {
            this.#initData(nRows.rows, nRows.columns);
            _Matrix.copy(nRows, this);
          } else if (Number.isInteger(nRows) && nRows >= 0) {
            this.#initData(nRows, nColumns);
          } else if (isAnyArray.isAnyArray(nRows)) {
            const arrayData = nRows;
            nRows = arrayData.length;
            nColumns = nRows ? arrayData[0].length : 0;
            if (typeof nColumns !== "number") {
              throw new TypeError(
                "Data must be a 2D array with at least one element"
              );
            }
            this.data = [];
            for (let i = 0; i < nRows; i++) {
              if (arrayData[i].length !== nColumns) {
                throw new RangeError("Inconsistent array dimensions");
              }
              if (!isArrayOfNumbers(arrayData[i])) {
                throw new TypeError("Input data contains non-numeric values");
              }
              this.data.push(Float64Array.from(arrayData[i]));
            }
            this.rows = nRows;
            this.columns = nColumns;
          } else {
            throw new TypeError(
              "First argument must be a positive number or an array"
            );
          }
        }
        set(rowIndex, columnIndex, value) {
          this.data[rowIndex][columnIndex] = value;
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.data[rowIndex][columnIndex];
        }
        removeRow(index) {
          checkRowIndex(this, index);
          this.data.splice(index, 1);
          this.rows -= 1;
          return this;
        }
        addRow(index, array) {
          if (array === void 0) {
            array = index;
            index = this.rows;
          }
          checkRowIndex(this, index, true);
          array = Float64Array.from(checkRowVector(this, array));
          this.data.splice(index, 0, array);
          this.rows += 1;
          return this;
        }
        removeColumn(index) {
          checkColumnIndex(this, index);
          for (let i = 0; i < this.rows; i++) {
            const newRow = new Float64Array(this.columns - 1);
            for (let j = 0; j < index; j++) {
              newRow[j] = this.data[i][j];
            }
            for (let j = index + 1; j < this.columns; j++) {
              newRow[j - 1] = this.data[i][j];
            }
            this.data[i] = newRow;
          }
          this.columns -= 1;
          return this;
        }
        addColumn(index, array) {
          if (typeof array === "undefined") {
            array = index;
            index = this.columns;
          }
          checkColumnIndex(this, index, true);
          array = checkColumnVector(this, array);
          for (let i = 0; i < this.rows; i++) {
            const newRow = new Float64Array(this.columns + 1);
            let j = 0;
            for (; j < index; j++) {
              newRow[j] = this.data[i][j];
            }
            newRow[j++] = array[i];
            for (; j < this.columns + 1; j++) {
              newRow[j] = this.data[i][j - 1];
            }
            this.data[i] = newRow;
          }
          this.columns += 1;
          return this;
        }
      };
      installMathOperations(AbstractMatrix2, Matrix3);
      var SymmetricMatrix2 = class _SymmetricMatrix extends AbstractMatrix2 {
        /** @type {Matrix} */
        #matrix;
        get size() {
          return this.#matrix.size;
        }
        get rows() {
          return this.#matrix.rows;
        }
        get columns() {
          return this.#matrix.columns;
        }
        get diagonalSize() {
          return this.rows;
        }
        /**
         * not the same as matrix.isSymmetric()
         * Here is to check if it's instanceof SymmetricMatrix without bundling issues
         *
         * @param value
         * @returns {boolean}
         */
        static isSymmetricMatrix(value) {
          return Matrix3.isMatrix(value) && value.klassType === "SymmetricMatrix";
        }
        /**
         * @param diagonalSize
         * @return {SymmetricMatrix}
         */
        static zeros(diagonalSize) {
          return new this(diagonalSize);
        }
        /**
         * @param diagonalSize
         * @return {SymmetricMatrix}
         */
        static ones(diagonalSize) {
          return new this(diagonalSize).fill(1);
        }
        /**
         * @param {number | AbstractMatrix | ArrayLike<ArrayLike<number>>} diagonalSize
         * @return {this}
         */
        constructor(diagonalSize) {
          super();
          if (Matrix3.isMatrix(diagonalSize)) {
            if (!diagonalSize.isSymmetric()) {
              throw new TypeError("not symmetric data");
            }
            this.#matrix = Matrix3.copy(
              diagonalSize,
              new Matrix3(diagonalSize.rows, diagonalSize.rows)
            );
          } else if (Number.isInteger(diagonalSize) && diagonalSize >= 0) {
            this.#matrix = new Matrix3(diagonalSize, diagonalSize);
          } else {
            this.#matrix = new Matrix3(diagonalSize);
            if (!this.isSymmetric()) {
              throw new TypeError("not symmetric data");
            }
          }
        }
        clone() {
          const matrix2 = new _SymmetricMatrix(this.diagonalSize);
          for (const [row, col, value] of this.upperRightEntries()) {
            matrix2.set(row, col, value);
          }
          return matrix2;
        }
        toMatrix() {
          return new Matrix3(this);
        }
        get(rowIndex, columnIndex) {
          return this.#matrix.get(rowIndex, columnIndex);
        }
        set(rowIndex, columnIndex, value) {
          this.#matrix.set(rowIndex, columnIndex, value);
          this.#matrix.set(columnIndex, rowIndex, value);
          return this;
        }
        removeCross(index) {
          this.#matrix.removeRow(index);
          this.#matrix.removeColumn(index);
          return this;
        }
        addCross(index, array) {
          if (array === void 0) {
            array = index;
            index = this.diagonalSize;
          }
          const row = array.slice();
          row.splice(index, 1);
          this.#matrix.addRow(index, row);
          this.#matrix.addColumn(index, array);
          return this;
        }
        /**
         * @param {Mask[]} mask
         */
        applyMask(mask) {
          if (mask.length !== this.diagonalSize) {
            throw new RangeError("Mask size do not match with matrix size");
          }
          const sidesToRemove = [];
          for (const [index, passthroughs] of mask.entries()) {
            if (passthroughs) continue;
            sidesToRemove.push(index);
          }
          sidesToRemove.reverse();
          for (const sideIndex of sidesToRemove) {
            this.removeCross(sideIndex);
          }
          return this;
        }
        /**
         * Compact format upper-right corner of matrix
         * iterate from left to right, from top to bottom.
         *
         * ```
         *   A B C D
         * A 1 2 3 4
         * B 2 5 6 7
         * C 3 6 8 9
         * D 4 7 9 10
         * ```
         *
         * will return compact 1D array `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
         *
         * length is S(i=0, n=sideSize) => 10 for a 4 sideSized matrix
         *
         * @returns {number[]}
         */
        toCompact() {
          const { diagonalSize } = this;
          const compact = new Array(diagonalSize * (diagonalSize + 1) / 2);
          for (let col = 0, row = 0, index = 0; index < compact.length; index++) {
            compact[index] = this.get(row, col);
            if (++col >= diagonalSize) col = ++row;
          }
          return compact;
        }
        /**
         * @param {number[]} compact
         * @return {SymmetricMatrix}
         */
        static fromCompact(compact) {
          const compactSize = compact.length;
          const diagonalSize = (Math.sqrt(8 * compactSize + 1) - 1) / 2;
          if (!Number.isInteger(diagonalSize)) {
            throw new TypeError(
              `This array is not a compact representation of a Symmetric Matrix, ${JSON.stringify(
                compact
              )}`
            );
          }
          const matrix2 = new _SymmetricMatrix(diagonalSize);
          for (let col = 0, row = 0, index = 0; index < compactSize; index++) {
            matrix2.set(col, row, compact[index]);
            if (++col >= diagonalSize) col = ++row;
          }
          return matrix2;
        }
        /**
         * half iterator upper-right-corner from left to right, from top to bottom
         * yield [row, column, value]
         *
         * @returns {Generator<[number, number, number], void, void>}
         */
        *upperRightEntries() {
          for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
            const value = this.get(row, col);
            yield [row, col, value];
            if (++col >= this.diagonalSize) col = ++row;
          }
        }
        /**
         * half iterator upper-right-corner from left to right, from top to bottom
         * yield value
         *
         * @returns {Generator<[number, number, number], void, void>}
         */
        *upperRightValues() {
          for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
            const value = this.get(row, col);
            yield value;
            if (++col >= this.diagonalSize) col = ++row;
          }
        }
      };
      SymmetricMatrix2.prototype.klassType = "SymmetricMatrix";
      var DistanceMatrix2 = class _DistanceMatrix extends SymmetricMatrix2 {
        /**
         * not the same as matrix.isSymmetric()
         * Here is to check if it's instanceof SymmetricMatrix without bundling issues
         *
         * @param value
         * @returns {boolean}
         */
        static isDistanceMatrix(value) {
          return SymmetricMatrix2.isSymmetricMatrix(value) && value.klassSubType === "DistanceMatrix";
        }
        constructor(sideSize) {
          super(sideSize);
          if (!this.isDistance()) {
            throw new TypeError("Provided arguments do no produce a distance matrix");
          }
        }
        set(rowIndex, columnIndex, value) {
          if (rowIndex === columnIndex) value = 0;
          return super.set(rowIndex, columnIndex, value);
        }
        addCross(index, array) {
          if (array === void 0) {
            array = index;
            index = this.diagonalSize;
          }
          array = array.slice();
          array[index] = 0;
          return super.addCross(index, array);
        }
        toSymmetricMatrix() {
          return new SymmetricMatrix2(this);
        }
        clone() {
          const matrix2 = new _DistanceMatrix(this.diagonalSize);
          for (const [row, col, value] of this.upperRightEntries()) {
            if (row === col) continue;
            matrix2.set(row, col, value);
          }
          return matrix2;
        }
        /**
         * Compact format upper-right corner of matrix
         * no diagonal (only zeros)
         * iterable from left to right, from top to bottom.
         *
         * ```
         *   A B C D
         * A 0 1 2 3
         * B 1 0 4 5
         * C 2 4 0 6
         * D 3 5 6 0
         * ```
         *
         * will return compact 1D array `[1, 2, 3, 4, 5, 6]`
         *
         * length is S(i=0, n=sideSize-1) => 6 for a 4 side sized matrix
         *
         * @returns {number[]}
         */
        toCompact() {
          const { diagonalSize } = this;
          const compactLength = (diagonalSize - 1) * diagonalSize / 2;
          const compact = new Array(compactLength);
          for (let col = 1, row = 0, index = 0; index < compact.length; index++) {
            compact[index] = this.get(row, col);
            if (++col >= diagonalSize) col = ++row + 1;
          }
          return compact;
        }
        /**
         * @param {number[]} compact
         */
        static fromCompact(compact) {
          const compactSize = compact.length;
          if (compactSize === 0) {
            return new this(0);
          }
          const diagonalSize = (Math.sqrt(8 * compactSize + 1) + 1) / 2;
          if (!Number.isInteger(diagonalSize)) {
            throw new TypeError(
              `This array is not a compact representation of a DistanceMatrix, ${JSON.stringify(
                compact
              )}`
            );
          }
          const matrix2 = new this(diagonalSize);
          for (let col = 1, row = 0, index = 0; index < compactSize; index++) {
            matrix2.set(col, row, compact[index]);
            if (++col >= diagonalSize) col = ++row + 1;
          }
          return matrix2;
        }
      };
      DistanceMatrix2.prototype.klassSubType = "DistanceMatrix";
      var BaseView = class extends AbstractMatrix2 {
        constructor(matrix2, rows, columns) {
          super();
          this.matrix = matrix2;
          this.rows = rows;
          this.columns = columns;
        }
      };
      var MatrixColumnView2 = class extends BaseView {
        constructor(matrix2, column) {
          checkColumnIndex(matrix2, column);
          super(matrix2, matrix2.rows, 1);
          this.column = column;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(rowIndex, this.column, value);
          return this;
        }
        get(rowIndex) {
          return this.matrix.get(rowIndex, this.column);
        }
      };
      var MatrixColumnSelectionView2 = class extends BaseView {
        constructor(matrix2, columnIndices) {
          checkColumnIndices(matrix2, columnIndices);
          super(matrix2, matrix2.rows, columnIndices.length);
          this.columnIndices = columnIndices;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(rowIndex, this.columnIndices[columnIndex], value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(rowIndex, this.columnIndices[columnIndex]);
        }
      };
      var MatrixFlipColumnView2 = class extends BaseView {
        constructor(matrix2) {
          super(matrix2, matrix2.rows, matrix2.columns);
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(rowIndex, this.columns - columnIndex - 1, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(rowIndex, this.columns - columnIndex - 1);
        }
      };
      var MatrixFlipRowView2 = class extends BaseView {
        constructor(matrix2) {
          super(matrix2, matrix2.rows, matrix2.columns);
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(this.rows - rowIndex - 1, columnIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(this.rows - rowIndex - 1, columnIndex);
        }
      };
      var MatrixRowView2 = class extends BaseView {
        constructor(matrix2, row) {
          checkRowIndex(matrix2, row);
          super(matrix2, 1, matrix2.columns);
          this.row = row;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(this.row, columnIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(this.row, columnIndex);
        }
      };
      var MatrixRowSelectionView2 = class extends BaseView {
        constructor(matrix2, rowIndices) {
          checkRowIndices(matrix2, rowIndices);
          super(matrix2, rowIndices.length, matrix2.columns);
          this.rowIndices = rowIndices;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(this.rowIndices[rowIndex], columnIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(this.rowIndices[rowIndex], columnIndex);
        }
      };
      var MatrixSelectionView2 = class extends BaseView {
        constructor(matrix2, rowIndices, columnIndices) {
          checkRowIndices(matrix2, rowIndices);
          checkColumnIndices(matrix2, columnIndices);
          super(matrix2, rowIndices.length, columnIndices.length);
          this.rowIndices = rowIndices;
          this.columnIndices = columnIndices;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(
            this.rowIndices[rowIndex],
            this.columnIndices[columnIndex],
            value
          );
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(
            this.rowIndices[rowIndex],
            this.columnIndices[columnIndex]
          );
        }
      };
      var MatrixSubView2 = class extends BaseView {
        constructor(matrix2, startRow, endRow, startColumn, endColumn) {
          checkRange(matrix2, startRow, endRow, startColumn, endColumn);
          super(matrix2, endRow - startRow + 1, endColumn - startColumn + 1);
          this.startRow = startRow;
          this.startColumn = startColumn;
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(
            this.startRow + rowIndex,
            this.startColumn + columnIndex,
            value
          );
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(
            this.startRow + rowIndex,
            this.startColumn + columnIndex
          );
        }
      };
      var MatrixTransposeView2 = class extends BaseView {
        constructor(matrix2) {
          super(matrix2, matrix2.columns, matrix2.rows);
        }
        set(rowIndex, columnIndex, value) {
          this.matrix.set(columnIndex, rowIndex, value);
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.matrix.get(columnIndex, rowIndex);
        }
      };
      var WrapperMatrix1D2 = class extends AbstractMatrix2 {
        constructor(data, options = {}) {
          const { rows = 1 } = options;
          if (data.length % rows !== 0) {
            throw new Error("the data length is not divisible by the number of rows");
          }
          super();
          this.rows = rows;
          this.columns = data.length / rows;
          this.data = data;
        }
        set(rowIndex, columnIndex, value) {
          let index = this._calculateIndex(rowIndex, columnIndex);
          this.data[index] = value;
          return this;
        }
        get(rowIndex, columnIndex) {
          let index = this._calculateIndex(rowIndex, columnIndex);
          return this.data[index];
        }
        _calculateIndex(row, column) {
          return row * this.columns + column;
        }
      };
      var WrapperMatrix2D2 = class extends AbstractMatrix2 {
        constructor(data) {
          super();
          this.data = data;
          this.rows = data.length;
          this.columns = data[0].length;
        }
        set(rowIndex, columnIndex, value) {
          this.data[rowIndex][columnIndex] = value;
          return this;
        }
        get(rowIndex, columnIndex) {
          return this.data[rowIndex][columnIndex];
        }
      };
      function wrap2(array, options) {
        if (isAnyArray.isAnyArray(array)) {
          if (array[0] && isAnyArray.isAnyArray(array[0])) {
            return new WrapperMatrix2D2(array);
          } else {
            return new WrapperMatrix1D2(array, options);
          }
        } else {
          throw new Error("the argument is not an array");
        }
      }
      var LuDecomposition2 = class {
        constructor(matrix2) {
          matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
          let lu = matrix2.clone();
          let rows = lu.rows;
          let columns = lu.columns;
          let pivotVector = new Float64Array(rows);
          let pivotSign = 1;
          let i, j, k, p, s, t, v;
          let LUcolj, kmax;
          for (i = 0; i < rows; i++) {
            pivotVector[i] = i;
          }
          LUcolj = new Float64Array(rows);
          for (j = 0; j < columns; j++) {
            for (i = 0; i < rows; i++) {
              LUcolj[i] = lu.get(i, j);
            }
            for (i = 0; i < rows; i++) {
              kmax = Math.min(i, j);
              s = 0;
              for (k = 0; k < kmax; k++) {
                s += lu.get(i, k) * LUcolj[k];
              }
              LUcolj[i] -= s;
              lu.set(i, j, LUcolj[i]);
            }
            p = j;
            for (i = j + 1; i < rows; i++) {
              if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p])) {
                p = i;
              }
            }
            if (p !== j) {
              for (k = 0; k < columns; k++) {
                t = lu.get(p, k);
                lu.set(p, k, lu.get(j, k));
                lu.set(j, k, t);
              }
              v = pivotVector[p];
              pivotVector[p] = pivotVector[j];
              pivotVector[j] = v;
              pivotSign = -pivotSign;
            }
            if (j < rows && lu.get(j, j) !== 0) {
              for (i = j + 1; i < rows; i++) {
                lu.set(i, j, lu.get(i, j) / lu.get(j, j));
              }
            }
          }
          this.LU = lu;
          this.pivotVector = pivotVector;
          this.pivotSign = pivotSign;
        }
        isSingular() {
          let data = this.LU;
          let col = data.columns;
          for (let j = 0; j < col; j++) {
            if (data.get(j, j) === 0) {
              return true;
            }
          }
          return false;
        }
        solve(value) {
          value = Matrix3.checkMatrix(value);
          let lu = this.LU;
          let rows = lu.rows;
          if (rows !== value.rows) {
            throw new Error("Invalid matrix dimensions");
          }
          if (this.isSingular()) {
            throw new Error("LU matrix is singular");
          }
          let count = value.columns;
          let X = value.subMatrixRow(this.pivotVector, 0, count - 1);
          let columns = lu.columns;
          let i, j, k;
          for (k = 0; k < columns; k++) {
            for (i = k + 1; i < columns; i++) {
              for (j = 0; j < count; j++) {
                X.set(i, j, X.get(i, j) - X.get(k, j) * lu.get(i, k));
              }
            }
          }
          for (k = columns - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
              X.set(k, j, X.get(k, j) / lu.get(k, k));
            }
            for (i = 0; i < k; i++) {
              for (j = 0; j < count; j++) {
                X.set(i, j, X.get(i, j) - X.get(k, j) * lu.get(i, k));
              }
            }
          }
          return X;
        }
        get determinant() {
          let data = this.LU;
          if (!data.isSquare()) {
            throw new Error("Matrix must be square");
          }
          let determinant3 = this.pivotSign;
          let col = data.columns;
          for (let j = 0; j < col; j++) {
            determinant3 *= data.get(j, j);
          }
          return determinant3;
        }
        get lowerTriangularMatrix() {
          let data = this.LU;
          let rows = data.rows;
          let columns = data.columns;
          let X = new Matrix3(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              if (i > j) {
                X.set(i, j, data.get(i, j));
              } else if (i === j) {
                X.set(i, j, 1);
              } else {
                X.set(i, j, 0);
              }
            }
          }
          return X;
        }
        get upperTriangularMatrix() {
          let data = this.LU;
          let rows = data.rows;
          let columns = data.columns;
          let X = new Matrix3(rows, columns);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              if (i <= j) {
                X.set(i, j, data.get(i, j));
              } else {
                X.set(i, j, 0);
              }
            }
          }
          return X;
        }
        get pivotPermutationVector() {
          return Array.from(this.pivotVector);
        }
      };
      function hypotenuse(a, b) {
        let r = 0;
        if (Math.abs(a) > Math.abs(b)) {
          r = b / a;
          return Math.abs(a) * Math.sqrt(1 + r * r);
        }
        if (b !== 0) {
          r = a / b;
          return Math.abs(b) * Math.sqrt(1 + r * r);
        }
        return 0;
      }
      var QrDecomposition2 = class {
        constructor(value) {
          value = WrapperMatrix2D2.checkMatrix(value);
          let qr = value.clone();
          let m = value.rows;
          let n = value.columns;
          let rdiag = new Float64Array(n);
          let i, j, k, s;
          for (k = 0; k < n; k++) {
            let nrm = 0;
            for (i = k; i < m; i++) {
              nrm = hypotenuse(nrm, qr.get(i, k));
            }
            if (nrm !== 0) {
              if (qr.get(k, k) < 0) {
                nrm = -nrm;
              }
              for (i = k; i < m; i++) {
                qr.set(i, k, qr.get(i, k) / nrm);
              }
              qr.set(k, k, qr.get(k, k) + 1);
              for (j = k + 1; j < n; j++) {
                s = 0;
                for (i = k; i < m; i++) {
                  s += qr.get(i, k) * qr.get(i, j);
                }
                s = -s / qr.get(k, k);
                for (i = k; i < m; i++) {
                  qr.set(i, j, qr.get(i, j) + s * qr.get(i, k));
                }
              }
            }
            rdiag[k] = -nrm;
          }
          this.QR = qr;
          this.Rdiag = rdiag;
        }
        solve(value) {
          value = Matrix3.checkMatrix(value);
          let qr = this.QR;
          let m = qr.rows;
          if (value.rows !== m) {
            throw new Error("Matrix row dimensions must agree");
          }
          if (!this.isFullRank()) {
            throw new Error("Matrix is rank deficient");
          }
          let count = value.columns;
          let X = value.clone();
          let n = qr.columns;
          let i, j, k, s;
          for (k = 0; k < n; k++) {
            for (j = 0; j < count; j++) {
              s = 0;
              for (i = k; i < m; i++) {
                s += qr.get(i, k) * X.get(i, j);
              }
              s = -s / qr.get(k, k);
              for (i = k; i < m; i++) {
                X.set(i, j, X.get(i, j) + s * qr.get(i, k));
              }
            }
          }
          for (k = n - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
              X.set(k, j, X.get(k, j) / this.Rdiag[k]);
            }
            for (i = 0; i < k; i++) {
              for (j = 0; j < count; j++) {
                X.set(i, j, X.get(i, j) - X.get(k, j) * qr.get(i, k));
              }
            }
          }
          return X.subMatrix(0, n - 1, 0, count - 1);
        }
        isFullRank() {
          let columns = this.QR.columns;
          for (let i = 0; i < columns; i++) {
            if (this.Rdiag[i] === 0) {
              return false;
            }
          }
          return true;
        }
        get upperTriangularMatrix() {
          let qr = this.QR;
          let n = qr.columns;
          let X = new Matrix3(n, n);
          let i, j;
          for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
              if (i < j) {
                X.set(i, j, qr.get(i, j));
              } else if (i === j) {
                X.set(i, j, this.Rdiag[i]);
              } else {
                X.set(i, j, 0);
              }
            }
          }
          return X;
        }
        get orthogonalMatrix() {
          let qr = this.QR;
          let rows = qr.rows;
          let columns = qr.columns;
          let X = new Matrix3(rows, columns);
          let i, j, k, s;
          for (k = columns - 1; k >= 0; k--) {
            for (i = 0; i < rows; i++) {
              X.set(i, k, 0);
            }
            X.set(k, k, 1);
            for (j = k; j < columns; j++) {
              if (qr.get(k, k) !== 0) {
                s = 0;
                for (i = k; i < rows; i++) {
                  s += qr.get(i, k) * X.get(i, j);
                }
                s = -s / qr.get(k, k);
                for (i = k; i < rows; i++) {
                  X.set(i, j, X.get(i, j) + s * qr.get(i, k));
                }
              }
            }
          }
          return X;
        }
      };
      var SingularValueDecomposition2 = class {
        constructor(value, options = {}) {
          value = WrapperMatrix2D2.checkMatrix(value);
          if (value.isEmpty()) {
            throw new Error("Matrix must be non-empty");
          }
          let m = value.rows;
          let n = value.columns;
          const {
            computeLeftSingularVectors = true,
            computeRightSingularVectors = true,
            autoTranspose = false
          } = options;
          let wantu = Boolean(computeLeftSingularVectors);
          let wantv = Boolean(computeRightSingularVectors);
          let swapped = false;
          let a;
          if (m < n) {
            if (!autoTranspose) {
              a = value.clone();
              console.warn(
                "Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose"
              );
            } else {
              a = value.transpose();
              m = a.rows;
              n = a.columns;
              swapped = true;
              let aux = wantu;
              wantu = wantv;
              wantv = aux;
            }
          } else {
            a = value.clone();
          }
          let nu = Math.min(m, n);
          let ni = Math.min(m + 1, n);
          let s = new Float64Array(ni);
          let U = new Matrix3(m, nu);
          let V = new Matrix3(n, n);
          let e = new Float64Array(n);
          let work = new Float64Array(m);
          let si = new Float64Array(ni);
          for (let i = 0; i < ni; i++) si[i] = i;
          let nct = Math.min(m - 1, n);
          let nrt = Math.max(0, Math.min(n - 2, m));
          let mrc = Math.max(nct, nrt);
          for (let k = 0; k < mrc; k++) {
            if (k < nct) {
              s[k] = 0;
              for (let i = k; i < m; i++) {
                s[k] = hypotenuse(s[k], a.get(i, k));
              }
              if (s[k] !== 0) {
                if (a.get(k, k) < 0) {
                  s[k] = -s[k];
                }
                for (let i = k; i < m; i++) {
                  a.set(i, k, a.get(i, k) / s[k]);
                }
                a.set(k, k, a.get(k, k) + 1);
              }
              s[k] = -s[k];
            }
            for (let j = k + 1; j < n; j++) {
              if (k < nct && s[k] !== 0) {
                let t = 0;
                for (let i = k; i < m; i++) {
                  t += a.get(i, k) * a.get(i, j);
                }
                t = -t / a.get(k, k);
                for (let i = k; i < m; i++) {
                  a.set(i, j, a.get(i, j) + t * a.get(i, k));
                }
              }
              e[j] = a.get(k, j);
            }
            if (wantu && k < nct) {
              for (let i = k; i < m; i++) {
                U.set(i, k, a.get(i, k));
              }
            }
            if (k < nrt) {
              e[k] = 0;
              for (let i = k + 1; i < n; i++) {
                e[k] = hypotenuse(e[k], e[i]);
              }
              if (e[k] !== 0) {
                if (e[k + 1] < 0) {
                  e[k] = 0 - e[k];
                }
                for (let i = k + 1; i < n; i++) {
                  e[i] /= e[k];
                }
                e[k + 1] += 1;
              }
              e[k] = -e[k];
              if (k + 1 < m && e[k] !== 0) {
                for (let i = k + 1; i < m; i++) {
                  work[i] = 0;
                }
                for (let i = k + 1; i < m; i++) {
                  for (let j = k + 1; j < n; j++) {
                    work[i] += e[j] * a.get(i, j);
                  }
                }
                for (let j = k + 1; j < n; j++) {
                  let t = -e[j] / e[k + 1];
                  for (let i = k + 1; i < m; i++) {
                    a.set(i, j, a.get(i, j) + t * work[i]);
                  }
                }
              }
              if (wantv) {
                for (let i = k + 1; i < n; i++) {
                  V.set(i, k, e[i]);
                }
              }
            }
          }
          let p = Math.min(n, m + 1);
          if (nct < n) {
            s[nct] = a.get(nct, nct);
          }
          if (m < p) {
            s[p - 1] = 0;
          }
          if (nrt + 1 < p) {
            e[nrt] = a.get(nrt, p - 1);
          }
          e[p - 1] = 0;
          if (wantu) {
            for (let j = nct; j < nu; j++) {
              for (let i = 0; i < m; i++) {
                U.set(i, j, 0);
              }
              U.set(j, j, 1);
            }
            for (let k = nct - 1; k >= 0; k--) {
              if (s[k] !== 0) {
                for (let j = k + 1; j < nu; j++) {
                  let t = 0;
                  for (let i = k; i < m; i++) {
                    t += U.get(i, k) * U.get(i, j);
                  }
                  t = -t / U.get(k, k);
                  for (let i = k; i < m; i++) {
                    U.set(i, j, U.get(i, j) + t * U.get(i, k));
                  }
                }
                for (let i = k; i < m; i++) {
                  U.set(i, k, -U.get(i, k));
                }
                U.set(k, k, 1 + U.get(k, k));
                for (let i = 0; i < k - 1; i++) {
                  U.set(i, k, 0);
                }
              } else {
                for (let i = 0; i < m; i++) {
                  U.set(i, k, 0);
                }
                U.set(k, k, 1);
              }
            }
          }
          if (wantv) {
            for (let k = n - 1; k >= 0; k--) {
              if (k < nrt && e[k] !== 0) {
                for (let j = k + 1; j < n; j++) {
                  let t = 0;
                  for (let i = k + 1; i < n; i++) {
                    t += V.get(i, k) * V.get(i, j);
                  }
                  t = -t / V.get(k + 1, k);
                  for (let i = k + 1; i < n; i++) {
                    V.set(i, j, V.get(i, j) + t * V.get(i, k));
                  }
                }
              }
              for (let i = 0; i < n; i++) {
                V.set(i, k, 0);
              }
              V.set(k, k, 1);
            }
          }
          let pp = p - 1;
          let eps = Number.EPSILON;
          while (p > 0) {
            let k, kase;
            for (k = p - 2; k >= -1; k--) {
              if (k === -1) {
                break;
              }
              const alpha = Number.MIN_VALUE + eps * Math.abs(s[k] + Math.abs(s[k + 1]));
              if (Math.abs(e[k]) <= alpha || Number.isNaN(e[k])) {
                e[k] = 0;
                break;
              }
            }
            if (k === p - 2) {
              kase = 4;
            } else {
              let ks;
              for (ks = p - 1; ks >= k; ks--) {
                if (ks === k) {
                  break;
                }
                let t = (ks !== p ? Math.abs(e[ks]) : 0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
                if (Math.abs(s[ks]) <= eps * t) {
                  s[ks] = 0;
                  break;
                }
              }
              if (ks === k) {
                kase = 3;
              } else if (ks === p - 1) {
                kase = 1;
              } else {
                kase = 2;
                k = ks;
              }
            }
            k++;
            switch (kase) {
              case 1: {
                let f = e[p - 2];
                e[p - 2] = 0;
                for (let j = p - 2; j >= k; j--) {
                  let t = hypotenuse(s[j], f);
                  let cs = s[j] / t;
                  let sn = f / t;
                  s[j] = t;
                  if (j !== k) {
                    f = -sn * e[j - 1];
                    e[j - 1] = cs * e[j - 1];
                  }
                  if (wantv) {
                    for (let i = 0; i < n; i++) {
                      t = cs * V.get(i, j) + sn * V.get(i, p - 1);
                      V.set(i, p - 1, -sn * V.get(i, j) + cs * V.get(i, p - 1));
                      V.set(i, j, t);
                    }
                  }
                }
                break;
              }
              case 2: {
                let f = e[k - 1];
                e[k - 1] = 0;
                for (let j = k; j < p; j++) {
                  let t = hypotenuse(s[j], f);
                  let cs = s[j] / t;
                  let sn = f / t;
                  s[j] = t;
                  f = -sn * e[j];
                  e[j] = cs * e[j];
                  if (wantu) {
                    for (let i = 0; i < m; i++) {
                      t = cs * U.get(i, j) + sn * U.get(i, k - 1);
                      U.set(i, k - 1, -sn * U.get(i, j) + cs * U.get(i, k - 1));
                      U.set(i, j, t);
                    }
                  }
                }
                break;
              }
              case 3: {
                const scale = Math.max(
                  Math.abs(s[p - 1]),
                  Math.abs(s[p - 2]),
                  Math.abs(e[p - 2]),
                  Math.abs(s[k]),
                  Math.abs(e[k])
                );
                const sp = s[p - 1] / scale;
                const spm1 = s[p - 2] / scale;
                const epm1 = e[p - 2] / scale;
                const sk = s[k] / scale;
                const ek = e[k] / scale;
                const b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
                const c = sp * epm1 * (sp * epm1);
                let shift = 0;
                if (b !== 0 || c !== 0) {
                  if (b < 0) {
                    shift = 0 - Math.sqrt(b * b + c);
                  } else {
                    shift = Math.sqrt(b * b + c);
                  }
                  shift = c / (b + shift);
                }
                let f = (sk + sp) * (sk - sp) + shift;
                let g = sk * ek;
                for (let j = k; j < p - 1; j++) {
                  let t = hypotenuse(f, g);
                  if (t === 0) t = Number.MIN_VALUE;
                  let cs = f / t;
                  let sn = g / t;
                  if (j !== k) {
                    e[j - 1] = t;
                  }
                  f = cs * s[j] + sn * e[j];
                  e[j] = cs * e[j] - sn * s[j];
                  g = sn * s[j + 1];
                  s[j + 1] = cs * s[j + 1];
                  if (wantv) {
                    for (let i = 0; i < n; i++) {
                      t = cs * V.get(i, j) + sn * V.get(i, j + 1);
                      V.set(i, j + 1, -sn * V.get(i, j) + cs * V.get(i, j + 1));
                      V.set(i, j, t);
                    }
                  }
                  t = hypotenuse(f, g);
                  if (t === 0) t = Number.MIN_VALUE;
                  cs = f / t;
                  sn = g / t;
                  s[j] = t;
                  f = cs * e[j] + sn * s[j + 1];
                  s[j + 1] = -sn * e[j] + cs * s[j + 1];
                  g = sn * e[j + 1];
                  e[j + 1] = cs * e[j + 1];
                  if (wantu && j < m - 1) {
                    for (let i = 0; i < m; i++) {
                      t = cs * U.get(i, j) + sn * U.get(i, j + 1);
                      U.set(i, j + 1, -sn * U.get(i, j) + cs * U.get(i, j + 1));
                      U.set(i, j, t);
                    }
                  }
                }
                e[p - 2] = f;
                break;
              }
              case 4: {
                if (s[k] <= 0) {
                  s[k] = s[k] < 0 ? -s[k] : 0;
                  if (wantv) {
                    for (let i = 0; i <= pp; i++) {
                      V.set(i, k, -V.get(i, k));
                    }
                  }
                }
                while (k < pp) {
                  if (s[k] >= s[k + 1]) {
                    break;
                  }
                  let t = s[k];
                  s[k] = s[k + 1];
                  s[k + 1] = t;
                  if (wantv && k < n - 1) {
                    for (let i = 0; i < n; i++) {
                      t = V.get(i, k + 1);
                      V.set(i, k + 1, V.get(i, k));
                      V.set(i, k, t);
                    }
                  }
                  if (wantu && k < m - 1) {
                    for (let i = 0; i < m; i++) {
                      t = U.get(i, k + 1);
                      U.set(i, k + 1, U.get(i, k));
                      U.set(i, k, t);
                    }
                  }
                  k++;
                }
                p--;
                break;
              }
            }
          }
          if (swapped) {
            let tmp = V;
            V = U;
            U = tmp;
          }
          this.m = m;
          this.n = n;
          this.s = s;
          this.U = U;
          this.V = V;
        }
        solve(value) {
          let Y = value;
          let e = this.threshold;
          let scols = this.s.length;
          let Ls = Matrix3.zeros(scols, scols);
          for (let i = 0; i < scols; i++) {
            if (Math.abs(this.s[i]) <= e) {
              Ls.set(i, i, 0);
            } else {
              Ls.set(i, i, 1 / this.s[i]);
            }
          }
          let U = this.U;
          let V = this.rightSingularVectors;
          let VL = V.mmul(Ls);
          let vrows = V.rows;
          let urows = U.rows;
          let VLU = Matrix3.zeros(vrows, urows);
          for (let i = 0; i < vrows; i++) {
            for (let j = 0; j < urows; j++) {
              let sum = 0;
              for (let k = 0; k < scols; k++) {
                sum += VL.get(i, k) * U.get(j, k);
              }
              VLU.set(i, j, sum);
            }
          }
          return VLU.mmul(Y);
        }
        solveForDiagonal(value) {
          return this.solve(Matrix3.diag(value));
        }
        inverse() {
          let V = this.V;
          let e = this.threshold;
          let vrows = V.rows;
          let vcols = V.columns;
          let X = new Matrix3(vrows, this.s.length);
          for (let i = 0; i < vrows; i++) {
            for (let j = 0; j < vcols; j++) {
              if (Math.abs(this.s[j]) > e) {
                X.set(i, j, V.get(i, j) / this.s[j]);
              }
            }
          }
          let U = this.U;
          let urows = U.rows;
          let ucols = U.columns;
          let Y = new Matrix3(vrows, urows);
          for (let i = 0; i < vrows; i++) {
            for (let j = 0; j < urows; j++) {
              let sum = 0;
              for (let k = 0; k < ucols; k++) {
                sum += X.get(i, k) * U.get(j, k);
              }
              Y.set(i, j, sum);
            }
          }
          return Y;
        }
        get condition() {
          return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
        }
        get norm2() {
          return this.s[0];
        }
        get rank() {
          let tol = Math.max(this.m, this.n) * this.s[0] * Number.EPSILON;
          let r = 0;
          let s = this.s;
          for (let i = 0, ii = s.length; i < ii; i++) {
            if (s[i] > tol) {
              r++;
            }
          }
          return r;
        }
        get diagonal() {
          return Array.from(this.s);
        }
        get threshold() {
          return Number.EPSILON / 2 * Math.max(this.m, this.n) * this.s[0];
        }
        get leftSingularVectors() {
          return this.U;
        }
        get rightSingularVectors() {
          return this.V;
        }
        get diagonalMatrix() {
          return Matrix3.diag(this.s);
        }
      };
      function inverse3(matrix2, useSVD = false) {
        matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
        if (useSVD) {
          return new SingularValueDecomposition2(matrix2).inverse();
        } else {
          return solve2(matrix2, Matrix3.eye(matrix2.rows));
        }
      }
      function solve2(leftHandSide, rightHandSide, useSVD = false) {
        leftHandSide = WrapperMatrix2D2.checkMatrix(leftHandSide);
        rightHandSide = WrapperMatrix2D2.checkMatrix(rightHandSide);
        if (useSVD) {
          return new SingularValueDecomposition2(leftHandSide).solve(rightHandSide);
        } else {
          return leftHandSide.isSquare() ? new LuDecomposition2(leftHandSide).solve(rightHandSide) : new QrDecomposition2(leftHandSide).solve(rightHandSide);
        }
      }
      function determinant2(matrix2) {
        matrix2 = Matrix3.checkMatrix(matrix2);
        if (matrix2.isSquare()) {
          if (matrix2.columns === 0) {
            return 1;
          }
          let a, b, c, d;
          if (matrix2.columns === 2) {
            a = matrix2.get(0, 0);
            b = matrix2.get(0, 1);
            c = matrix2.get(1, 0);
            d = matrix2.get(1, 1);
            return a * d - b * c;
          } else if (matrix2.columns === 3) {
            let subMatrix0, subMatrix1, subMatrix2;
            subMatrix0 = new MatrixSelectionView2(matrix2, [1, 2], [1, 2]);
            subMatrix1 = new MatrixSelectionView2(matrix2, [1, 2], [0, 2]);
            subMatrix2 = new MatrixSelectionView2(matrix2, [1, 2], [0, 1]);
            a = matrix2.get(0, 0);
            b = matrix2.get(0, 1);
            c = matrix2.get(0, 2);
            return a * determinant2(subMatrix0) - b * determinant2(subMatrix1) + c * determinant2(subMatrix2);
          } else {
            return new LuDecomposition2(matrix2).determinant;
          }
        } else {
          throw Error("determinant can only be calculated for a square matrix");
        }
      }
      function xrange(n, exception) {
        let range = [];
        for (let i = 0; i < n; i++) {
          if (i !== exception) {
            range.push(i);
          }
        }
        return range;
      }
      function dependenciesOneRow(error, matrix2, index, thresholdValue = 1e-9, thresholdError = 1e-9) {
        if (error > thresholdError) {
          return new Array(matrix2.rows + 1).fill(0);
        } else {
          let returnArray = matrix2.addRow(index, [0]);
          for (let i = 0; i < returnArray.rows; i++) {
            if (Math.abs(returnArray.get(i, 0)) < thresholdValue) {
              returnArray.set(i, 0, 0);
            }
          }
          return returnArray.to1DArray();
        }
      }
      function linearDependencies2(matrix2, options = {}) {
        const { thresholdValue = 1e-9, thresholdError = 1e-9 } = options;
        matrix2 = Matrix3.checkMatrix(matrix2);
        let n = matrix2.rows;
        let results = new Matrix3(n, n);
        for (let i = 0; i < n; i++) {
          let b = Matrix3.columnVector(matrix2.getRow(i));
          let Abis = matrix2.subMatrixRow(xrange(n, i)).transpose();
          let svd = new SingularValueDecomposition2(Abis);
          let x = svd.solve(b);
          let error = Matrix3.sub(b, Abis.mmul(x)).abs().max();
          results.setRow(
            i,
            dependenciesOneRow(error, x, i, thresholdValue, thresholdError)
          );
        }
        return results;
      }
      function pseudoInverse2(matrix2, threshold = Number.EPSILON) {
        matrix2 = Matrix3.checkMatrix(matrix2);
        if (matrix2.isEmpty()) {
          return matrix2.transpose();
        }
        let svdSolution = new SingularValueDecomposition2(matrix2, { autoTranspose: true });
        let U = svdSolution.leftSingularVectors;
        let V = svdSolution.rightSingularVectors;
        let s = svdSolution.diagonal;
        for (let i = 0; i < s.length; i++) {
          if (Math.abs(s[i]) > threshold) {
            s[i] = 1 / s[i];
          } else {
            s[i] = 0;
          }
        }
        return V.mmul(Matrix3.diag(s).mmul(U.transpose()));
      }
      function covariance2(xMatrix, yMatrix = xMatrix, options = {}) {
        xMatrix = new Matrix3(xMatrix);
        let yIsSame = false;
        if (typeof yMatrix === "object" && !Matrix3.isMatrix(yMatrix) && !isAnyArray.isAnyArray(yMatrix)) {
          options = yMatrix;
          yMatrix = xMatrix;
          yIsSame = true;
        } else {
          yMatrix = new Matrix3(yMatrix);
        }
        if (xMatrix.rows !== yMatrix.rows) {
          throw new TypeError("Both matrices must have the same number of rows");
        }
        const { center = true } = options;
        if (center) {
          xMatrix = xMatrix.center("column");
          if (!yIsSame) {
            yMatrix = yMatrix.center("column");
          }
        }
        const cov = xMatrix.transpose().mmul(yMatrix);
        for (let i = 0; i < cov.rows; i++) {
          for (let j = 0; j < cov.columns; j++) {
            cov.set(i, j, cov.get(i, j) * (1 / (xMatrix.rows - 1)));
          }
        }
        return cov;
      }
      function correlation2(xMatrix, yMatrix = xMatrix, options = {}) {
        xMatrix = new Matrix3(xMatrix);
        let yIsSame = false;
        if (typeof yMatrix === "object" && !Matrix3.isMatrix(yMatrix) && !isAnyArray.isAnyArray(yMatrix)) {
          options = yMatrix;
          yMatrix = xMatrix;
          yIsSame = true;
        } else {
          yMatrix = new Matrix3(yMatrix);
        }
        if (xMatrix.rows !== yMatrix.rows) {
          throw new TypeError("Both matrices must have the same number of rows");
        }
        const { center = true, scale = true } = options;
        if (center) {
          xMatrix.center("column");
          if (!yIsSame) {
            yMatrix.center("column");
          }
        }
        if (scale) {
          xMatrix.scale("column");
          if (!yIsSame) {
            yMatrix.scale("column");
          }
        }
        const sdx = xMatrix.standardDeviation("column", { unbiased: true });
        const sdy = yIsSame ? sdx : yMatrix.standardDeviation("column", { unbiased: true });
        const corr = xMatrix.transpose().mmul(yMatrix);
        for (let i = 0; i < corr.rows; i++) {
          for (let j = 0; j < corr.columns; j++) {
            corr.set(
              i,
              j,
              corr.get(i, j) * (1 / (sdx[i] * sdy[j])) * (1 / (xMatrix.rows - 1))
            );
          }
        }
        return corr;
      }
      var EigenvalueDecomposition2 = class {
        constructor(matrix2, options = {}) {
          const { assumeSymmetric = false } = options;
          matrix2 = WrapperMatrix2D2.checkMatrix(matrix2);
          if (!matrix2.isSquare()) {
            throw new Error("Matrix is not a square matrix");
          }
          if (matrix2.isEmpty()) {
            throw new Error("Matrix must be non-empty");
          }
          let n = matrix2.columns;
          let V = new Matrix3(n, n);
          let d = new Float64Array(n);
          let e = new Float64Array(n);
          let value = matrix2;
          let i, j;
          let isSymmetric = false;
          if (assumeSymmetric) {
            isSymmetric = true;
          } else {
            isSymmetric = matrix2.isSymmetric();
          }
          if (isSymmetric) {
            for (i = 0; i < n; i++) {
              for (j = 0; j < n; j++) {
                V.set(i, j, value.get(i, j));
              }
            }
            tred2(n, e, d, V);
            tql2(n, e, d, V);
          } else {
            let H = new Matrix3(n, n);
            let ort = new Float64Array(n);
            for (j = 0; j < n; j++) {
              for (i = 0; i < n; i++) {
                H.set(i, j, value.get(i, j));
              }
            }
            orthes(n, H, ort, V);
            hqr2(n, e, d, V, H);
          }
          this.n = n;
          this.e = e;
          this.d = d;
          this.V = V;
        }
        get realEigenvalues() {
          return Array.from(this.d);
        }
        get imaginaryEigenvalues() {
          return Array.from(this.e);
        }
        get eigenvectorMatrix() {
          return this.V;
        }
        get diagonalMatrix() {
          let n = this.n;
          let e = this.e;
          let d = this.d;
          let X = new Matrix3(n, n);
          let i, j;
          for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
              X.set(i, j, 0);
            }
            X.set(i, i, d[i]);
            if (e[i] > 0) {
              X.set(i, i + 1, e[i]);
            } else if (e[i] < 0) {
              X.set(i, i - 1, e[i]);
            }
          }
          return X;
        }
      };
      function tred2(n, e, d, V) {
        let f, g, h, i, j, k, hh, scale;
        for (j = 0; j < n; j++) {
          d[j] = V.get(n - 1, j);
        }
        for (i = n - 1; i > 0; i--) {
          scale = 0;
          h = 0;
          for (k = 0; k < i; k++) {
            scale = scale + Math.abs(d[k]);
          }
          if (scale === 0) {
            e[i] = d[i - 1];
            for (j = 0; j < i; j++) {
              d[j] = V.get(i - 1, j);
              V.set(i, j, 0);
              V.set(j, i, 0);
            }
          } else {
            for (k = 0; k < i; k++) {
              d[k] /= scale;
              h += d[k] * d[k];
            }
            f = d[i - 1];
            g = Math.sqrt(h);
            if (f > 0) {
              g = -g;
            }
            e[i] = scale * g;
            h = h - f * g;
            d[i - 1] = f - g;
            for (j = 0; j < i; j++) {
              e[j] = 0;
            }
            for (j = 0; j < i; j++) {
              f = d[j];
              V.set(j, i, f);
              g = e[j] + V.get(j, j) * f;
              for (k = j + 1; k <= i - 1; k++) {
                g += V.get(k, j) * d[k];
                e[k] += V.get(k, j) * f;
              }
              e[j] = g;
            }
            f = 0;
            for (j = 0; j < i; j++) {
              e[j] /= h;
              f += e[j] * d[j];
            }
            hh = f / (h + h);
            for (j = 0; j < i; j++) {
              e[j] -= hh * d[j];
            }
            for (j = 0; j < i; j++) {
              f = d[j];
              g = e[j];
              for (k = j; k <= i - 1; k++) {
                V.set(k, j, V.get(k, j) - (f * e[k] + g * d[k]));
              }
              d[j] = V.get(i - 1, j);
              V.set(i, j, 0);
            }
          }
          d[i] = h;
        }
        for (i = 0; i < n - 1; i++) {
          V.set(n - 1, i, V.get(i, i));
          V.set(i, i, 1);
          h = d[i + 1];
          if (h !== 0) {
            for (k = 0; k <= i; k++) {
              d[k] = V.get(k, i + 1) / h;
            }
            for (j = 0; j <= i; j++) {
              g = 0;
              for (k = 0; k <= i; k++) {
                g += V.get(k, i + 1) * V.get(k, j);
              }
              for (k = 0; k <= i; k++) {
                V.set(k, j, V.get(k, j) - g * d[k]);
              }
            }
          }
          for (k = 0; k <= i; k++) {
            V.set(k, i + 1, 0);
          }
        }
        for (j = 0; j < n; j++) {
          d[j] = V.get(n - 1, j);
          V.set(n - 1, j, 0);
        }
        V.set(n - 1, n - 1, 1);
        e[0] = 0;
      }
      function tql2(n, e, d, V) {
        let g, h, i, j, k, l, m, p, r, dl1, c, c2, c3, el1, s, s2;
        for (i = 1; i < n; i++) {
          e[i - 1] = e[i];
        }
        e[n - 1] = 0;
        let f = 0;
        let tst1 = 0;
        let eps = Number.EPSILON;
        for (l = 0; l < n; l++) {
          tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
          m = l;
          while (m < n) {
            if (Math.abs(e[m]) <= eps * tst1) {
              break;
            }
            m++;
          }
          if (m > l) {
            do {
              g = d[l];
              p = (d[l + 1] - g) / (2 * e[l]);
              r = hypotenuse(p, 1);
              if (p < 0) {
                r = -r;
              }
              d[l] = e[l] / (p + r);
              d[l + 1] = e[l] * (p + r);
              dl1 = d[l + 1];
              h = g - d[l];
              for (i = l + 2; i < n; i++) {
                d[i] -= h;
              }
              f = f + h;
              p = d[m];
              c = 1;
              c2 = c;
              c3 = c;
              el1 = e[l + 1];
              s = 0;
              s2 = 0;
              for (i = m - 1; i >= l; i--) {
                c3 = c2;
                c2 = c;
                s2 = s;
                g = c * e[i];
                h = c * p;
                r = hypotenuse(p, e[i]);
                e[i + 1] = s * r;
                s = e[i] / r;
                c = p / r;
                p = c * d[i] - s * g;
                d[i + 1] = h + s * (c * g + s * d[i]);
                for (k = 0; k < n; k++) {
                  h = V.get(k, i + 1);
                  V.set(k, i + 1, s * V.get(k, i) + c * h);
                  V.set(k, i, c * V.get(k, i) - s * h);
                }
              }
              p = -s * s2 * c3 * el1 * e[l] / dl1;
              e[l] = s * p;
              d[l] = c * p;
            } while (Math.abs(e[l]) > eps * tst1);
          }
          d[l] = d[l] + f;
          e[l] = 0;
        }
        for (i = 0; i < n - 1; i++) {
          k = i;
          p = d[i];
          for (j = i + 1; j < n; j++) {
            if (d[j] < p) {
              k = j;
              p = d[j];
            }
          }
          if (k !== i) {
            d[k] = d[i];
            d[i] = p;
            for (j = 0; j < n; j++) {
              p = V.get(j, i);
              V.set(j, i, V.get(j, k));
              V.set(j, k, p);
            }
          }
        }
      }
      function orthes(n, H, ort, V) {
        let low = 0;
        let high = n - 1;
        let f, g, h, i, j, m;
        let scale;
        for (m = low + 1; m <= high - 1; m++) {
          scale = 0;
          for (i = m; i <= high; i++) {
            scale = scale + Math.abs(H.get(i, m - 1));
          }
          if (scale !== 0) {
            h = 0;
            for (i = high; i >= m; i--) {
              ort[i] = H.get(i, m - 1) / scale;
              h += ort[i] * ort[i];
            }
            g = Math.sqrt(h);
            if (ort[m] > 0) {
              g = -g;
            }
            h = h - ort[m] * g;
            ort[m] = ort[m] - g;
            for (j = m; j < n; j++) {
              f = 0;
              for (i = high; i >= m; i--) {
                f += ort[i] * H.get(i, j);
              }
              f = f / h;
              for (i = m; i <= high; i++) {
                H.set(i, j, H.get(i, j) - f * ort[i]);
              }
            }
            for (i = 0; i <= high; i++) {
              f = 0;
              for (j = high; j >= m; j--) {
                f += ort[j] * H.get(i, j);
              }
              f = f / h;
              for (j = m; j <= high; j++) {
                H.set(i, j, H.get(i, j) - f * ort[j]);
              }
            }
            ort[m] = scale * ort[m];
            H.set(m, m - 1, scale * g);
          }
        }
        for (i = 0; i < n; i++) {
          for (j = 0; j < n; j++) {
            V.set(i, j, i === j ? 1 : 0);
          }
        }
        for (m = high - 1; m >= low + 1; m--) {
          if (H.get(m, m - 1) !== 0) {
            for (i = m + 1; i <= high; i++) {
              ort[i] = H.get(i, m - 1);
            }
            for (j = m; j <= high; j++) {
              g = 0;
              for (i = m; i <= high; i++) {
                g += ort[i] * V.get(i, j);
              }
              g = g / ort[m] / H.get(m, m - 1);
              for (i = m; i <= high; i++) {
                V.set(i, j, V.get(i, j) + g * ort[i]);
              }
            }
          }
        }
      }
      function hqr2(nn, e, d, V, H) {
        let n = nn - 1;
        let low = 0;
        let high = nn - 1;
        let eps = Number.EPSILON;
        let exshift = 0;
        let norm = 0;
        let p = 0;
        let q = 0;
        let r = 0;
        let s = 0;
        let z = 0;
        let iter = 0;
        let i, j, k, l, m, t, w, x, y;
        let ra, sa, vr, vi;
        let notlast, cdivres;
        for (i = 0; i < nn; i++) {
          if (i < low || i > high) {
            d[i] = H.get(i, i);
            e[i] = 0;
          }
          for (j = Math.max(i - 1, 0); j < nn; j++) {
            norm = norm + Math.abs(H.get(i, j));
          }
        }
        while (n >= low) {
          l = n;
          while (l > low) {
            s = Math.abs(H.get(l - 1, l - 1)) + Math.abs(H.get(l, l));
            if (s === 0) {
              s = norm;
            }
            if (Math.abs(H.get(l, l - 1)) < eps * s) {
              break;
            }
            l--;
          }
          if (l === n) {
            H.set(n, n, H.get(n, n) + exshift);
            d[n] = H.get(n, n);
            e[n] = 0;
            n--;
            iter = 0;
          } else if (l === n - 1) {
            w = H.get(n, n - 1) * H.get(n - 1, n);
            p = (H.get(n - 1, n - 1) - H.get(n, n)) / 2;
            q = p * p + w;
            z = Math.sqrt(Math.abs(q));
            H.set(n, n, H.get(n, n) + exshift);
            H.set(n - 1, n - 1, H.get(n - 1, n - 1) + exshift);
            x = H.get(n, n);
            if (q >= 0) {
              z = p >= 0 ? p + z : p - z;
              d[n - 1] = x + z;
              d[n] = d[n - 1];
              if (z !== 0) {
                d[n] = x - w / z;
              }
              e[n - 1] = 0;
              e[n] = 0;
              x = H.get(n, n - 1);
              s = Math.abs(x) + Math.abs(z);
              p = x / s;
              q = z / s;
              r = Math.sqrt(p * p + q * q);
              p = p / r;
              q = q / r;
              for (j = n - 1; j < nn; j++) {
                z = H.get(n - 1, j);
                H.set(n - 1, j, q * z + p * H.get(n, j));
                H.set(n, j, q * H.get(n, j) - p * z);
              }
              for (i = 0; i <= n; i++) {
                z = H.get(i, n - 1);
                H.set(i, n - 1, q * z + p * H.get(i, n));
                H.set(i, n, q * H.get(i, n) - p * z);
              }
              for (i = low; i <= high; i++) {
                z = V.get(i, n - 1);
                V.set(i, n - 1, q * z + p * V.get(i, n));
                V.set(i, n, q * V.get(i, n) - p * z);
              }
            } else {
              d[n - 1] = x + p;
              d[n] = x + p;
              e[n - 1] = z;
              e[n] = -z;
            }
            n = n - 2;
            iter = 0;
          } else {
            x = H.get(n, n);
            y = 0;
            w = 0;
            if (l < n) {
              y = H.get(n - 1, n - 1);
              w = H.get(n, n - 1) * H.get(n - 1, n);
            }
            if (iter === 10) {
              exshift += x;
              for (i = low; i <= n; i++) {
                H.set(i, i, H.get(i, i) - x);
              }
              s = Math.abs(H.get(n, n - 1)) + Math.abs(H.get(n - 1, n - 2));
              x = y = 0.75 * s;
              w = -0.4375 * s * s;
            }
            if (iter === 30) {
              s = (y - x) / 2;
              s = s * s + w;
              if (s > 0) {
                s = Math.sqrt(s);
                if (y < x) {
                  s = -s;
                }
                s = x - w / ((y - x) / 2 + s);
                for (i = low; i <= n; i++) {
                  H.set(i, i, H.get(i, i) - s);
                }
                exshift += s;
                x = y = w = 0.964;
              }
            }
            iter = iter + 1;
            m = n - 2;
            while (m >= l) {
              z = H.get(m, m);
              r = x - z;
              s = y - z;
              p = (r * s - w) / H.get(m + 1, m) + H.get(m, m + 1);
              q = H.get(m + 1, m + 1) - z - r - s;
              r = H.get(m + 2, m + 1);
              s = Math.abs(p) + Math.abs(q) + Math.abs(r);
              p = p / s;
              q = q / s;
              r = r / s;
              if (m === l) {
                break;
              }
              if (Math.abs(H.get(m, m - 1)) * (Math.abs(q) + Math.abs(r)) < eps * (Math.abs(p) * (Math.abs(H.get(m - 1, m - 1)) + Math.abs(z) + Math.abs(H.get(m + 1, m + 1))))) {
                break;
              }
              m--;
            }
            for (i = m + 2; i <= n; i++) {
              H.set(i, i - 2, 0);
              if (i > m + 2) {
                H.set(i, i - 3, 0);
              }
            }
            for (k = m; k <= n - 1; k++) {
              notlast = k !== n - 1;
              if (k !== m) {
                p = H.get(k, k - 1);
                q = H.get(k + 1, k - 1);
                r = notlast ? H.get(k + 2, k - 1) : 0;
                x = Math.abs(p) + Math.abs(q) + Math.abs(r);
                if (x !== 0) {
                  p = p / x;
                  q = q / x;
                  r = r / x;
                }
              }
              if (x === 0) {
                break;
              }
              s = Math.sqrt(p * p + q * q + r * r);
              if (p < 0) {
                s = -s;
              }
              if (s !== 0) {
                if (k !== m) {
                  H.set(k, k - 1, -s * x);
                } else if (l !== m) {
                  H.set(k, k - 1, -H.get(k, k - 1));
                }
                p = p + s;
                x = p / s;
                y = q / s;
                z = r / s;
                q = q / p;
                r = r / p;
                for (j = k; j < nn; j++) {
                  p = H.get(k, j) + q * H.get(k + 1, j);
                  if (notlast) {
                    p = p + r * H.get(k + 2, j);
                    H.set(k + 2, j, H.get(k + 2, j) - p * z);
                  }
                  H.set(k, j, H.get(k, j) - p * x);
                  H.set(k + 1, j, H.get(k + 1, j) - p * y);
                }
                for (i = 0; i <= Math.min(n, k + 3); i++) {
                  p = x * H.get(i, k) + y * H.get(i, k + 1);
                  if (notlast) {
                    p = p + z * H.get(i, k + 2);
                    H.set(i, k + 2, H.get(i, k + 2) - p * r);
                  }
                  H.set(i, k, H.get(i, k) - p);
                  H.set(i, k + 1, H.get(i, k + 1) - p * q);
                }
                for (i = low; i <= high; i++) {
                  p = x * V.get(i, k) + y * V.get(i, k + 1);
                  if (notlast) {
                    p = p + z * V.get(i, k + 2);
                    V.set(i, k + 2, V.get(i, k + 2) - p * r);
                  }
                  V.set(i, k, V.get(i, k) - p);
                  V.set(i, k + 1, V.get(i, k + 1) - p * q);
                }
              }
            }
          }
        }
        if (norm === 0) {
          return;
        }
        for (n = nn - 1; n >= 0; n--) {
          p = d[n];
          q = e[n];
          if (q === 0) {
            l = n;
            H.set(n, n, 1);
            for (i = n - 1; i >= 0; i--) {
              w = H.get(i, i) - p;
              r = 0;
              for (j = l; j <= n; j++) {
                r = r + H.get(i, j) * H.get(j, n);
              }
              if (e[i] < 0) {
                z = w;
                s = r;
              } else {
                l = i;
                if (e[i] === 0) {
                  H.set(i, n, w !== 0 ? -r / w : -r / (eps * norm));
                } else {
                  x = H.get(i, i + 1);
                  y = H.get(i + 1, i);
                  q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
                  t = (x * s - z * r) / q;
                  H.set(i, n, t);
                  H.set(
                    i + 1,
                    n,
                    Math.abs(x) > Math.abs(z) ? (-r - w * t) / x : (-s - y * t) / z
                  );
                }
                t = Math.abs(H.get(i, n));
                if (eps * t * t > 1) {
                  for (j = i; j <= n; j++) {
                    H.set(j, n, H.get(j, n) / t);
                  }
                }
              }
            }
          } else if (q < 0) {
            l = n - 1;
            if (Math.abs(H.get(n, n - 1)) > Math.abs(H.get(n - 1, n))) {
              H.set(n - 1, n - 1, q / H.get(n, n - 1));
              H.set(n - 1, n, -(H.get(n, n) - p) / H.get(n, n - 1));
            } else {
              cdivres = cdiv(0, -H.get(n - 1, n), H.get(n - 1, n - 1) - p, q);
              H.set(n - 1, n - 1, cdivres[0]);
              H.set(n - 1, n, cdivres[1]);
            }
            H.set(n, n - 1, 0);
            H.set(n, n, 1);
            for (i = n - 2; i >= 0; i--) {
              ra = 0;
              sa = 0;
              for (j = l; j <= n; j++) {
                ra = ra + H.get(i, j) * H.get(j, n - 1);
                sa = sa + H.get(i, j) * H.get(j, n);
              }
              w = H.get(i, i) - p;
              if (e[i] < 0) {
                z = w;
                r = ra;
                s = sa;
              } else {
                l = i;
                if (e[i] === 0) {
                  cdivres = cdiv(-ra, -sa, w, q);
                  H.set(i, n - 1, cdivres[0]);
                  H.set(i, n, cdivres[1]);
                } else {
                  x = H.get(i, i + 1);
                  y = H.get(i + 1, i);
                  vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
                  vi = (d[i] - p) * 2 * q;
                  if (vr === 0 && vi === 0) {
                    vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
                  }
                  cdivres = cdiv(
                    x * r - z * ra + q * sa,
                    x * s - z * sa - q * ra,
                    vr,
                    vi
                  );
                  H.set(i, n - 1, cdivres[0]);
                  H.set(i, n, cdivres[1]);
                  if (Math.abs(x) > Math.abs(z) + Math.abs(q)) {
                    H.set(
                      i + 1,
                      n - 1,
                      (-ra - w * H.get(i, n - 1) + q * H.get(i, n)) / x
                    );
                    H.set(
                      i + 1,
                      n,
                      (-sa - w * H.get(i, n) - q * H.get(i, n - 1)) / x
                    );
                  } else {
                    cdivres = cdiv(
                      -r - y * H.get(i, n - 1),
                      -s - y * H.get(i, n),
                      z,
                      q
                    );
                    H.set(i + 1, n - 1, cdivres[0]);
                    H.set(i + 1, n, cdivres[1]);
                  }
                }
                t = Math.max(Math.abs(H.get(i, n - 1)), Math.abs(H.get(i, n)));
                if (eps * t * t > 1) {
                  for (j = i; j <= n; j++) {
                    H.set(j, n - 1, H.get(j, n - 1) / t);
                    H.set(j, n, H.get(j, n) / t);
                  }
                }
              }
            }
          }
        }
        for (i = 0; i < nn; i++) {
          if (i < low || i > high) {
            for (j = i; j < nn; j++) {
              V.set(i, j, H.get(i, j));
            }
          }
        }
        for (j = nn - 1; j >= low; j--) {
          for (i = low; i <= high; i++) {
            z = 0;
            for (k = low; k <= Math.min(j, high); k++) {
              z = z + V.get(i, k) * H.get(k, j);
            }
            V.set(i, j, z);
          }
        }
      }
      function cdiv(xr, xi, yr, yi) {
        let r, d;
        if (Math.abs(yr) > Math.abs(yi)) {
          r = yi / yr;
          d = yr + r * yi;
          return [(xr + r * xi) / d, (xi - r * xr) / d];
        } else {
          r = yr / yi;
          d = yi + r * yr;
          return [(r * xr + xi) / d, (r * xi - xr) / d];
        }
      }
      var CholeskyDecomposition2 = class {
        constructor(value) {
          value = WrapperMatrix2D2.checkMatrix(value);
          if (!value.isSymmetric()) {
            throw new Error("Matrix is not symmetric");
          }
          let a = value;
          let dimension = a.rows;
          let l = new Matrix3(dimension, dimension);
          let positiveDefinite = true;
          let i, j, k;
          for (j = 0; j < dimension; j++) {
            let d = 0;
            for (k = 0; k < j; k++) {
              let s = 0;
              for (i = 0; i < k; i++) {
                s += l.get(k, i) * l.get(j, i);
              }
              s = (a.get(j, k) - s) / l.get(k, k);
              l.set(j, k, s);
              d = d + s * s;
            }
            d = a.get(j, j) - d;
            positiveDefinite &&= d > 0;
            l.set(j, j, Math.sqrt(Math.max(d, 0)));
            for (k = j + 1; k < dimension; k++) {
              l.set(j, k, 0);
            }
          }
          this.L = l;
          this.positiveDefinite = positiveDefinite;
        }
        isPositiveDefinite() {
          return this.positiveDefinite;
        }
        solve(value) {
          value = WrapperMatrix2D2.checkMatrix(value);
          let l = this.L;
          let dimension = l.rows;
          if (value.rows !== dimension) {
            throw new Error("Matrix dimensions do not match");
          }
          if (this.isPositiveDefinite() === false) {
            throw new Error("Matrix is not positive definite");
          }
          let count = value.columns;
          let B = value.clone();
          let i, j, k;
          for (k = 0; k < dimension; k++) {
            for (j = 0; j < count; j++) {
              for (i = 0; i < k; i++) {
                B.set(k, j, B.get(k, j) - B.get(i, j) * l.get(k, i));
              }
              B.set(k, j, B.get(k, j) / l.get(k, k));
            }
          }
          for (k = dimension - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
              for (i = k + 1; i < dimension; i++) {
                B.set(k, j, B.get(k, j) - B.get(i, j) * l.get(i, k));
              }
              B.set(k, j, B.get(k, j) / l.get(k, k));
            }
          }
          return B;
        }
        get lowerTriangularMatrix() {
          return this.L;
        }
      };
      var nipals = class {
        constructor(X, options = {}) {
          X = WrapperMatrix2D2.checkMatrix(X);
          let { Y } = options;
          const {
            scaleScores = false,
            maxIterations = 1e3,
            terminationCriteria = 1e-10
          } = options;
          let u;
          if (Y) {
            if (isAnyArray.isAnyArray(Y) && typeof Y[0] === "number") {
              Y = Matrix3.columnVector(Y);
            } else {
              Y = WrapperMatrix2D2.checkMatrix(Y);
            }
            if (Y.rows !== X.rows) {
              throw new Error("Y should have the same number of rows as X");
            }
            u = Y.getColumnVector(0);
          } else {
            u = X.getColumnVector(0);
          }
          let diff = 1;
          let t, q, w, tOld;
          for (let counter = 0; counter < maxIterations && diff > terminationCriteria; counter++) {
            w = X.transpose().mmul(u).div(u.transpose().mmul(u).get(0, 0));
            w = w.div(w.norm());
            t = X.mmul(w).div(w.transpose().mmul(w).get(0, 0));
            if (counter > 0) {
              diff = t.clone().sub(tOld).pow(2).sum();
            }
            tOld = t.clone();
            if (Y) {
              q = Y.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
              q = q.div(q.norm());
              u = Y.mmul(q).div(q.transpose().mmul(q).get(0, 0));
            } else {
              u = t;
            }
          }
          if (Y) {
            let p = X.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
            p = p.div(p.norm());
            let xResidual = X.clone().sub(t.clone().mmul(p.transpose()));
            let residual = u.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
            let yResidual = Y.clone().sub(
              t.clone().mulS(residual.get(0, 0)).mmul(q.transpose())
            );
            this.t = t;
            this.p = p.transpose();
            this.w = w.transpose();
            this.q = q;
            this.u = u;
            this.s = t.transpose().mmul(t);
            this.xResidual = xResidual;
            this.yResidual = yResidual;
            this.betas = residual;
          } else {
            this.w = w.transpose();
            this.s = t.transpose().mmul(t).sqrt();
            if (scaleScores) {
              this.t = t.clone().div(this.s.get(0, 0));
            } else {
              this.t = t;
            }
            this.xResidual = X.sub(t.mmul(w.transpose()));
          }
        }
      };
      exports.AbstractMatrix = AbstractMatrix2;
      exports.CHO = CholeskyDecomposition2;
      exports.CholeskyDecomposition = CholeskyDecomposition2;
      exports.DistanceMatrix = DistanceMatrix2;
      exports.EVD = EigenvalueDecomposition2;
      exports.EigenvalueDecomposition = EigenvalueDecomposition2;
      exports.LU = LuDecomposition2;
      exports.LuDecomposition = LuDecomposition2;
      exports.Matrix = Matrix3;
      exports.MatrixColumnSelectionView = MatrixColumnSelectionView2;
      exports.MatrixColumnView = MatrixColumnView2;
      exports.MatrixFlipColumnView = MatrixFlipColumnView2;
      exports.MatrixFlipRowView = MatrixFlipRowView2;
      exports.MatrixRowSelectionView = MatrixRowSelectionView2;
      exports.MatrixRowView = MatrixRowView2;
      exports.MatrixSelectionView = MatrixSelectionView2;
      exports.MatrixSubView = MatrixSubView2;
      exports.MatrixTransposeView = MatrixTransposeView2;
      exports.NIPALS = nipals;
      exports.Nipals = nipals;
      exports.QR = QrDecomposition2;
      exports.QrDecomposition = QrDecomposition2;
      exports.SVD = SingularValueDecomposition2;
      exports.SingularValueDecomposition = SingularValueDecomposition2;
      exports.SymmetricMatrix = SymmetricMatrix2;
      exports.WrapperMatrix1D = WrapperMatrix1D2;
      exports.WrapperMatrix2D = WrapperMatrix2D2;
      exports.correlation = correlation2;
      exports.covariance = covariance2;
      exports.default = Matrix3;
      exports.determinant = determinant2;
      exports.inverse = inverse3;
      exports.linearDependencies = linearDependencies2;
      exports.pseudoInverse = pseudoInverse2;
      exports.solve = solve2;
      exports.wrap = wrap2;
    }
  });

  // src/math/vector.generated.ts
  function xyz(a) {
    return [a[0], a[1], a[2]];
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  function mulVec4ByMat4(a, b) {
    return [
      a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[1] * b[5] + a[2] * b[6] + a[3] * b[7],
      a[0] * b[8] + a[1] * b[9] + a[2] * b[10] + a[3] * b[11],
      a[0] * b[12] + a[1] * b[13] + a[2] * b[14] + a[3] * b[15]
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

  // wgsl:/mnt/c/Users/baker/Documents/GitHub/r628/demos-src/webgpu/raymarcher/compute.wgsl
  var compute_default = { bindGroups: [[{ name: "tex", type: { name: "texture_storage_2d_array", attributes: [{ id: 1570, line: 17, name: "group", value: "0" }, { id: 1571, line: 17, name: "binding", value: "0" }], size: 0, format: { name: "rgba32float", attributes: null, size: 0 }, access: "write" }, group: 0, binding: 0, attributes: [{ id: 1570, line: 17, name: "group", value: "0" }, { id: 1571, line: 17, name: "binding", value: "0" }], resourceType: 4, access: "read" }, { name: "prevTex", type: { name: "texture_storage_2d_array", attributes: [{ id: 1574, line: 18, name: "group", value: "0" }, { id: 1575, line: 18, name: "binding", value: "1" }], size: 0, format: { name: "rgba32float", attributes: null, size: 0 }, access: "read" }, group: 0, binding: 1, attributes: [{ id: 1574, line: 18, name: "group", value: "0" }, { id: 1575, line: 18, name: "binding", value: "1" }], resourceType: 4, access: "read" }], [{ name: "params", type: { name: "Params", attributes: null, size: 288, members: [{ name: "size", type: { name: "vec2", attributes: null, size: 8, format: { name: "u32", attributes: null, size: 4 }, access: null }, attributes: null, offset: 0, size: 8 }, { name: "rand", type: { name: "vec2f", attributes: null, size: 8 }, attributes: null, offset: 8, size: 8 }, { name: "transform", type: { name: "mat4x4f", attributes: null, size: 64 }, attributes: null, offset: 16, size: 64 }, { name: "transformInv", type: { name: "mat4x4f", attributes: null, size: 64 }, attributes: null, offset: 80, size: 64 }, { name: "lastTransformInverse", type: { name: "mat4x4f", attributes: null, size: 64 }, attributes: null, offset: 144, size: 64 }, { name: "lastTransform", type: { name: "mat4x4f", attributes: null, size: 64 }, attributes: null, offset: 208, size: 64 }, { name: "brightnessFactor", type: { name: "f32", attributes: null, size: 4 }, attributes: null, offset: 272, size: 4 }, { name: "shouldReset", type: { name: "u32", attributes: null, size: 4 }, attributes: null, offset: 276, size: 4 }, { name: "aspect", type: { name: "f32", attributes: null, size: 4 }, attributes: null, offset: 280, size: 4 }], align: 16, startLine: 5, endLine: 15, inUse: true }, group: 1, binding: 0, attributes: [{ id: 1578, line: 20, name: "group", value: "1" }, { id: 1579, line: 20, name: "binding", value: "0" }], resourceType: 0, access: "read" }]] };

  // raw-ns:/mnt/c/Users/baker/Documents/GitHub/r628/demos-src/webgpu/raymarcher/compute.wgsl?raw
  var compute_default2 = "struct B {\r\n  test: array<vec4u, 4>,\r\n}\r\n\r\nstruct Params {\r\n  size: vec2<u32>,\r\n  rand: vec2f,\r\n  transform: mat4x4f,\r\n  transformInv: mat4x4f,\r\n  lastTransformInverse: mat4x4f,\r\n  lastTransform: mat4x4f,\r\n  brightnessFactor: f32,\r\n  shouldReset: u32,\r\n  aspect: f32,\r\n}\r\n\r\n@group(0) @binding(0) var tex: texture_storage_2d_array<rgba32float, write>;\r\n@group(0) @binding(1) var prevTex: texture_storage_2d_array<rgba32float, read>;\r\n\r\n@group(1) @binding(0) var<uniform> params : Params;\r\n\r\nfn rand(co: vec2f) -> f32 {\r\n  return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453); \r\n}\r\n\r\nfn r(hsv: vec3f) -> f32 {\r\n  return pow(cos(hsv.x * 3.141592 * 2.0) * 0.5 * hsv.y + 0.5 * hsv.z, 0.6);\r\n}\r\n\r\nfn hsl2rgb(hsl: vec3f) -> vec3f {\r\n  return vec3f(\r\n    r(hsl),\r\n    r(hsl - 0.33333333),\r\n    r(hsl - 0.66666666)\r\n  );\r\n}\r\n\r\n@compute @workgroup_size(8, 8, 1) fn computeSomething(\r\n  @builtin(global_invocation_id) id: vec3<u32>\r\n) {\r\n\r\n  var value: vec3f = vec3f(0.0);\r\n\r\n  let idnorm = vec2f(id.xy) / vec2f(params.size.xy);\r\n\r\n  let fractpos = idnorm + params.rand / vec2f(params.size.xy);\r\n\r\n  var originalPos = (vec4f(0.0, 0.0, 0.0, 1.0) * params.transform).xyz;\r\n  var originalDir = (\r\n    vec4(normalize(vec3f(1.0, params.aspect, 1.0) * vec3f(fractpos * 2.0 - 1.0, 1.0)), 0.0) \r\n    * params.transform\r\n  ).xyz;\r\n\r\n  let dofDistance = 2.0; \r\n\r\n  let targetPos = originalPos + originalDir * dofDistance;\r\n  let confusedPos = originalPos + pow(vec3f(\r\n    rand(idnorm + params.rand),\r\n    rand(idnorm + params.rand - 0.5),\r\n    rand(idnorm + params.rand - 1.5),\r\n  ), vec3f(1.0)) * 0.0;\r\n\r\n  var pos = confusedPos;\r\n  var dir = normalize(targetPos - confusedPos);\r\n      \r\n  var normal: vec3f;\r\n  var didHit: bool;\r\n  var emission = vec3f(0.0);\r\n  let lightdir = normalize(vec3f(1.0, 1.0, -1.0));\r\n  var totaldist = 0.0;\r\n\r\n  for (var i = 0u; i < 1u; i++) {\r\n    let hit = marchRay(pos, dir, 256u);\r\n    totaldist += distance(pos, hit.pos);\r\n    let olddir = dir;\r\n    dir = refract(\r\n      dir, hit.normal,\r\n      select(1.33, 1.0 / 1.33, hit.inside)\r\n    );\r\n    if (all(dir == vec3f(0.0))) {\r\n      dir = reflect(olddir, hit.normal);\r\n      pos = hit.pos + hit.normal * 0.001;\r\n    } else {\r\n      pos = hit.pos - hit.normal * 0.001 * select(-1.0, 1.0, hit.inside);\r\n    }\r\n\r\n    value += dot(normalize(vec3f(1.0)), dir) * vec3f(1.0);\r\n  }\r\n\r\n  let prevcol = textureLoad(prevTex, id.xy, 0u);\r\n  let prevpos = textureLoad(prevTex, id.xy, 1u);\r\n  let prevalbedo = textureLoad(prevTex, id.xy, 2u);\r\n  let prevnormal = textureLoad(prevTex, id.xy, 3u);\r\n\r\n  let currColor = vec4f(value / 1.0, 1.0);\r\n  let mixColor = prevcol + currColor;\r\n\r\n  if (params.shouldReset == 1u) {\r\n    textureStore(tex, id.xy, 0u, currColor);\r\n    textureStore(tex, id.xy, 1u, vec4f(\r\n      pos,\r\n      1.0\r\n    ));\r\n    textureStore(tex, id.xy, 2u, vec4f(0.0)); // albedo\r\n    textureStore(tex, id.xy, 3u, vec4f(0.0)); // normal\r\n  } else {\r\n    textureStore(tex, id.xy, 0u, mixColor);\r\n    textureStore(tex, id.xy, 1u, vec4f(\r\n      pos,\r\n      prevpos.w + 1.0\r\n    ));\r\n    textureStore(tex, id.xy, 2u, prevalbedo + currColor); // albedo\r\n    textureStore(tex, id.xy, 3u, vec4f(normal, 1.0)); // normal\r\n  }\r\n}\r\n\r\nstruct HitInfo {\r\n  hit: bool,\r\n  pos: vec3f,\r\n  normal: vec3f,\r\n  inside: bool,\r\n}\r\n\r\nfn marchRay(\r\n  pos: vec3f,\r\n  dir: vec3f,\r\n  iters: u32\r\n) -> HitInfo {\r\n  var posTemp = pos;\r\n  for (var i = 0u; i < iters; i++) {\r\n    let dist = sdf(posTemp);\r\n    posTemp += dir * abs(dist);\r\n  }\r\n\r\n  let distSample = sdf(posTemp);\r\n\r\n  let normal = normalize(vec3f(\r\n    sdf(posTemp + vec3f(0.01, 0.0, 0.0)) - distSample,\r\n    sdf(posTemp + vec3f(0.0, 0.01, 0.0)) - distSample,\r\n    sdf(posTemp + vec3f(0.0, 0.0, 0.01)) - distSample,\r\n  ));\r\n\r\n  return HitInfo(\r\n    abs(distSample) < 0.01,\r\n    posTemp,\r\n    normal,\r\n    distSample < 0.0\r\n  );\r\n}\r\n\r\n// MARCH_FUNCTION ";

  // node_modules/ml-matrix/matrix.mjs
  var matrix = __toESM(require_matrix(), 1);
  var Matrix2 = matrix.Matrix;
  var matrix_default = matrix.default.Matrix ? matrix.default.Matrix : matrix.Matrix;
  var inverse2 = matrix.inverse;

  // src/webgl/mesh.ts
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
  function translate(v) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ...v, 1];
  }

  // raw-ns:/mnt/c/Users/baker/Documents/GitHub/r628/demos-src/webgpu/raymarcher/blit-to-screen.wgsl?raw
  var blit_to_screen_default = "struct VSInput {\r\n  @builtin(vertex_index) vertexIndex: u32,\r\n}\r\n\r\nstruct VSOutput {\r\n  @builtin(position) position: vec4f,\r\n  @location(0) uv: vec2f,\r\n}\r\n\r\n@group(0) @binding(0) var samp : sampler;\r\n@group(0) @binding(1) var tex : texture_2d_array<f32>;\r\n\r\n@vertex\r\nfn VSMain(input: VSInput) -> VSOutput {\r\n  var vsOut: VSOutput;\r\n\r\n  vsOut.position = vec4(array(\r\n    vec2( 1.0,  1.0),\r\n    vec2( 1.0, -1.0),\r\n    vec2(-1.0, -1.0),\r\n    vec2( 1.0,  1.0),\r\n    vec2(-1.0, -1.0),\r\n    vec2(-1.0,  1.0),\r\n  )[input.vertexIndex], 0.5, 1.0);\r\n\r\n  vsOut.uv = array(\r\n    vec2(1.0, 0.0),\r\n    vec2(1.0, 1.0),\r\n    vec2(0.0, 1.0),\r\n    vec2(1.0, 0.0),\r\n    vec2(0.0, 1.0),\r\n    vec2(0.0, 0.0),\r\n  )[input.vertexIndex];\r\n\r\n  return vsOut;\r\n}\r\n\r\nconst gaussianFilterSize = 8.0;\r\n\r\n@fragment\r\nfn FSMain(@location(0) uv: vec2f) -> @location(0) vec4f {\r\n\r\n  let col = textureSample(tex, samp, uv, 0u);\r\n  let pos = textureSample(tex, samp, uv, 1u);\r\n\r\n  return vec4f(col.xyz / pos.w, 1.0);\r\n}";

  // demos-src/webgpu/raymarcher/blit-to-screen.ts
  async function initBlitToScreen(device, adapterInfo, textures) {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.style = `
position: absolute;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
`;
    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    }
    window.addEventListener("resize", resize);
    resize();
    const ctx = canvas.getContext("webgpu");
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
      device,
      format: presentationFormat
    });
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          sampler: { type: "non-filtering" },
          visibility: GPUShaderStage.FRAGMENT
        },
        {
          binding: 1,
          texture: {
            sampleType: "unfilterable-float",
            viewDimension: "2d-array"
          },
          visibility: GPUShaderStage.FRAGMENT
        }
      ]
    });
    const blitToScreenPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      vertex: {
        module: device.createShaderModule({
          code: blit_to_screen_default
        })
      },
      fragment: {
        module: device.createShaderModule({
          code: blit_to_screen_default
        }),
        targets: [{ format: presentationFormat }]
      },
      primitive: {
        topology: "triangle-list"
      }
    });
    const sampler = device.createSampler({
      minFilter: "nearest",
      magFilter: "nearest"
    });
    let bindGroups = [];
    function updateTextures(textures2) {
      bindGroups = textures2.map(
        (t) => device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: sampler
            },
            { binding: 1, resource: t }
          ]
        })
      );
    }
    updateTextures(textures);
    return {
      canvas,
      calcFrame: (bindGroupIndex) => {
        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: ctx.getCurrentTexture().createView(),
              clearValue: [0, 0, 0, 1],
              loadOp: "clear",
              storeOp: "store"
            }
          ]
        });
        const bindGroup = bindGroups[bindGroupIndex];
        passEncoder.setPipeline(blitToScreenPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(6);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
      },
      updateTextures
    };
  }

  // src/webgpu/bind-group-generator.ts
  function getWgslPrimitiveDatatype(typename, formatname) {
    if (formatname) return formatname;
    if (typename === "f32" || typename === "i32" || typename === "u32" || typename === "f16")
      return typename;
    if (typename.startsWith("vec") || typename.startsWith("mat")) {
      if (typename.endsWith("i")) {
        return "i32";
      } else if (typename.endsWith("u")) {
        return "u32";
      } else if (typename.endsWith("h")) {
        return "f16";
      }
    }
    return "f32";
  }
  function getWgslPrimitiveSize(typename) {
    if (typename.startsWith("vec2")) return 2;
    if (typename.startsWith("vec3")) return 3;
    if (typename.startsWith("vec4")) return 4;
    if (typename.startsWith("mat2x3")) return 6;
    if (typename.startsWith("mat3x2")) return 6;
    if (typename.startsWith("mat2x4")) return 8;
    if (typename.startsWith("mat4x2")) return 8;
    if (typename.startsWith("mat3x4")) return 12;
    if (typename.startsWith("mat4x3")) return 12;
    if (typename.startsWith("mat2")) return 4;
    if (typename.startsWith("mat3")) return 9;
    if (typename.startsWith("mat4")) return 16;
    return 1;
  }
  function setWgslPrimitive(typename, formatname, view, offset, data) {
    const datatype = getWgslPrimitiveDatatype(typename, formatname);
    const size = getWgslPrimitiveSize(typename);
    let stride = {
      i32: 4,
      f32: 4,
      u32: 4,
      f16: 2
    }[datatype];
    let method = {
      i32: "setInt32",
      f32: "setFloat32",
      u32: "setUint32",
      f16: "setFloat16"
    }[datatype];
    for (let i = 0; i < size; i++) {
      view[method](offset + stride * i, data[i], true);
    }
  }
  function generateUniformBufferInner(spec, values, view, offset) {
    if (spec.members) {
      for (const m of spec.members)
        generateUniformBufferInner(
          m.type,
          values[m.name],
          view,
          offset + m.offset
        );
      return;
    }
    const typename = spec.name;
    if (typename === "array") {
      for (let i = 0; i < spec.count; i++) {
        generateUniformBufferInner(
          spec.format,
          values[i],
          view,
          offset + spec.stride * i
        );
      }
    } else {
      setWgslPrimitive(
        spec.name,
        spec.format?.name,
        view,
        offset,
        Array.isArray(values) ? values : [values]
      );
    }
  }
  function generateUniformBuffer(spec, values, buffer, byteOffset) {
    const buf = buffer ?? new ArrayBuffer(spec.size);
    const view = new DataView(buf, byteOffset);
    generateUniformBufferInner(spec, values, view, 0);
    return buf;
  }
  function makeUniformBuffer(spec, group, binding, data, buffer, byteOffset) {
    return generateUniformBuffer(
      spec.bindGroups[group][binding].type,
      data,
      buffer,
      byteOffset
    );
  }

  // wgsl:/mnt/c/Users/baker/Documents/GitHub/r628/demos-src/webgpu/raymarcher/blit-to-screen.wgsl
  var blit_to_screen_default2 = { bindGroups: [[{ name: "samp", type: { name: "sampler", attributes: [{ id: 1427, line: 10, name: "group", value: "0" }, { id: 1428, line: 10, name: "binding", value: "0" }], size: 0, format: null, access: null }, group: 0, binding: 0, attributes: [{ id: 1427, line: 10, name: "group", value: "0" }, { id: 1428, line: 10, name: "binding", value: "0" }], resourceType: 3, access: "" }, { name: "tex", type: { name: "texture_2d_array", attributes: [{ id: 1431, line: 11, name: "group", value: "0" }, { id: 1432, line: 11, name: "binding", value: "1" }], size: 0, format: { name: "f32", attributes: null, size: 4 }, access: null }, group: 0, binding: 1, attributes: [{ id: 1431, line: 11, name: "group", value: "0" }, { id: 1432, line: 11, name: "binding", value: "1" }], resourceType: 2, access: "read" }]] };

  // demos-src/webgpu/raymarcher/raymarcher-webgpu.demo.ts
  console.log(blit_to_screen_default2);
  (async () => {
    function inv4(m) {
      const M = new Matrix2([
        m.slice(0, 4),
        m.slice(4, 8),
        m.slice(8, 12),
        m.slice(12, 16)
      ]);
      const invM = inverse2(M);
      return invM.to1DArray();
    }
    function fail(msg) {
      window.alert(msg);
      throw new Error(msg);
    }
    console.log(compute_default2, compute_default);
    const A = compute_default[0];
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      fail("No GPU adapter!");
      return;
    }
    const device = await adapter.requestDevice();
    device.pushErrorScope("internal");
    device.addEventListener(
      "uncapturederror",
      (event) => console.error(event.error)
    );
    if (!device) {
      fail("No GPU device!");
    }
    const module = device.createShaderModule({
      label: "Compute Shader",
      code: compute_default2.replace(
        "// MARCH_FUNCTION",
        `
fn modulo(
  a: vec3f,
  b: vec3f
) -> vec3f{
  let afloor = floor(a / b) * b;
  return (a - afloor);
}

fn grid(
    pos: vec3f,
    res: vec3f
) -> vec3f {
  return modulo(pos, res) - res * 0.5;
}

fn sdf(
    pos: vec3f,
) -> f32 {
  let postemp = grid(pos, vec3(3.0));
  return distance(postemp, vec3f(0.0)) - 1.2;  

  // return -pos.y + 1.0;
}

  `
      )
    });
    const pipeline = device.createComputePipeline({
      label: "test",
      layout: "auto",
      compute: {
        module
      }
    });
    const uniformBuffer = device.createBuffer({
      label: "uniform buffer",
      size: 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.UNIFORM
    });
    let width = 1024;
    let height = 1024;
    let textures = [];
    let textureFlipFlopBindGroups = [];
    const makeEverythingTexture = () => device.createTexture({
      size: [width, height, 4],
      format: "rgba32float",
      dimension: "2d",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
    });
    const uniformBindGroup = device.createBindGroup({
      label: "bind group for compute shader uniforms",
      layout: pipeline.getBindGroupLayout(1),
      entries: [{ binding: 0, resource: uniformBuffer }]
    });
    device.popErrorScope().then((e) => {
      console.log(e);
    });
    const makeTextureFlipFlopBindGroup = (prev, curr) => ({
      prev,
      curr,
      group: device.createBindGroup({
        label: "bindgroup for flip-flopping textures",
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: textures[curr] },
          { binding: 1, resource: textures[prev] }
        ]
      })
    });
    let frameIndex = 0;
    let lastTransform = rotate([0, 1, 0], 0);
    const blitToScreen = await initBlitToScreen(device, adapter.info, textures);
    function resize() {
      width = window.innerWidth * window.devicePixelRatio;
      height = window.innerHeight * window.devicePixelRatio;
      textures = [makeEverythingTexture(), makeEverythingTexture()];
      textureFlipFlopBindGroups = [
        makeTextureFlipFlopBindGroup(0, 1),
        makeTextureFlipFlopBindGroup(1, 0)
      ];
      blitToScreen.updateTextures(textures);
    }
    window.addEventListener("resize", resize);
    resize();
    let viewerPos = [0, 0.1, -3];
    let viewerVel = [0, 0, 0];
    let rotationMatrix = rotate([0, 1, 0], 0.1);
    let keysDown = /* @__PURE__ */ new Set();
    document.addEventListener("keydown", (e) => {
      keysDown.add(e.key.toLowerCase());
    });
    document.addEventListener("keyup", (e) => {
      keysDown.delete(e.key.toLowerCase());
    });
    document.addEventListener("mousedown", (e) => {
      document.body.requestPointerLock();
    });
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== document.body) return;
      const invrot = inv4(rotationMatrix);
      const localXAxis = mulVec4ByMat4([1, 0, 0, 0], invrot);
      const localYAxis = mulVec4ByMat4([0, 1, 0, 0], invrot);
      const r1 = rotate(xyz(localYAxis), -e.movementX * 1e-3);
      const r2 = rotate(xyz(localXAxis), e.movementY * 1e-3);
      rotationMatrix = mulMat4(mulMat4(r1, r2), rotationMatrix);
    });
    let lastTime = 0;
    function loop(t) {
      frameIndex++;
      t ??= 0;
      let dt = (t - lastTime) / 1e3;
      viewerPos = add3(viewerPos, scale3(viewerVel, dt));
      const accel = mulVec4ByMat4(
        [
          keysDown.has("d") ? 1 : keysDown.has("a") ? -1 : 0,
          keysDown.has("shift") ? 1 : keysDown.has(" ") ? -1 : 0,
          keysDown.has("w") ? 1 : keysDown.has("s") ? -1 : 0,
          0
        ],
        inv4(rotationMatrix)
      );
      viewerVel = add3(viewerVel, xyz(accel));
      viewerVel = scale3(viewerVel, 0.1 ** dt);
      if (Math.hypot(...viewerVel) < 0.2) {
        viewerVel = [0, 0, 0];
      }
      let currTransform = mulMat4(translate(viewerPos), rotationMatrix);
      let shouldReset = lastTransform.every((e, i) => e === currTransform[i]) ? 0 : 1;
      const buf = makeUniformBuffer(
        compute_default,
        1,
        0,
        {
          size: [width, height],
          rand: [Math.random(), Math.random()],
          transformInv: inv4(currTransform),
          transform: currTransform,
          lastTransformInverse: inv4(lastTransform),
          lastTransform,
          brightnessFactor: frameIndex % 70 === 1 || true ? 1 : 0,
          shouldReset,
          aspect: height / width
        }
      );
      lastTransform = currTransform;
      device.queue.writeBuffer(uniformBuffer, 0, buf);
      const encoder = device.createCommandEncoder({
        label: "raymarch encoder"
      });
      const pass = encoder.beginComputePass({
        label: "raymarch compute pass"
      });
      const bindGroupIndex = frameIndex % 2;
      const bindgroup = textureFlipFlopBindGroups[bindGroupIndex];
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindgroup.group);
      pass.setBindGroup(1, uniformBindGroup);
      pass.dispatchWorkgroups(width / 8, height / 8);
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      blitToScreen.calcFrame(bindGroupIndex);
      lastTime = t;
      requestAnimationFrame(loop);
    }
    loop();
  })();
})();
