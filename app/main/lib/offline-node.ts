import dgram from "dgram";
import dns from "dns";
import net from "net";

// Chinese fork: switch off every network API that Node.js offers the main
// process. (Network requests made through the browser engine are blocked
// separately in offline.ts.)
//
// - TCP: net.Socket#connect and net.Server#listen refuse anything except local
//   Unix-domain sockets / named pipes. HTTP, HTTPS, HTTP/2, TLS, fetch and
//   WebSocket are all built on top of these, so they fail too.
// - UDP: dgram sockets can't bind, connect or send.
// - DNS: every lookup / resolve fails, so no name ever leaves the machine.
// - fetch: rejects immediately.
//
// Each refusal is reported through `onBlocked`, so attempts show up in logs.

export const NETWORK_DISABLED_MESSAGE =
  "Network access is disabled in this build";

type BlockedReporter = (kind: string, detail: string) => void;

function blockedError(): Error {
  return new Error(NETWORK_DISABLED_MESSAGE);
}

// True when a connect()/listen() call targets a local Unix-domain socket or
// named pipe (a file path) rather than a network port. Mirrors how Node itself
// interprets the arguments, including its internal pre-normalized array form.
function targetsLocalPipe(args: unknown[]): boolean {
  let first: unknown = args[0];
  if (Array.isArray(first)) first = first[0];
  if (typeof first === "string") return !/^\d+$/.test(first);
  if (first && typeof first === "object" && "path" in first) {
    return Boolean((first as { path?: unknown }).path);
  }
  return false;
}

function describeTarget(args: unknown[]): string {
  let first: unknown = args[0];
  if (Array.isArray(first)) first = first[0];
  if (first && typeof first === "object") {
    const { host, port } = first as { host?: unknown; port?: unknown };
    return `${String(host ?? "")}:${String(port ?? "")}`;
  }
  return String(first);
}

const DNS_METHODS = [
  "lookup",
  "lookupService",
  "resolve",
  "resolve4",
  "resolve6",
  "resolveAny",
  "resolveCaa",
  "resolveCname",
  "resolveMx",
  "resolveNaptr",
  "resolveNs",
  "resolvePtr",
  "resolveSoa",
  "resolveSrv",
  "resolveTxt",
  "reverse",
];

// Replace callback-style DNS functions: report failure to the callback.
function blockCallbackDns(target: object, report: BlockedReporter): void {
  const record = target as Record<string, unknown>;
  for (const name of DNS_METHODS) {
    if (typeof record[name] !== "function") continue;
    record[name] = (...args: unknown[]) => {
      report("dns", `${name} ${String(args[0])}`);
      const callback = args[args.length - 1];
      if (typeof callback === "function") {
        process.nextTick(() => callback(blockedError()));
      }
    };
  }
}

// Replace promise-style DNS functions: reject.
function blockPromiseDns(target: object, report: BlockedReporter): void {
  const record = target as Record<string, unknown>;
  for (const name of DNS_METHODS) {
    if (typeof record[name] !== "function") continue;
    record[name] = (...args: unknown[]) => {
      report("dns", `${name} ${String(args[0])}`);
      return Promise.reject(blockedError());
    };
  }
}

let installed = false;

export function disableNodeNetworking(
  onBlocked: BlockedReporter = () => undefined,
): void {
  if (installed) return;
  installed = true;

  // TCP client
  const originalConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (
    this: net.Socket,
    ...args: unknown[]
  ) {
    if (targetsLocalPipe(args)) {
      return (
        originalConnect as unknown as (...a: unknown[]) => net.Socket
      ).apply(this, args);
    }
    onBlocked("tcp-connect", describeTarget(args));
    process.nextTick(() => this.destroy(blockedError()));
    return this;
  } as unknown as typeof net.Socket.prototype.connect;

  // TCP server
  const originalListen = net.Server.prototype.listen;
  net.Server.prototype.listen = function (
    this: net.Server,
    ...args: unknown[]
  ) {
    if (targetsLocalPipe(args)) {
      return (
        originalListen as unknown as (...a: unknown[]) => net.Server
      ).apply(this, args);
    }
    onBlocked("tcp-listen", describeTarget(args));
    process.nextTick(() => this.emit("error", blockedError()));
    return this;
  } as unknown as typeof net.Server.prototype.listen;

  // UDP
  const udp = dgram.Socket.prototype as unknown as Record<string, unknown>;
  for (const name of ["bind", "connect", "send"]) {
    udp[name] = () => {
      onBlocked("udp", name);
      throw blockedError();
    };
  }

  // DNS
  blockCallbackDns(dns, onBlocked);
  blockCallbackDns(dns.Resolver.prototype, onBlocked);
  blockPromiseDns(dns.promises, onBlocked);
  blockPromiseDns(dns.promises.Resolver.prototype, onBlocked);

  // fetch
  global.fetch = ((input: unknown) => {
    onBlocked("fetch", String(input));
    return Promise.reject(blockedError());
  }) as typeof global.fetch;
}
