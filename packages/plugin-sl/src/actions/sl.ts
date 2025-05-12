// lib/eliza-sl.ts

import { v4 as uuidv4 } from "uuid";
import {
  LocalAccount,
  toAccount,
} from "viem/accounts";
import {
  WalletProviderServiceClient,
  NetworkSigner,
  SignRequestBuilder,
  EphAuth,
  computeAddress,
  SignResponse
} from "@silencelaboratories/walletprovider-sdk";
import {
  bytesToHex,
  stringToHex,
  keccak256,
  serializeSignature,
  serializeTransaction,
  hashTypedData,
  Signature,
  Hex
} from "viem";

// Note: BrowserWallet is not used in Eliza environment.
// Instead, key generation and config have already been performed on the frontend,
// and the complete keyConfig is downloaded as part of sessionInfo.

// Minimal cluster config (update as needed)
const clusterConfig = {
  walletProviderId: "WalletProvider",
  walletProviderUrl: "ws://34.118.117.249", // or your cluster
  apiVersion: "v1",
};


/**
 * Key configuration shape – this is expected to be included in your downloaded sessionInfo.
 */
export interface KeyConfiguration {
  publicKey: string;
  keyId: string;
  ephemeralKeyId: string;
  ephemeralPrivateKey: string; // hex string (no "0x")
  signerAddress: string;
  t: number;
  n: number;
  sessionAddress: string;
}

function hexToBytesNo0x(hex: string): Uint8Array {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    // Ensure the hex string is 64 characters long (32 bytes)
    hex = hex.padStart(64, '0');
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return out;
  }


/**
 * Instead of using localStorage, we now create the signer from a provided keyConfig.
 *
 * createSignerFromKeyConfig()
 * Re-hydrates the ephemeral key from the provided key configuration
 * and returns a NetworkSigner with the necessary details.
 */
export async function createSignerFromKeyConfig(
    keyConfig: KeyConfiguration
  ): Promise<{
    networkSigner: NetworkSigner;
    keyId: string;
    publicKey: string;
  }> {

    if (!keyConfig.ephemeralPrivateKey) {
        throw new Error("KeyConfig is missing ephemeralPrivateKey");
      }
      const key = keyConfig.ephemeralPrivateKey;
      if (typeof key !== 'string' || !key.startsWith("0x")) {
        throw new Error("ephemeralPrivateKey must be a hex string starting with '0x'");
      }
      // Proceed with converting hex to bytes
    const ephemeralPrivKeyBytes = hexToBytesNo0x(keyConfig.ephemeralPrivateKey);
    const ephAuth = new EphAuth(keyConfig.ephemeralKeyId, ephemeralPrivKeyBytes, "secp256k1");

    const wpClient = new WalletProviderServiceClient({
      walletProviderId: clusterConfig.walletProviderId,
      walletProviderUrl: clusterConfig.walletProviderUrl,
      apiVersion: "v1",
    });

    const networkSigner = new NetworkSigner(wpClient, keyConfig.t, keyConfig.n, ephAuth);
    return {
      networkSigner,
      keyId: keyConfig.keyId,
      publicKey: keyConfig.publicKey,
    };
  }


/**
 * createViemAccount – produce a viem-compatible `account` object that signs raw 32-byte hashes.
 * This function remains the same as in your original sl.ts.
 */
export function createViemAccount(
  networkSigner: NetworkSigner,
  keyId: string,
  publicKey: string,
  signAlg = "secp256k1"
): LocalAccount {
  const address = computeAddress(publicKey);
  console.log("MPC Address =>", address);

  return toAccount({
    address,
    // A) signMessage: perform raw ECDSA on the 32 bytes
    async signMessage({ message }) {
      console.log("MPC signMessage:", message);
      const hexMsg = normalizeToHex(message);
      const signReq = new SignRequestBuilder()
        .setRequest(uuidv4(), hexMsg, "EIP191")
        .build();

      const [resp] = await networkSigner.signMessage(keyId, signAlg, signReq);
      if (!resp) throw new Error("Silence Labs returned empty signature.");

      const flattenSignature = (signgenResponse: SignResponse): `0x${string}` => {
        const { sign, recid } = signgenResponse;
        const recid_hex = (27 + recid).toString(16);
        return `0x${sign}${recid_hex}`;
      };

      return flattenSignature(resp);
    },

    // B) signTransaction: sign the transaction using raw ECDSA over keccak(rlp(tx))
    async signTransaction(tx, args) {
      console.log("MPC signTransaction:", tx);
      const serializer = args?.serializer || serializeTransaction;
      const signableTx = tx.type === "eip4844" ? { ...tx, sidecars: false } : tx;
      const txHash = keccak256(serializer(signableTx));
      const signReq = new SignRequestBuilder()
        .setRequest(address, txHash.slice(2), "rawBytes")
        .build();

      const [resp] = await networkSigner.signMessage(keyId, signAlg, signReq);
      if (!resp) throw new Error("No signature from Silence Labs for tx.");
      const sig = formatViemSign(resp);
      return serializer(tx, sig);
    },

    // C) signTypedData: sign EIP712 typed data
    async signTypedData(typedData) {
      console.log("MPC signTypedData:", typedData);
      const dataHash = hashTypedData(typedData);
      const signReq = new SignRequestBuilder()
        .setRequest(address, dataHash, "rawBytes")
        .build();

      const [resp] = await networkSigner.signMessage(keyId, signAlg, signReq);
      if (!resp) throw new Error("No signature from Silence Labs for typed data.");
      const sig = formatViemSign(resp);
      return serializeSignature(sig);
    },
  });
}

/**
 * Utility: convert any message into a 0x-prefixed hex string.
 */
function normalizeToHex(msg: string | Uint8Array | { raw: string | Uint8Array }): `0x${string}` {
  if (typeof msg === "string") {
    return msg.startsWith("0x")
      ? (msg as `0x${string}`)
      : (stringToHex(msg) as `0x${string}`);
  } else if (msg instanceof Uint8Array) {
    return `0x${bytesToHex(msg)}` as `0x${string}`;
  } else if ("raw" in msg) {
    const val = msg.raw;
    if (typeof val === "string") {
      return val.startsWith("0x")
        ? (val as `0x${string}`)
        : (stringToHex(val) as `0x${string}`);
    } else {
      return `0x${bytesToHex(val)}` as `0x${string}`;
    }
  }
  throw new Error("Unsupported message type for signMessage.");
}

/**
 * formatViemSign – Formats the signature returned by Silence Labs into the structure
 * expected by Viem.
 */
function formatViemSign(resp: SignResponse): Signature {
  const hexSig = resp.sign.startsWith("0x") ? resp.sign.slice(2) : resp.sign;
  const r = "0x" + hexSig.slice(0, 64) as Hex;
  const s = "0x" + hexSig.slice(64, 128) as Hex;
  const recid = resp.recid;
  const v = recid === 0 ? 27n : 28n;
  return { r, s, v, yParity: recid };
}
