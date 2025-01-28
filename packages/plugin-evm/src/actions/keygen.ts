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
    // If you prefer Passkey or other auth modules, import them here
} from "@silencelaboratories/walletprovider-sdk";
import { v4 as uuidv4 } from "uuid";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "viem";
import { MockBrowserWallet } from "./wallet";


export { keygenTemplate };

export async function keygen() {
    const mockPrivateKey =
    "f6f7f41b5bdb92484edc920e66784a4a7ab3794dc1938b68eab6a90c05c03eae";

// Generate public key from the private key
const mockWallet = new MockBrowserWallet(mockPrivateKey);

const publicKey1 = secp256k1
    .getPublicKey(Buffer.from(mockPrivateKey, "hex"))
    .toString();
const publicKey2 = bytesToHex(Buffer.from(publicKey1, "hex"));

// Generate ephemeral keys
const ephemeralSK = generateEphPrivateKey("secp256k1");
const ephemeralPK = getEphPublicKey(ephemeralSK, "secp256k1");

const ephemeralId = uuidv4();
const ephClaim = new EphKeyClaim(
    ephemeralId,
    ephemeralPK,
    "secp256k1",
    60 * 60 // 1 hour lifetime
);

const address = "0xd3D373a3cBC50021745ce30109b090E18d1ced0D";

const eoaAuth = new EOAAuth(address, mockWallet, { ephClaim });
const wpClient = new WalletProviderServiceClient({
    walletProviderId: "myWalletProvider",
    walletProviderUrl: "ws://localhost:8090",
    apiVersion: "v2",
});
// todo get these from env

const networkSigner = new NetworkSigner(wpClient, 2, 3, eoaAuth);
const keyResp = await networkSigner.generateKey(["secp256k1"]);

const authModule = new EphAuth(ephemeralId, ephemeralSK, "secp256k1");
const sdk = new NetworkSigner(wpClient, 2, 3, eoaAuth);

const sdk1= new NetworkSigner(wpClient, 2, 3, authModule);

const publicKey = keyResp[0].publicKey
const keyId = keyResp[0].keyId
console.log("keygen: public key", publicKey)
return {
    sdk,
    publicKey,
    keyId,
    sdk1
}
}

export class KeygenAction {
    constructor() {
        // Placeholder for any required initialization.
    }

    async generateKey(): Promise<string> {
        return (await keygen()).publicKey
    }
}

export const keygenAction = {
    name: "keygen",
    description: "Generate a cryptographic key",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        console.log("Keygen action handler called");

        // Compose keygen context
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
            if (callback) {
                callback({ text: "Invalid request for key generation" });
            }
            return false;
        }

        const action = new KeygenAction();
        try {
            const publicKey = await action.generateKey();
            if (callback) {
                callback({
                    text: `Key generated successfully. Public Key: ${publicKey}`,
                    content: {
                        success: true,
                        publicKey,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error in keygen handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: keygenTemplate,
    validate: async (_runtime: IAgentRuntime) => {
        return true; // No specific validation needed.
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Generate a new cryptographic key",
                    action: "KEYGEN_ACTION",
                },
            },
        ],
    ],
    similes: ["KEYGEN_ACTION", "GENERATE_KEY", "CREATE_KEY"],
};
