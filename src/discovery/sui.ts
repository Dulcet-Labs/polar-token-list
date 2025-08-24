import {
  SuiClient,
  SuiObjectResponse,
  getFullnodeUrl,
  PaginatedObjectsResponse,
} from "@mysten/sui.js/client";
import { DiscoveryProvider, DiscoveredCoin } from "./provider";

// The type of the CoinMetadata struct is 0x2::coin::CoinMetadata<T>
// We can use this to query for all CoinMetadata objects.
const COIN_METADATA_TYPE = "0x2::coin::CoinMetadata";

// A regex to extract the coin type from the CoinMetadata object's type.
// e.g. 0x2::coin::CoinMetadata<0x2::sui::SUI> -> 0x2::sui::SUI
const COIN_TYPE_REGEX = /<(.+)>$/;

// The fields of a CoinMetadata object.
// Based on https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/packages/sui-framework/sources/coin.move#L36
type CoinMetadataFields = {
  id: string;
  decimals: number;
  name: string;
  symbol: string;
  description: string;
  icon_url: string | null;
};

export class SuiRpcProvider implements DiscoveryProvider {
  public readonly name = "sui-rpc";
  private suiClient: SuiClient;

  constructor(
    suiClient: SuiClient = new SuiClient({ url: getFullnodeUrl("mainnet") })
  ) {
    this.suiClient = suiClient;
  }

  async discover(): Promise<DiscoveredCoin[]> {
    const coins: DiscoveredCoin[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const response: PaginatedObjectsResponse = await (
        this.suiClient as any
      ).queryObjects({
        options: {
          showType: true,
          showContent: true,
        },
        filter: {
          StructType: COIN_METADATA_TYPE,
        },
        cursor,
      });

      for (const object of response.data) {
        const coin = this.parseCoinMetadata(object);
        if (coin) {
          coins.push(coin);
        }
      }

      cursor = response.nextCursor ?? null;
      hasNextPage = response.hasNextPage;
    }

    return coins;
  }

  private parseCoinMetadata(
    object: SuiObjectResponse
  ): DiscoveredCoin | null {
    if (
      !object.data ||
      object.data.content?.dataType !== "moveObject" ||
      !object.data.type
    ) {
      return null;
    }

    const coinTypeMatch = object.data.type.match(COIN_TYPE_REGEX);
    if (!coinTypeMatch) {
      return null;
    }
    const coinType = coinTypeMatch[1];

    const fields = object.data.content.fields as CoinMetadataFields;
    if (!fields.name || !fields.symbol || !fields.decimals) {
      return null;
    }

    return {
      objectId: coinType,
      name: fields.name,
      symbol: fields.symbol,
      decimals: fields.decimals,
      logoURI: fields.icon_url || undefined,
    };
  }
}
