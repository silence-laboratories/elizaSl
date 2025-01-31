// keygenAction.js
import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";
import { keygenTemplate } from "../templates";
import {
    WalletProviderServiceClient,
    EOAAuth,
    EphKeyClaim,
    generateEphPrivateKey,
    getEphPublicKey,
    NetworkSigner,
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
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

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
    const privatekey = generatePrivateKey();
    console.log("privatekey",privatekey)
    const mockSignerPrivateKey = privatekey.slice(2);
    const n = 3;
    const t = 2;
    const mockWallet = new MockBrowserWallet(mockSignerPrivateKey);
    const signerPublicKeyBytes = secp256k1.getPublicKey(Buffer.from(mockSignerPrivateKey, "hex"));
    const signerPublicKeyHex = bytesToHex(signerPublicKeyBytes);
    const signerAddress = computeAddress(signerPublicKeyHex);
    const ephemeralPrivateKey = generateEphPrivateKey("secp256k1");
    const ephemeralPublicKey = getEphPublicKey(ephemeralPrivateKey, "secp256k1");
    const ephemeralKeyId = uuidv4();

    // Create authentication modules - UPDATED AUTH CONFIGURATION
    const ephemeralKeyClaim = new EphKeyClaim(
        ephemeralKeyId,
        ephemeralPublicKey,
        "secp256k1",
        60 * 60 // 1 hour lifetime
    );

    // Changed EOAAuth instantiation
    const eoaAuthModule = new EOAAuth(
        signerAddress,
        mockWallet,
        ephemeralKeyClaim // Directly pass the claim instead of wrapping in object
    );

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

    // Update permissions format to match new SDK requirements
    // const permissions = JSON.stringify({
    //     permissions: [
    //         {
    //             type: "generic",
    //             methods: ["signMessage", "verifySignature"]
    //         }
    //     ]
    // });

    const keyGenerationResponse = await eoaNetworkSigner.generateKey(); // Updated parameter
    const primaryKey = keyGenerationResponse;

    // Rest of the code remains the same...
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
            new EphAuth(
                ephemeralKeyId,
                ephemeralPrivateKey,
                "secp256k1"
            )
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
        const keygeneration = content.KeyGenerationService
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
            action: "KEYGEN_ACTION",
          },
        }],
      ],

    similes: ["GENERATE_KEYS", "CREATE_KEY_PAIR", "INITIALIZE_CRYPTO", "start keygen"],

};
