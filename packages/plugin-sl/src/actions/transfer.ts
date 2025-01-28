
import {
    ByteArray,
    bytesToHex,
    formatEther,
    hexToBytes,
    parseEther,
    parseGwei,
    TransactionLegacy,
    type Hex,
} from "viem";
import type { KeygenResponse, SignResponse } from "@silencelaboratories/walletprovider-sdk";
import {
    Action,
    composeContext,
    generateObjectDeprecated,
    HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { initWalletProvider, WalletProvider } from "../providers/wallet";

// === Silence Labs imports
import {
    WalletProviderServiceClient,
    EOAAuth,
    EphKeyClaim,
    generateEphPrivateKey,
    getEphPublicKey,
    NetworkSigner,
    SignRequestBuilder,
    EphAuth,
    // If you prefer Passkey or other auth modules, import them here
} from "@silencelaboratories/walletprovider-sdk";
import { v4 as uuidv4 } from "uuid";
import {
    BrowserWallet,
    connectToBrowserWallet,
    accountsFromBrowserWallet,
} from "./walletEIP6963";
// ^ Example of some EIP1193 bridging. Adjust to your environment.

import { createWalletClient, http, Chain } from "viem";

// For example, your own chain settings might be in your WalletProvider
import type { Transaction, TransferParams } from "../types";
import { transferTemplate } from "../templates";

import { LocalAccount, privateKeyToAccount, publicKeyToAddress, toAccount } from "viem/accounts";
import { secp256k1 } from "@noble/curves/secp256k1";
import {
    Address,
    hashMessage,
    hashTypedData,
    keccak256,
    serializeSignature,
    serializeTransaction,
    Signature,
    toHex,
} from "viem";
import { Base64 } from "js-base64";
import { anvil, sepolia } from "viem/chains";
import { MockBrowserWallet } from "./wallet";

const SILENT_CONFIG = {
    walletProviderId: "myWalletProvider",
    walletProviderUrl: "ws://localhost:8090",
    apiVersion: "v2",
};

const anvilChain = {
    id: 31337,
    name: "Anvil",
    network: "foundry",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["http://127.0.0.1:8545"] },
      public: { http: ["http://127.0.0.1:8545"] },
    },
  } as const;

// Exported for tests
export class TransferAction {
    constructor(private walletProvider: WalletProvider) {}

    async transfer(params: TransferParams): Promise<Transaction> {
        const mockPrivateKey =
            "f6f7f41b5bdb92484edc920e66784a4a7ab3794dc1938b68eab6a90c05c03eae";

        //create public key from private key
        console.log("behenchod");
        const publicKey1 = secp256k1
            .getPublicKey(Buffer.from(mockPrivateKey, "hex"))
            .toString();
        console.log("publicKey1", publicKey1);
        //convery public key to hex
        const publicKey2 = bytesToHex(Buffer.from(publicKey1, "hex"));
        //generate eoa address
        const address = "0xd3D373a3cBC50021745ce30109b090E18d1ced0D";
        const mockWallet = new MockBrowserWallet(mockPrivateKey);
        console.log("mockWallet", mockWallet);
        const ephemeralSK = generateEphPrivateKey("secp256k1");
        console.log("ephemeralSK", ephemeralSK);
        const ephemeralPK = getEphPublicKey(ephemeralSK, "secp256k1");
        console.log("ephemeralPK", ephemeralPK);

        const ephemeralId = uuidv4(); // random ephemeral ID
        console.log("ephemeralId", ephemeralId);
        // Build ephemeral claim
        const ephClaim = new EphKeyClaim(
            ephemeralId,
            ephemeralPK,
            "secp256k1",
            60 * 60 // 1 hour lifetime
        );
        console.log("ephClaim", ephClaim);


        // 3) Create EOAAuth to prove we own 'userEOA' for the ephemeral claim
        const eoaAuth = new EOAAuth(address, mockWallet, { ephClaim });
        console.log("eoaAuth", eoaAuth);

        // 4) Create the WalletProviderServiceClient to talk to the Silent backend
        const wpClient = new WalletProviderServiceClient({
            walletProviderId: SILENT_CONFIG.walletProviderId,
            walletProviderUrl: SILENT_CONFIG.walletProviderUrl,
            apiVersion: "v2",
        });
        console.log("wpClient", wpClient);

        // const ephAuth = new EphAuth(ephemeralId, ephemeralSK, "secp256k1");

        // 5) Construct the main NetworkSigner with threshold=2, parties=3 for example
        const networkSigner = new NetworkSigner(wpClient, 2, 3, eoaAuth);
        console.log("networkSigner", networkSigner);
        let keyId: string;
        let publicKey: string;
        let signAlgs = ["secp256k1"];
        const keyResp  = await networkSigner.generateKey(signAlgs);
        console.log("keyResp", keyResp);
        keyId = keyResp[0].keyId;
        console.log("keyId", keyId);
        publicKey = keyResp[0].publicKey;
        console.log("publicKey", publicKey);
        //public to address
        const address1 = computeAddress(publicKey);
        console.log("address1", address1);

        const authModule = new EphAuth(ephemeralId, ephemeralSK, "secp256k1");
        const sdk = new NetworkSigner(wpClient, 2, 3, authModule);

        // const signature = sdk.signMessage()
        const localAccount = createViemAccount(
            sdk,
            keyId,
            publicKey,
            "secp256k1"
        );
        // or your own chain object
        const walletClient = createWalletClient({
            chain: anvilChain,
            transport: http(anvilChain.rpcUrls.default.http[0]),
            account: localAccount, // silent labs–based signer
        });

        const privateKey =
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const account1 = privateKeyToAccount(privateKey);

        const walletClient1 = createWalletClient({
            chain: anvilChain,
            transport: http(anvilChain.rpcUrls.default.http[0]),
            account: account1, // The MPC-based LocalAccount
          });

        const recipientAddress = localAccount.address;
        console.log("Recipient Address:", recipientAddress);

        // Step 5: Send funds to the address using Anvil's pre-funded default account
        const defaultAccount = "0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Default Anvil account
        const fundAmount = parseEther("1"); // Amount to fund (1 ETH in this case)

        const txHash = await walletClient1.sendTransaction({
            from: defaultAccount,
            to: recipientAddress,
            value: fundAmount,
        } as any);

        console.log("Transaction Hash:", txHash);

        console.log(
            `Transferring: ${params.amount} tokens to (${params.toAddress} on ${params.fromChain})`
        );
        if (!params.data) {
            params.data = "0x";
        }

        this.walletProvider.switchChain(params.fromChain);

        // const walletClient = this.walletProvider.getWalletClient(
        //     params.fromChain
        // );

        try {

            // const hash = await walletClient.sendTransaction({
            //     account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
            //     to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
            //     value: 1000000000000000000n,
            //     maxFeePerGas: parseGwei('20')
            //  });
            //           console.log("Transfer Tx Hash:", hash);
            //   return {
            //     hash,
            //     from: walletClient.account.address,
            //     to: params.toAddress,
            //     value: parseEther(params.amount),
            //     data: params.data as Hex,
            //   };

            //eph key
            //sign,permissions,revoke session key

            let signReq = new SignRequestBuilder().setRequest(uuidv4(), "0x123456", "rawBytes").build()

            let resp = await sdk.signMessage(keyId, "secp256k1", signReq);
            console.log("resp", resp);
            return ;

        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }
}

const buildTransferDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: WalletProvider
): Promise<TransferParams> => {
    const chains = Object.keys(wp.chains);
    state.supportedChains = chains.map((item) => `"${item}"`).join("|");

    const context = composeContext({
        state,
        template: transferTemplate,
    });

    const transferDetails = (await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    })) as TransferParams;

    const existingChain = wp.chains[transferDetails.fromChain];

    if (!existingChain) {
        throw new Error(
            "The chain " +
                transferDetails.fromChain +
                " not configured yet. Add the chain or choose one from configured: " +
                chains.toString()
        );
    }

    return transferDetails;
};

export const transferAction: Action = {
    name: "transfer",
    description: "Transfer tokens between addresses on the same chain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        // 1) Build or retrieve a State object from Eliza
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        console.log("Transfer action handler called");

        // 2) Initialize or load your custom wallet provider
        const walletProvider = await initWalletProvider(runtime);

        // 3) Use a helper that prompts the LLM to fill in fromChain, amount, toAddress, etc.
        const chains = Object.keys(walletProvider.chains);
        state.supportedChains = chains.map((item) => `"${item}"`).join("|");
        const context = composeContext({
            state,
            template: transferTemplate,
        });
        const transferDetails = (await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        })) as TransferParams;

        // 4) Actually run the integrated TransferAction
        const action = new TransferAction(walletProvider);
        try {
            const txResp = await action.transfer(transferDetails);

            // 5) Return success to user
            if (callback) {
                callback({
                    text: `Successfully transferred ${transferDetails.amount} tokens to ${transferDetails.toAddress}\nTransaction Hash: ${txResp.hash}`,
                    content: {
                        success: true,
                        hash: txResp.hash,
                        amount: transferDetails.amount,
                        recipient: transferDetails.toAddress,
                        chain: transferDetails.fromChain,
                    },
                });
            }
            return true;
        } catch (err) {
            console.error("Error during token transfer:", err);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${(err as Error).message}`,
                    content: { error: (err as Error).message },
                });
            }
            return false;
        }
    },
    // Optional: a validate step if needed
    validate: async (runtime: IAgentRuntime) => {
        return true; // e.g. you might check if user has a supported browser wallet, etc.
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "I’ll help you transfer 1 ETH to 0x742d...",
                    action: "SEND_TOKENS",
                },
            },
            {
                user: "user",
                content: {
                    text: "Transfer 1 ETH to 0x742d...",
                    action: "SEND_TOKENS",
                },
            },
        ],
    ],
    similes: ["SEND_TOKENS", "TOKEN_TRANSFER", "MOVE_TOKENS"],
};

/**
 * Create a new viem custom account for signing transactions using
 * the MPC network.
 * @param networkSigner API to communicate with the Silent MPC Network.
 * @param keyId The selected Key ID.
 * @param publicKey Associated public key of the selected Key ID.
 * @param signAlg The signature algorithm for signing (default: secp256k1).
 */
export function createViemAccount(
    networkSigner: NetworkSigner,
    keyId: string,
    publicKey: string,
    signAlg: string = "secp256k1"
): LocalAccount {
    const address = computeAddress(publicKey);
    return toAccount({
        address,
        keyId,
        async signMessage({ message }) {
            const signRequest = new SignRequestBuilder()
                .setRequest(address, hashMessage(message), "EIP191")
                .build();
            const sign = (
                await networkSigner.signMessage(keyId, signAlg, signRequest)
            )[0];
            if (sign) {
                const signature = formatViemSign(sign);
                return serializeSignature(signature);
            }
            throw new Error("No signature returned from network");
        },
        async signTransaction(transaction, args) {
            const serializer = args?.serializer || serializeTransaction;
            const signableTransaction = (() => {
                // For EIP-4844 Transactions, we want to sign the transaction payload body (tx_payload_body) without the sidecars (ie. without the network wrapper).
                // See: https://github.com/ethereum/EIPs/blob/e00f4daa66bd56e2dbd5f1d36d09fd613811a48b/EIPS/eip-4844.md#networking
                if (transaction.type === "eip4844") {
                    return {
                        ...transaction,

                        sidecars: false,
                    };
                }
                return transaction;
            })();

            const signRequest = new SignRequestBuilder()
                .setRequest(
                    address,
                    keccak256(serializer(signableTransaction)),
                    "EIP191"
                )
                .build();
            const sign = (
                await networkSigner.signMessage(keyId, signAlg, signRequest)
            )[0];
            if (sign) {
                const signature = formatViemSign(sign);
                return serializer(transaction, signature);
            }
            throw new Error("No signature returned from network");
        },
        async signTypedData(typedData) {
            const signRequest = new SignRequestBuilder()
                .setRequest(address, hashTypedData(typedData), "EIP712")
                .build();
            const sign = (
                await networkSigner.signMessage(keyId, signAlg, signRequest)
            )[0];
            if (sign) {
                const signature = formatViemSign(sign);
                return serializeSignature(signature);
            }
            throw new Error("No signature returned from network");
        },
    });
}

/** Computes ETH address from ECDSA `publicKey` returned by Silent Network
 * @public
 */
export function computeAddress(publicKey: string): Address {
    if (publicKey.startsWith("0x")) {
        publicKey = publicKey.slice(2);
    }

    if (publicKey.startsWith("04")) {
        return publicKeyToAddress(`0x${publicKey} `);
    } else if (publicKey.startsWith("02") || publicKey.startsWith("03")) {
        const uncompressed =
            secp256k1.ProjectivePoint.fromHex(publicKey).toHex(false);
        return publicKeyToAddress(`0x${uncompressed}`);
    } else {
        throw new Error("Invalid public key");
    }
}

function formatViemSign(signResp: SignResponse): Signature {
    const signb64 = signResp.sign;
    const sign = Base64.decode(signb64);
    const r = toHex(sign.slice(0, 32));
    const s = toHex(sign.slice(32, 64));
    const recid = signResp.recid;
    const signature: Signature = {
        r,
        s,
        v: recid === 0 ? BigInt(27) : BigInt(28),
        yParity: recid,
    };
    return signature;
}
