import { DiscoveryProvider, DiscoveredCoin } from "./provider";

const BLOCKBERRY_BASE =
  process.env.BLOCKBERRY_BASE || "https://api.blockberry.one/sui/v1";
const INT32_MAX = 2147483647;
const PAGE_SIZE_ENV = Number(process.env.BLOCKBERRY_PAGE_SIZE ?? 100);
const PAGE_SIZE = Math.min(
  Math.max(Number.isFinite(PAGE_SIZE_ENV) ? PAGE_SIZE_ENV : 100, 1),
  100
);
// Fetch all pages by default unless explicitly capped via env.
const MAX_PAGES_DEFAULT = process.env.BLOCKBERRY_MAX_PAGES
  ? Number(process.env.BLOCKBERRY_MAX_PAGES)
  : Number.POSITIVE_INFINITY;
const COINS_PATH = process.env.BLOCKBERRY_COINS_PATH || "/coins";
const ORDER_BY_ENV = (process.env.BLOCKBERRY_ORDER_BY || "DESC").toUpperCase();
const ORDER_BY = ORDER_BY_ENV === "ASC" ? "ASC" : "DESC";
const SORT_BY_ENV = (process.env.BLOCKBERRY_SORT_BY || "AGE").toUpperCase();
const SORT_BY = ["AGE", "NAME", "HOLDERS"].includes(SORT_BY_ENV)
  ? SORT_BY_ENV
  : "AGE";

function getFetch(): typeof fetch {
  if (typeof fetch !== "undefined") return fetch;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { fetch: undiciFetch } = require("node:undici");
    return undiciFetch as typeof fetch;
  } catch {
    throw new Error(
      "Global fetch not available. Use Node.js 18+ or provide undici at runtime."
    );
  }
}

// Partial shape based on docs; we defensively access fields.
// https://docs.blockberry.one/reference/getcoins
interface BlockberryCoin {
  name?: string;
  symbol?: string;
  decimals?: number;
  coinType?: string; // e.g. 0x..::module::TYPE
  coin_type?: string;
  objectId?: string;
  object_id?: string;
  packageId?: string;
  package_id?: string;
  logo?: string;
  logoUrl?: string;
  // Additional aliases from Blockberry docs
  coinName?: string;
  coinSymbol?: string;
  coin_name?: string;
  coin_symbol?: string;
  imgUrl?: string;
  imageUrl?: string;
  img?: string;
  website?: string;
}

interface BlockberryPage {
  data?: BlockberryCoin[];
  items?: BlockberryCoin[];
  list?: BlockberryCoin[];
  content?: BlockberryCoin[];
  nextCursor?: string | null;
  next_cursor?: string | null;
  next?: string | null;
  page?: number;
  total?: number;
  totalPages?: number;
  totalCount?: number;
  number?: number;
  last?: boolean;
  numberOfElements?: number;
}

export class BlockberryProvider implements DiscoveryProvider {
  name = "blockberry";

  async discover(
    maxPages: number = MAX_PAGES_DEFAULT
  ): Promise<DiscoveredCoin[]> {
    const apiKey = process.env.BLOCKBERRY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "BLOCKBERRY_API_KEY not set. Obtain a key from Blockberry and export BLOCKBERRY_API_KEY."
      );
    }

    const $fetch = getFetch();
    const coins: DiscoveredCoin[] = [];

    // Try cursor pagination first, then fall back to page index.
    let cursor: string | undefined = undefined;
    let page = 0; // docs example uses 0-based page
    let pages = 0;

    // Use a single, explicit endpoint: {BLOCKBERRY_BASE}{COINS_PATH}
    const chosenBase = BLOCKBERRY_BASE;
    const chosenPath = COINS_PATH;
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(
        `[blockberry] endpoint base=${chosenBase.replace(
          /\/$/,
          ""
        )} path=${chosenPath}`
      );
    }

    while (pages < maxPages) {
      // Use selected base/path
      const url = new URL(`${chosenBase.replace(/\/$/, "")}${chosenPath}`);
      // Use either cursor or page/size params depending on availability.
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      } else {
        const pageParam = Math.max(0, Math.min(page, INT32_MAX));
        url.searchParams.set("page", String(pageParam));
      }
      url.searchParams.set("size", String(PAGE_SIZE));
      url.searchParams.set("orderBy", ORDER_BY);
      url.searchParams.set("sortBy", SORT_BY);

      const res = await $fetch(url.toString(), {
        headers: {
          // Send both common forms just in case
          "x-api-key": apiKey,
          accept: "*/*",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Blockberry fetch failed ${res.status} at ${
            url.pathname
          }: ${text.slice(0, 200)}`
        );
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Blockberry returned non-JSON at ${url.toString()} (content-type: ${ct}). Body: ${text.slice(
            0,
            200
          )}`
        );
      }
      // Read as text first so we can log and inspect when empty
      const raw = await res.text();
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
          `[blockberry] GET ${url.toString()} -> ${raw.slice(0, 240)}${
            raw.length > 240 ? "…" : ""
          }`
        );
      }
      const data = JSON.parse(raw) as BlockberryPage | BlockberryCoin[];
      const arr: BlockberryCoin[] = Array.isArray(data)
        ? data
        : (data as any).content ||
          (data as any).items ||
          (data as any).data ||
          (data as any).list ||
          [];
      if (process.env.DEBUG && (!arr || arr.length === 0)) {
        // eslint-disable-next-line no-console
        console.log(
          `[blockberry] empty page. keys=${
            Array.isArray(data) ? "[array]" : Object.keys(data).join(",")
          } size=${PAGE_SIZE} page=${page} cursor=${cursor ?? ""} contentLen=${
            Array.isArray(data) ? "n/a" : (data as any).content?.length ?? "n/a"
          }`
        );
      }

      for (const it of arr) {
        const name = (it.name || it.coinName || it.coin_name || "").trim();
        const symbol = (
          it.symbol ||
          it.coinSymbol ||
          it.coin_symbol ||
          ""
        ).trim();
        const decimals = typeof it.decimals === "number" ? it.decimals : 0;
        const logoURI = (it.logoUrl ||
          it.logo ||
          it.imgUrl ||
          it.imageUrl ||
          it.img) as string | undefined;
        const website = it.website as string | undefined;

        // Choose an objectId: prefer explicit objectId fields; otherwise extract a 0x{64} from coinType.
        let objectId = (
          it.objectId ||
          it.object_id ||
          it.packageId ||
          it.package_id ||
          ""
        ).toLowerCase();
        if (!/^0x[0-9a-f]{64}$/.test(objectId || "")) {
          const ct = (it.coinType || it.coin_type || "").toLowerCase();
          const m = ct.match(/0x[0-9a-f]{64}/);
          if (m) objectId = m[0];
        }
        if (!/^0x[0-9a-f]{64}$/.test(objectId)) {
          continue; // skip if we cannot ensure a canonical hex id that passes our validator
        }

        coins.push({
          name,
          symbol,
          decimals,
          objectId,
          logoURI,
          website,
        });
      }

      // Advance pagination
      if (Array.isArray(data)) {
        // If plain array, increment page until empty
        if (arr.length < PAGE_SIZE) break;
        page += 1;
      } else {
        const next =
          (data.nextCursor || data.next_cursor || data.next || null) ?? null;
        if (next) {
          cursor = String(next);
        } else if (arr.length >= PAGE_SIZE) {
          page += 1; // try indexed paging if cursor missing
        } else {
          break;
        }
      }

      pages += 1;
    }

    return coins;
  }
}
