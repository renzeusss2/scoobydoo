import freighterApi from "@stellar/freighter-api";

export async function getPublicKey(): Promise<string> {
  return await freighterApi.getPublicKey();
}

export async function signTransaction(
  xdr: string,
  network: string
): Promise<string> {
  const res = await (freighterApi.signTransaction(xdr, {
    networkPassphrase: network,
  }) as Promise<string | { signedTxXdr: string }>);

  return typeof res === "string" ? res : res.signedTxXdr;
}