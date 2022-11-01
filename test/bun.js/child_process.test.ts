import { describe, it, expect } from "bun:test";
import { ChildProcess, spawn } from "node:child_process";

// Semver regex: https://gist.github.com/jhorsman/62eeea161a13b80e39f5249281e17c39?permalink_comment_id=2896416#gistcomment-2896416
// Not 100% accurate, but good enough for this test
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[a-zA-Z\d][-a-zA-Z.\d]*)?(\+[a-zA-Z\d][-a-zA-Z.\d]*)?$/;

describe("ChildProcess.spawn()", () => {
  it("should emit `spawn` on spawn", async () => {
    const proc = new ChildProcess();
    const result = await new Promise((resolve) => {
      proc.on("spawn", () => {
        resolve(true);
      });
      proc.spawn({ file: "bun", args: ["-v"] });
    });
    expect(result).toBe(true);
  });

  it("should emit `exit` when killed", async () => {
    const proc = new ChildProcess();
    const result = await new Promise((resolve) => {
      proc.on("exit", () => {
        resolve(true);
      });

      proc.spawn({ file: "bun", args: ["-v"] });
      proc.kill();
    });
    expect(result).toBe(true);
  });
});

describe("spawn()", () => {
  it("should spawn a process", () => {
    const child = spawn("echo", ["hello"]);
    expect(!!child).toBe(true);
  });

  it("should disallow invalid filename", () => {
    let child;
    let child2;
    try {
      child = spawn(123);
      child2 = spawn(["echo", "hello"]);
    } catch (e) {
      console.error(e);
    }
    expect(!!child).toBe(false);
    expect(!!child2).toBe(false);
  });

  it("should allow stdout to be read via Node stream.Readable `data` events", async () => {
    const child = spawn("bun", ["-v"]);
    const result: string = await new Promise((resolve) => {
      child.stdout.on("error", (e) => {
        console.error(e);
      });
      child.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
        resolve(data);
      });
      child.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
      });
    });
    expect(SEMVER_REGEX.test(result.trim())).toBe(true);
  });

  it("should allow stdout to be read via .read() API", async () => {
    const child = spawn("bun", ["-v"]);
    const result: string = await new Promise((resolve) => {
      let finalData = "";
      child.stdout.on("error", (e) => {
        console.error(e);
      });
      child.stdout.on("readable", () => {
        let data;

        while ((data = child.stdout.read()) !== null) {
          finalData += data;
        }
        resolve(finalData);
      });
    });
    expect(SEMVER_REGEX.test(result.trim())).toBe(true);
  });
});
