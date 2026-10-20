import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function files(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}

test("application has no backend, database, private routes or auth dependencies", () => {
  for (const entry of [
    "src/lib",
    "src/features",
    "src/app/api",
    "src/app/admin",
    "src/app/app",
    "src/app/login",
    "src/app/register",
    "prisma",
    "prisma.config.ts",
    "deploy",
    ".env.example",
  ]) {
    assert.equal(fs.existsSync(entry), false, `${entry} must not exist`);
  }
  const pkg = JSON.parse(read("package.json"));
  for (const name of Object.keys({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  })) {
    assert.doesNotMatch(name, /prisma|better-auth|argon2|^pg$|^dotenv$|^zod$/i);
  }
  assert.equal(pkg.scripts.postinstall, undefined);
  assert.ok(!Object.keys(pkg.scripts).some((name) => name.startsWith("db:")));
  for (const file of files("src").filter((name) =>
    /\.[cm]?[jt]sx?$/.test(name),
  )) {
    const source = read(file);
    assert.doesNotMatch(
      source,
      /DATABASE_URL|BETTER_AUTH|process\.env|next\/headers|next\/server|use server|@prisma|better-auth|@\/lib|@\/features/,
      file,
    );
    assert.ok(
      !/^(route|middleware|proxy)\.[jt]s$/.test(path.basename(file)),
      file,
    );
  }
});

test("build and QA use a static export without application server commands", () => {
  const config = read("next.config.ts");
  assert.match(config, /output:\s*["']export["']/);
  assert.match(config, /images:\s*\{\s*unoptimized:\s*true/);
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts.preview, /^serve out /);
  assert.equal(pkg.scripts.start, pkg.scripts.preview);
  assert.doesNotMatch(
    JSON.stringify(pkg.scripts),
    /next start|prisma|--env-file/,
  );
  const browserConfig = read("playwright.config.ts");
  assert.match(browserConfig, /process\.env\.UI_QA_URL/);
  assert.match(browserConfig, /command:\s*["']npm run preview["']/);
  assert.doesNotMatch(browserConfig, /npm run dev/);
  assert.equal(JSON.parse(read("vercel.json")).framework, null);
  assert.equal(JSON.parse(read("vercel.json")).outputDirectory, "out");
  const lock = JSON.parse(read("package-lock.json"));
  assert.ok(
    !Object.keys(lock.packages).some((entry) =>
      /node_modules\/(?:@prisma\/|prisma$|better-auth$|@better-auth\/|pg$|@node-rs\/argon2)/.test(
        entry,
      ),
    ),
  );
  assert.deepEqual(
    files("tests/browser")
      .map((name) => path.basename(name))
      .filter((name) => /\.(spec|test)\./.test(name)),
    ["frontend-only.spec.ts"],
  );
});
