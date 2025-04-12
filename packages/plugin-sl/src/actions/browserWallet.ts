// lib/browserWallet.ts
import { TypedData, IBrowserWallet } from '@silencelaboratories/walletprovider-sdk';
import { secp256k1 } from '@noble/curves/secp256k1';
import { hashTypedData, hexToBytes, serializeSignature } from 'viem';
import { toHex } from 'viem/utils';
import { Buffer } from 'buffer';

export class BrowserWallet implements IBrowserWallet {
  private privateKey: Uint8Array;

  constructor(privateKeyHex: string) {
    this.privateKey = Uint8Array.from(Buffer.from(privateKeyHex.replace(/^0x/, ''), 'hex'));
  }

  async signTypedData<T>(from: string, request: TypedData<T>): Promise<unknown> {
    const castedRequest = {
      ...request,
      message: request.message as Record<string, unknown>,
    };

    // Create a hash of the typed data.
    const messageHash = hashTypedData(castedRequest);
    const messageBytes = hexToBytes(messageHash);

    // Sign the hash.
    const signature = secp256k1.sign(messageBytes, this.privateKey);

    return serializeSignature({
      r: toHex(signature.r),
      s: toHex(signature.s),
      v: BigInt(signature.recovery) + BigInt(27),
    });
  }
}
