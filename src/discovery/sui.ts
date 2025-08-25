import {
  SuiClient,
  SuiObjectResponse,
  getFullnodeUrl,
  PaginatedEvents,
  SuiEvent,
  EventId,
} from "@mysten/sui/client";
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
    let cursor: EventId | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const response: PaginatedEvents = await this.suiClient.call('suix_queryEvents', [
        { MoveEventType: '0x2::object::NewObject' },
        cursor,
        100, // limit
        false, // descending
      ]);

      for (const event of response.data) {
        if (
          event.type === '0x2::object::NewObject' &&
          event.parsedJson &&
          typeof event.parsedJson === 'object' &&
          'object_type' in event.parsedJson &&
          typeof event.parsedJson.object_type === 'string' &&
          event.parsedJson.object_type.startsWith(COIN_METADATA_TYPE) &&
          'object_id' in event.parsedJson &&
          typeof event.parsedJson.object_id === 'string'
        ) {
          const object = await this.suiClient.getObject({
            id: event.parsedJson.object_id,
            options: { showContent: true, showType: true },
          });
          const coin = this.parseCoinMetadata(object);
          if (coin) {
            coins.push(coin);
          }
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
