import type { IncomingHttpHeaders } from "node:http";
import type * as e from "node:events";
import type * as s from "stream";

const EventEmitter = require("node:events");
const StreamModule = require("node:stream");
const { Readable } = StreamModule as { Readable: s.Readable };
const { _ReadableFromWebForUndici: ReadableFromWeb } = StreamModule[Symbol.for("::bunternal::")];

const ObjectCreate = Object.create;
const kEmptyObject = ObjectCreate(null);

var fetch = Bun.fetch;
// @ts-ignore
var Response = globalThis.Response;
var Headers = globalThis.Headers;
// @ts-ignore
var Request = globalThis.Request;
var URLSearchParams = globalThis.URLSearchParams;
var URL = globalThis.URL;
class File extends Blob {}
class FileReader extends EventTarget {
  // @ts-ignore
  constructor() {
    throw new Error("Not implemented yet!");
  }
}

var FormData = globalThis.FormData;
function notImplemented() {
  throw new Error("Not implemented in bun");
}

type UrlObject = {
  port: string | number;
  path: string;
  pathname: string;
  hostname: string;
  origin: string;
  protocol: "http://" | "https://";
  search: string;
};

type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

class BodyReadable extends ReadableFromWeb {
  #response;
  #bodyUsed;

  constructor(response, options = {}) {
    var { body } = response;
    if (!body) throw new Error("Response body is null");
    super(options, body);

    this.#response = response;
    this.#bodyUsed = response.bodyUsed;
  }

  get bodyUsed() {
    // return this.#response.bodyUsed;
    return this.#bodyUsed;
  }

  #consume() {
    if (this.#bodyUsed) throw new TypeError("unusable");
    this.#bodyUsed = true;
  }

  async arrayBuffer() {
    this.#consume();
    return await this.#response.arrayBuffer();
  }

  async blob() {
    this.#consume();
    return await this.#response.blob();
  }

  async formData() {
    this.#consume();
    return await this.#response.formData();
  }

  async json() {
    this.#consume();
    return await this.#response.json();
  }

  async text() {
    this.#consume();
    return await this.#response.text();
  }
}

// NOT IMPLEMENTED
// *   idempotent?: boolean;
// *   onInfo?: (info: { statusCode: number, headers: Object<string, string | string[]> }) => void;
// *   opaque?: *;
// *   responseHeader: 'raw' | null;
// *   headersTimeout?: number | null;
// *   bodyTimeout?: number | null;
// *   upgrade?: boolean | string | null;
// *   blocking?: boolean;

type RequestOptions = {
  dispatcher: Dispatcher;
  method: HttpMethod | string;
  signal?: AbortSignal | e.EventEmitter | null;
  maxRedirections?: number;
  body?: string | Buffer | Uint8Array | s.Readable | null | FormData;
  headers?: IncomingHttpHeaders | string[] | null;
  query?: Record<string, any>;
  reset?: boolean;
  throwOnError?: boolean;
};

type UndiciResponse = {
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: BodyReadable | null;
  trailers: Record<string, string>;
  opaque: unknown;
  context: Record<string, any>;
};

/**
 * Performs an HTTP request.
 */
async function request(
  url: string | URL | UrlObject,
  options = {
    method: "GET",
    signal: null,
    headers: null,
    query: undefined,
    // idempotent: false, // GET and HEAD requests are idempotent by default
    // blocking = false,
    // upgrade = false,
    // headersTimeout: 30000,
    // bodyTimeout: 30000,
    reset: false,
    throwOnError: false,
    body: null,
    maxRedirections: undefined,
    dispatcher: undefined,
  },
): Promise<UndiciResponse> {
  let {
    method = "GET",
    headers: inputHeaders,
    query,
    signal,
    // idempotent, // GET and HEAD requests are idempotent by default
    // blocking = false,
    // upgrade = false,
    // headersTimeout = 30000,
    // bodyTimeout = 30000,
    reset = false,
    throwOnError = false,
    body: inputBody,
    maxRedirections,
    dispatcher,
  } = options as RequestOptions;

  // TODO: More validations

  if (typeof url === "string") {
    if (query) url = new URL(url);
  } else if (typeof url === "object" && url !== null) {
    if (!(url instanceof URL)) {
      // TODO: Parse undici UrlObject
      throw new Error("not implemented");
    }
  } else throw new TypeError("url must be a string, URL, or UrlObject");

  if (typeof url === "string" && query) url = new URL(url);
  if (typeof url === "object" && url !== null && query) if (query) url.search = new URLSearchParams(query).toString();

  const sanitizedMethod = method && typeof method === "string" ? method.toUpperCase() : null;
  // idempotent = idempotent === undefined ? method === "GET" || method === "HEAD" : idempotent;

  if (inputBody && (method === "GET" || method === "HEAD")) {
    throw new Error("Body not allowed for GET or HEAD requests");
  }

  // @ts-ignore
  if (inputBody && (inputBody as s.Readable).read && inputBody instanceof Readable) {
    // TODO: Streaming via ReadableStream?
    let data = "";
    (inputBody as s.Readable).setEncoding("utf8");
    for await (const chunk of inputBody) {
      data += chunk;
    }
    inputBody = new TextEncoder().encode(data);
  }

  if (maxRedirections !== undefined && Number.isNaN(maxRedirections)) {
    throw new Error("maxRedirections must be a number if defined");
  }

  if (signal && !(signal instanceof AbortSignal)) {
    // TODO: Add support for event emitter signal
    throw new Error("signal must be an instance of AbortSignal");
  }

  let resp;
  /** @type {Response} */
  const {
    status: statusCode,
    headers,
    // @ts-ignore
    trailers,
  } = (resp = await fetch(url, {
    signal,
    mode: "cors",
    method: sanitizedMethod,
    headers: inputHeaders || kEmptyObject,
    body: inputBody,
    redirect: maxRedirections === undefined || maxRedirections > 0 ? "follow" : "manual",
    keepalive: !reset,
  } as RequestInit));

  // Throw if received 4xx or 5xx response indicating HTTP error
  if (throwOnError && statusCode >= 400 && statusCode < 600) {
    throw new Error(`Request failed with status code ${statusCode}`);
  }

  const body = resp.body ? new BodyReadable(resp) : null;

  return { statusCode, headers: headers.toJSON(), body, trailers, opaque: kEmptyObject, context: kEmptyObject };
}

function stream() {
  throw new Error("Not implemented in bun");
}
function pipeline() {
  throw new Error("Not implemented in bun");
}
function connect() {
  throw new Error("Not implemented in bun");
}
function upgrade() {
  throw new Error("Not implemented in bun");
}

class MockClient {
  constructor() {
    throw new Error("Not implemented in bun");
  }
}
class MockPool {
  constructor() {
    throw new Error("Not implemented in bun");
  }
}
class MockAgent {
  constructor() {
    throw new Error("Not implemented in bun");
  }
}

function mockErrors() {
  throw new Error("Not implemented in bun");
}

function Undici() {
  throw new Error("Not implemented in bun");
}

class Dispatcher extends EventEmitter {}
class Agent extends Dispatcher {}

// declare class ProxyAgent extends Dispatcher {
//   constructor(options: ProxyAgent.Options | string)

//   dispatch(options: Agent.DispatchOptions, handler: Dispatcher.DispatchHandlers): boolean;
//   close(): Promise<void>;
// }

// declare namespace ProxyAgent {
//   export interface Options extends Agent.Options {
//     uri: string;
//     /**
//      * @deprecated use opts.token
//      */
//     auth?: string;
//     token?: string;
//     headers?: IncomingHttpHeaders;
//     requestTls?: buildConnector.BuildOptions;
//     proxyTls?: buildConnector.BuildOptions;
//   }
// }
class ProxyAgent extends Dispatcher {
  // constructor(options: string) {}
}
class Pool extends Dispatcher {
  request() {
    throw new Error("Not implemented in bun");
  }
}
class BalancedPool extends Dispatcher {}
class Client extends Dispatcher {
  request() {
    throw new Error("Not implemented in bun");
  }
}

Undici.Dispatcher = Dispatcher;
Undici.Pool = Pool;
Undici.BalancedPool = BalancedPool;
Undici.Client = Client;
Undici.Agent = Agent;
Undici.ProxyAgent = ProxyAgent;

Undici.buildConnector =
  Undici.errors =
  Undici.setGlobalDispatcher =
  Undici.getGlobalDispatcher =
  Undici.request =
  Undici.stream =
  Undici.pipeline =
  Undici.connect =
  Undici.upgrade =
  Undici.MockClient =
  Undici.MockPool =
  Undici.MockAgent =
  Undici.mockErrors =
    notImplemented;

Undici.fetch = fetch;

export default {
  fetch,
  Response,
  Headers,
  Request,
  URLSearchParams,
  URL,
  File,
  FileReader,
  FormData,
  request,
  stream,
  pipeline,
  connect,
  upgrade,
  MockClient,
  MockPool,
  MockAgent,
  mockErrors,
  Dispatcher,
  Pool,
  BalancedPool,
  Client,
  Agent,
  ProxyAgent,
  Undici,
};