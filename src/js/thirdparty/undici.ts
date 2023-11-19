import type * as e from "node:events";
import type { IncomingHttpHeaders } from "node:http";
import type * as s from "stream";

const EventEmitter = require("node:events");
const StreamModule = require("node:stream");
const { Readable } = StreamModule as { Readable: s.Readable };
const { _ReadableFromWebForUndici: ReadableFromWeb } = StreamModule[Symbol.for("::bunternal::")];

const ObjectCreate = Object.create;
const kEmptyObject = ObjectCreate(null) as Record<string, undefined>;

const kBunUndiciProxyAgentUri = Symbol("::bunUndiciProxyAgentUri::");
const kBunUndiciProxyAgentToken = Symbol("::bunUndiciProxyAgentToken::");
// const kBunUndiciProxyAgentHeaders = Symbol("::bunUndiciProxyAgentHeaders::");

const { fetch } = Bun;
// @ts-expect-error `Request` and `Response` not typeof globalThis yet
const { Response, Request, Headers, URLSearchParams, URL, FormData } = globalThis;

class File extends Blob {}
class FileReader extends EventTarget {
  // @ts-expect-error Constructor expects a call to `super()`
  constructor() {
    throw new Error("Not implemented yet!");
  }
}

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

  constructor(response: Response, options = {}) {
    var { body } = response;
    if (!body) throw new Error("Response body is null");
    super(options, body);

    this.#response = response;
    this.#bodyUsed = response.bodyUsed;
  }

  get bodyUsed() {
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
  dispatcher?: Dispatcher;
  method: HttpMethod | string;
  signal?: AbortSignal | e.EventEmitter | null;
  maxRedirections?: number;
  body?: string | Buffer | Uint8Array | s.Readable | null | FormData;
  headers?: string[][] | Record<string, string | ReadonlyArray<string>> | Headers;
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
    // idempotent: false, // GET and HEAD requests are idempotent by default
    // blocking = false,
    // upgrade = false,
    // headersTimeout: 30000,
    // bodyTimeout: 30000,
    reset: false,
    throwOnError: false,
    body: null,
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

  // for (let i = 0; i < inputHeaders.length; i++) {
  //   if (!(Array.isArray(inputHeaders[i]) && inputHeaders[i].length === 2)) {
  //     throw new TypeError(
  //       "Headers must be a `Headers` object, an array of tuples (eg. [[`header-name`, `header_value`], [...]]), or an object.",
  //     );
  //   }
  // }

  // @ts-expect-error `Readable` type not quite right
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

  let proxy: string | undefined;
  if (dispatcher && dispatcher instanceof ProxyAgent) {
    // get proxy uri
    proxy = dispatcher[kBunUndiciProxyAgentUri];
    // if proxyAgent.token is defined, put a proxy auth header with token in the headers
    const token = dispatcher[kBunUndiciProxyAgentToken];
    if (token) {
      if (!inputHeaders) inputHeaders = {};
      if (Array.isArray(inputHeaders)) {
        inputHeaders.push(["proxy-authorization", token]);
      } else if (inputHeaders instanceof Headers) {
        inputHeaders.append("proxy-authorization", token);
      } else {
        inputHeaders["proxy-authorization"] = token;
      }
    }
  }

  let resp;
  const {
    status: statusCode,
    headers,
    // @ts-expect-error Trailers not currently on types in Bun fetch
    trailers,
  } = (resp = await fetch(url, {
    signal,
    mode: "cors",
    method: sanitizedMethod,
    headers: inputHeaders ?? kEmptyObject,
    body: inputBody,
    redirect: maxRedirections === undefined || maxRedirections > 0 ? "follow" : "manual",
    keepalive: !reset,
    proxy,
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

type ProxyAgentOptions = {
  uri: string;
  /**
   * @deprecated use opts.token
   */
  auth?: string;
  token?: string;
  headers?: IncomingHttpHeaders;
};

class ProxyAgent extends Dispatcher {
  #uri: string;
  #token?: string;
  // #headers?: Dict<string | string[]>;

  constructor(uri: string, options: ProxyAgentOptions) {
    super();

    if (!uri || typeof uri !== "string") throw new TypeError("uri must be a string");
    if (uri.startsWith("https://")) throw new TypeError("proxy over TLS not implemented");
    if (!uri.startsWith("http://")) throw new TypeError("uri must be a valid URL string with the protocol `http://`");

    let token;
    if (options) {
      if (typeof options !== "object") throw new TypeError("options must be an object");
      // Auth token can either be passed via `token` or `auth` prop, though `auth` is now deprecated
      const { token: _token, auth, headers } = options;
      if (auth && token) {
        throw new Error(
          "invalid arguments: cannot use `opt.auth` and `opt.token` simultaneously; use `opt.token`, `opt.auth` is deprecated",
        );
      }
      token = _token ?? `Basic ${auth}`;
      if (token && (typeof token !== "string" || !token.startsWith("Basic ")))
        throw new TypeError("token must be a string formatted as `Basic <TOKEN_IN_BASE_64>`");

      if (headers) throw new Error("`headers` not implemented");
    }

    this.#uri = uri;
    this.#token = token;
    // this.#headers = options.headers;
  }

  get [kBunUndiciProxyAgentUri]() {
    return this.#uri;
  }

  get [kBunUndiciProxyAgentToken]() {
    return this.#token;
  }

  // get [kBunUndiciProxyAgentHeaders]() {
  //   return this.#headers;
  // }

  dispatch() {
    return false;
  }

  async close(): Promise<void> {
    return Promise.resolve(void 0);
  }
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
