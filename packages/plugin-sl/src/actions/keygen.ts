// keygenAction.js
import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";
import { keygenTemplate } from "../templates";
import * as viem from "viem";
import {
    WalletProviderServiceClient,
    EOAAuth,
    EphKeyClaim,
    generateEphPrivateKey,
    getEphPublicKey,
    NetworkSigner,
    SignRequestBuilder,
    EphAuth,
    computeAddress,
} from "@silencelaboratories/walletprovider-sdk";
import { v4 as uuidv4 } from "uuid";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex, Hex } from "viem";
import { MockBrowserWallet } from "./wallet";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { privateKeyToAccount } from "viem/accounts";

export { keygenTemplate };

// Configuration Manager
export class KeyConfigManager {
    private static readonly configPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'wallet-config.json'
    );

    // Add public accessor for config path
    static get configFilePath(): string {
        return this.configPath;
    }

    static saveConfig(config: KeyConfiguration) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    static loadConfig(): KeyConfiguration | null {
        try {
            const data = fs.readFileSync(this.configPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
}

export interface KeyConfiguration {
    publicKey: string;
    keyId: string;
    ephemeralKeyId: string;
    ephemeralPrivateKey: string;
    signerAddress: string;
    t: number;
    n: number;
    sesssionAddress:string;
}

export async function generateCryptographicKey() {
    // Configuration
    const mockSignerPrivateKey = process.env.MOCK_SIGNER_PRIVATEKEY;
    const n = 3;
    const t = 2;
    const mockWallet = new MockBrowserWallet(mockSignerPrivateKey);
    const signerPublicKeyBytes = secp256k1.getPublicKey(Buffer.from(mockSignerPrivateKey, "hex"));
    const signerPublicKeyHex = bytesToHex(signerPublicKeyBytes);
    const signerAddress = computeAddress(signerPublicKeyHex);
    const ephemeralPrivateKey = generateEphPrivateKey("secp256k1");
    const ephemeralPublicKey = getEphPublicKey(ephemeralPrivateKey, "secp256k1");
    const ephemeralKeyId = uuidv4();

    // Create authentication modules
    const ephemeralKeyClaim = new EphKeyClaim(
        ephemeralKeyId,
        ephemeralPublicKey,
        "secp256k1",
        60 * 60 // 1 hour lifetime
    );

    const eoaAuthModule = new EOAAuth(signerAddress, mockWallet, { ephClaim: ephemeralKeyClaim });

    const walletProviderClient = new WalletProviderServiceClient({
        walletProviderId: "WalletProvider",
        walletProviderUrl: "ws://34.118.117.249",
        apiVersion: "v1",
    });

    // Initialize network signers
    const eoaNetworkSigner = new NetworkSigner(
        walletProviderClient,
        t,
        n,
        eoaAuthModule
    );

    const keyGenerationResponse = await eoaNetworkSigner.generateKey(["secp256k1"]);
    const [primaryKey] = keyGenerationResponse;

    // Create ephemeral auth module
    const ephemeralAuthModule = new EphAuth(
        ephemeralKeyId,
        ephemeralPrivateKey,
        "secp256k1"
    );

    // Save configuration
    const keyConfig: KeyConfiguration = {
        publicKey: primaryKey.publicKey,
        keyId: primaryKey.keyId,
        ephemeralKeyId,
        ephemeralPrivateKey: Buffer.from(ephemeralPrivateKey).toString('hex'),
        signerAddress,
        t: t,
        n: n,
        sesssionAddress: computeAddress(primaryKey.publicKey)

    };

    KeyConfigManager.saveConfig(keyConfig);

    return {
        networkSigner: eoaNetworkSigner,
        publicKey: primaryKey.publicKey,
        keyId: primaryKey.keyId,
        ephemeralAuthSigner: new NetworkSigner(
            walletProviderClient,
            t,
            n,
            ephemeralAuthModule
        )
    };
}

export class KeyGenerationService {
    constructor() {
        // Check for existing configuration
        const existingConfig = KeyConfigManager.loadConfig();
        if (existingConfig) {
            console.log('Loaded existing key configuration');
        }
    }

    async generateNewKeyPair(): Promise<string> {
        const { publicKey } = await generateCryptographicKey();
        return publicKey;
    }
}

export const keygenAction = {
    name: "keygen",
    description: "Generate and store cryptographic keys",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        console.log("Starting key generation process");

        const keygenContext = composeContext({
            state,
            template: keygenTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: keygenContext,
            modelClass: ModelClass.SMALL,
        });

        if (!content.keygen) {
            callback?.({ text: "Invalid key generation request format" });
            return false;
        }

        const keyService = new KeyGenerationService();
        try {
            const { publicKey, keyId } = await generateCryptographicKey();

            // Get config for additional details
            const config = KeyConfigManager.loadConfig();

            const responseText =
                `Dobby has forged a new cryptographic key!\n` +
                `✨ Public Key: ${publicKey}\n` +
                `🔑 Key ID: ${keyId}\n` +
                `📁 Config: ${config}`;

            callback?.({
                text: responseText,
                content: {
                    success: true,
                    publicKey,
                    keyId,
                    ephemeralKeyId: config?.ephemeralKeyId,
                    configLocation: KeyConfigManager.configFilePath
                },
            });
            return true;
        } catch (error) {
            console.error("Key generation failed:", error.message);
            callback?.({
                text: `Key generation failed! Dobby is sorry... (${error.message})`
            });
            return false;
        }
    },
    template: keygenTemplate,
    validate: async (_runtime: IAgentRuntime) => true,
    examples: [
        [{
            user: "user",
            content: {
                text: "Generate new cryptographic keys",
                action: "GENERATE_KEYS",
            },
        }],
    ],
    similes: ["GENERATE_KEYS", "CREATE_KEY_PAIR", "INITIALIZE_CRYPTO"],
};
