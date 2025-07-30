import { PublicClient, http, createPublicClient, getAddress } from 'viem';
import { base } from 'viem/chains';

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined;

if (!ALCHEMY_KEY) {
  console.warn('Missing VITE_ALCHEMY_API_KEY env var');
}

interface GetRecipientParams {
  contractAddress: string;
  fromAddress: string;
}

export async function getRecipientAddresses({ contractAddress, fromAddress }: GetRecipientParams): Promise<Map<string, number>> {
  const client: PublicClient = createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`)
  });

  // Collect all transfers with pagination (Alchemy pageKey)
  let allTransfers: any[] = [];
  let pageKey: string | undefined;

  const baseParams = {
    fromBlock: '0x0',
    fromAddress,
    contractAddresses: [contractAddress],
    category: ['erc721', 'erc1155'],
    withMetadata: false,
    maxCount: '0x3e8', // 1000 transfers per page
    excludeZeroValue: true
  } as const;

  do {
    const params: any = { ...baseParams };
    if (pageKey) params.pageKey = pageKey;

    const pageResult = (await client.request({
      method: 'alchemy_getAssetTransfers',
      params: [params]
    })) as { transfers?: any[]; pageKey?: string };

    if (pageResult?.transfers) {
      allTransfers.push(...pageResult.transfers);
    }
    pageKey = pageResult?.pageKey;
  } while (pageKey);

  const counts = new Map<string, number>();
  for (const tx of allTransfers) {
    const to = (tx as any).to as string | undefined;
    if (!to || to === '0x0000000000000000000000000000000000000000') continue;
    try {
      const checksum = getAddress(to);
      counts.set(checksum, (counts.get(checksum) || 0) + 1);
    } catch {
      /* invalid address, ignore */
    }
  }

  return counts;
}
