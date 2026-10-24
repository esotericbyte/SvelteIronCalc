// Test environment: the engines are initialized from their .wasm files and
// jsdom gets the browser APIs the widget needs but jsdom lacks (a 2D canvas
// context and ResizeObserver). The canvas stub only records nothing: the
// tests check the model wiring and the DOM, not the pixels.
import "@testing-library/svelte/vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { initSync } from "@ironcalc/wasm";
import { initSync as initXlsxSync } from "@ironcalc/wasm-xlsx";

const require = createRequire(import.meta.url);

function wasmBytes(packageName: string): Buffer {
  const packageJson = require.resolve(`${packageName}/package.json`);
  return readFileSync(join(dirname(packageJson), "wasm_bg.wasm"));
}

initSync({ module: wasmBytes("@ironcalc/wasm") });
initXlsxSync({ module: wasmBytes("@ironcalc/wasm-xlsx") });

function fakeContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = {
    canvas,
    measureText: (text: string) => ({
      width: text.length * 7,
      actualBoundingBoxAscent: 9,
      actualBoundingBoxDescent: 3,
    }),
    getLineDash: () => [],
  };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) {
        return object[property];
      }
      // every other method (fillRect, beginPath, ...) is a no-op
      return () => {};
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
) {
  return fakeContext(this);
} as unknown as typeof HTMLCanvasElement.prototype.getContext;

class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= NoopResizeObserver as typeof ResizeObserver;
