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
    SignRequestBuilder,
    EphAuth,
    computeAddress,
} from "@silencelaboratories/walletprovider-sdk";
import { v4 as uuidv4 } from "uuid";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "viem";
import { MockBrowserWallet } from "./wallet";
import fs from 'fs';
import path from 'path';

export { keygenTemplate };

// Configuration Manager
class KeyConfigManager {
    public static readonly CONFIG_FILE = path.join(__dirname, 'wallet-config.json');

    static saveConfig(config: KeyConfiguration) {
        fs.writeFileSync(this.CONFIG_FILE, JSON.stringify(config, null, 2));
    }

    static loadConfig(): KeyConfiguration | null {
        try {
            const data = fs.readFileSync(this.CONFIG_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
}

interface KeyConfiguration {
    publicKey: string;
    keyId: string;
    ephemeralKeyId: string;
    ephemeralPrivateKey: string;
    signerAddress: string;
    t: number;
    n: number;
}

export async function generateCryptographicKey() {
    // Configuration
    const mockSignerPrivateKey = "f6f7f41b5bdb92484edc920e66784a4a7ab3794dc1938b68eab6a90c05c03eae";
    const signerAddress = "0xd3D373a3cBC50021745ce30109b090E18d1ced0D";
    const n = 2;
    const t = 3;

    // Initialize mock wallet
    const mockWallet = new MockBrowserWallet(mockSignerPrivateKey);

    // Generate signer public keys
    const signerPublicKeyBytes = secp256k1.getPublicKey(Buffer.from(mockSignerPrivateKey, "hex"));
    const signerPublicKeyHex = bytesToHex(signerPublicKeyBytes);

    // Generate ephemeral keys
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
        walletProviderId: "myWalletProvider",
        walletProviderUrl: "ws://localhost:8090",
        apiVersion: "v2",
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
        ephemeralPrivateKey: bytesToHex(ephemeralPrivateKey),
        signerAddress,
        t: t,
        n: n
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
            const publicKey = await keyService.generateNewKeyPair();
            callback?.({
                text: `Successfully generated cryptographic keys`,
                content: {
                    success: true,
                    publicKey,
                    configLocation: KeyConfigManager.CONFIG_FILE
                },
            });
            return true;
        } catch (error) {
            console.error("Key generation failed:", error.message);
            callback?.({ text: `Key generation error: ${error.message}` });
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
