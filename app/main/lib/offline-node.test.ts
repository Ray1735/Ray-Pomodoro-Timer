import dgram from "node:dgram";
import dns from "node:dns";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  disableNodeNetworking,
  NETWORK_DISABLED_MESSAGE,
} from "./offline-node";

const reported: string[] = [];

beforeAll(() => {
  disableNodeNetworking((kind, detail) => reported.push(`${kind} ${detail}`));
});

// Every assertion checks for this module's own error message, so a test can't
// pass just because the test machine happens to have no network.
function expectBlocked(error: unknown): void {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe(NETWORK_DISABLED_MESSAGE);
}

function firstError(emitter: {
  on: (event: string, cb: (arg?: unknown) => void) => unknown;
}): Promise<unknown> {
  return new Promise((resolve) => {
    emitter.on("error", resolve);
    emitter.on("connect", () => resolve(new Error("unexpectedly connected")));
    emitter.on("response", () => resolve(new Error("unexpected response")));
  });
}

describe("disableNodeNetworking", () => {
  it("blocks raw TCP connections, even to this machine", async () => {
    expectBlocked(
      await firstError(net.connect({ host: "127.0.0.1", port: 9 })),
    );
    expectBlocked(await firstError(net.connect(9, "example.com")));
  });

  it("blocks HTTP and HTTPS requests", async () => {
    expectBlocked(await firstError(http.get("http://127.0.0.1:9/")));
    expectBlocked(await firstError(https.get("https://example.com/")));
  });

  it("blocks fetch", async () => {
    await expect(global.fetch("https://example.com/")).rejects.toThrow(
      NETWORK_DISABLED_MESSAGE,
    );
  });

  it("blocks DNS lookups in every API style", async () => {
    const callbackError = await new Promise((resolve) =>
      dns.lookup("example.com", (err) => resolve(err)),
    );
    expectBlocked(callbackError);

    await expect(dns.promises.lookup("example.com")).rejects.toThrow(
      NETWORK_DISABLED_MESSAGE,
    );

    const resolverError = await new Promise((resolve) =>
      new dns.Resolver().resolve4("example.com", (err) => resolve(err)),
    );
    expectBlocked(resolverError);

    await expect(
      new dns.promises.Resolver().resolve4("example.com"),
    ).rejects.toThrow(NETWORK_DISABLED_MESSAGE);
  });

  it("blocks UDP", () => {
    const socket = dgram.createSocket("udp4");
    expect(() => socket.bind(0)).toThrow(NETWORK_DISABLED_MESSAGE);
    expect(() => socket.send("x", 53, "127.0.0.1")).toThrow(
      NETWORK_DISABLED_MESSAGE,
    );
  });

  it("blocks listening on a TCP port", async () => {
    expectBlocked(await firstError(net.createServer().listen(0, "127.0.0.1")));
  });

  it("still allows local Unix-socket communication (not network)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "offline-test-"));
    const socketPath = path.join(dir, "ipc.sock");
    const server = net.createServer((conn) => conn.end("ok"));
    await new Promise<void>((resolve) => server.listen(socketPath, resolve));

    const reply = await new Promise<string>((resolve, reject) => {
      const client = net.connect(socketPath);
      let data = "";
      client.on("data", (chunk) => (data += chunk.toString()));
      client.on("end", () => resolve(data));
      client.on("error", reject);
    });
    expect(reply).toBe("ok");

    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("reports every blocked attempt", () => {
    expect(reported.some((r) => r.startsWith("tcp-connect"))).toBe(true);
    expect(reported.some((r) => r.startsWith("dns"))).toBe(true);
    expect(reported.some((r) => r.startsWith("udp"))).toBe(true);
    expect(reported.some((r) => r.startsWith("fetch"))).toBe(true);
    expect(reported.some((r) => r.startsWith("tcp-listen"))).toBe(true);
  });
});
