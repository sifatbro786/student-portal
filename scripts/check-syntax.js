// esbuild syntax check for every source file (fast, no type-checking).
//   npm run check:syntax            → all files
//   npm run check:syntax -- a.js b.js
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

const ROOTS = ["app", "components", "lib", "server", "scripts", "proxy.js"];
const EXT = /\.(m?js|jsx)$/;

async function walk(p) {
    const stat = await readdir(p, { withFileTypes: true }).catch(() => null);
    if (!stat) return EXT.test(p) ? [p] : [];
    const out = [];
    for (const d of stat) out.push(...(await walk(path.join(p, d.name))));
    return out;
}

const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : (await Promise.all(ROOTS.map(walk))).flat();
let failed = 0;
for (const f of files) {
    try {
        await transform(await readFile(f, "utf8"), {
            loader: "jsx",
            jsx: "automatic",
            format: "esm",
            sourcefile: f,
        });
    } catch (err) {
        failed++;
        console.error(`✗ ${f}\n${err.message}\n`);
    }
}
console.log(
    `${failed ? "✗" : "✓"} esbuild syntax: ${files.length - failed}/${files.length} files OK`,
);
process.exit(failed ? 1 : 0);
