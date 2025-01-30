// signAction.js
import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";
import { signTemplate } from "../templates";
import {
    WalletProviderServiceClient,
    EphAuth,
    NetworkSigner,
    SignRequestBuilder
} from "../sdk";

import { v4 as uuidv4 } from "uuid";
import { KeyConfigManager } from "./keygen";
import { Buffer } from 'buffer';
import { hexToBytes } from "viem";

export { signTemplate };

export class SignAction {
    private async getConfiguredSigner() {
        const config = KeyConfigManager.loadConfig();
        if (!config || !config.ephemeralKeyId || !config.ephemeralPrivateKey) {
            throw new Error("No cryptographic configuration found. Generate keys first!");
        }
        const ephemeralPrivateKey = this.hexToBytes(config.ephemeralPrivateKey);



        // Recreate auth module from stored config
        const authModule = new EphAuth(
            config.ephemeralKeyId,
            ephemeralPrivateKey,
            "secp256k1"
        );

        return new NetworkSigner(
            new WalletProviderServiceClient({
                walletProviderId: "myWalletProvider",
                walletProviderUrl: "ws://localhost:8090",
                apiVersion: "v2",
            }),
            config.t,
            config.n,
            authModule
        );
    }
// Add hex conversion utility
    private hexToBytes(hexString: string): Uint8Array {
    if (hexString.length !== 64) {
        throw new Error(`Invalid hex string length. Expected 64 characters, got ${hexString.length}`);
    }

    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
}

    async signMessage(messageToSign: string): Promise<string> {
        const config = KeyConfigManager.loadConfig();
        if (!config?.keyId) {
            throw new Error("Missing key ID in configuration");
        }

        const signer = await this.getConfiguredSigner();
        const signReq = new SignRequestBuilder()
            .setRequest(uuidv4(), messageToSign, "rawBytes")
            .build();

        const [signatureResult] = await signer.signMessage(
            config.keyId,
            "secp256k1",
            signReq
        );

        return signatureResult.sign;
    }
}

export const signAction = {
    name: "sign",
    description: "Sign a message using configured keys",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        console.log("Sign action handler initiated");

        const signContext = composeContext({
            state,
            template: signTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: signContext,
            modelClass: ModelClass.SMALL,
        });

        const messageToSign = content.message_to_sign;
        if (!messageToSign?.trim()) {
            callback?.({ text: "Dobby needs a message to sign!" });
            return false;
        }

        try {
            const action = new SignAction();
            const signature = await action.signMessage(messageToSign);
            const config = KeyConfigManager.loadConfig();

            callback?.({
                text: `✍️ Dobby has signed the message with ${config?.keyId?.slice(0, 8)}...!\n` +
                      `📝 Message: "${messageToSign}"\n` +
                      `🔏 Signature: ${signature}\n` +
                      `🔑 Used Key: ${config?.publicKey?.slice(0, 16)}...`,
                content: {
                    success: true,
                    message: messageToSign,
                    signature,
                    keyId: config?.keyId,
                    publicKey: config?.publicKey
                },
            });
            return true;
        } catch (error) {
            console.error("Signing failed:", error);
            callback?.({
                text: `❌ Dobby dropped the quill! ${error.message}`
            });
            return false;
        }
    },
    template: signTemplate,
    validate: async (_runtime: IAgentRuntime) => true,
    examples: [
        [{
            user: "user",
            content: {
                text: "Sign this important message: 'Hogwarts forever!'",
                action: "SIGN_MESSAGE",
            },
        }],
    ],
    similes: ["SIGN_MESSAGE", "CREATE_DIGITAL_SEAL", "AUTHENTICATE_CONTENT"],
};
