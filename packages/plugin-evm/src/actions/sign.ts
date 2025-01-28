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


import { generateCryptographicKey } from "./keygen";
export { signTemplate };

export class SignAction {
    constructor() {
        // Placeholder for any required initialization.
    }

    async sign(messageToSign: string): Promise<string> {
        // Placeholder for the actual sign method.
        // Assume this will be imported and implemented elsewhere.


        const {ephemeralAuthSigner, keyId} = await generateCryptographicKey()

        let signReq = new SignRequestBuilder().setRequest(uuidv4(), messageToSign, "rawBytes").build()

        let resp = await ephemeralAuthSigner.signMessage(keyId, "secp256k1", signReq);
        console.log("resp", resp);

        return resp[0].sign

    }
}

export const signAction = {
    name: "sign",
    description: "Sign a message",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        console.log("Sign action handler called");

        // Compose sign context
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

        if (!messageToSign || typeof messageToSign !== "string") {
            if (callback) {
                callback({ text: "Invalid message to sign" });
            }
            return false;
        }

        const action = new SignAction();
        try {
            const signature = await action.sign(messageToSign);
            if (callback) {
                callback({
                    text: `Successfully signed the message. Signature: ${signature}`,
                    content: {
                        success: true,
                        message: messageToSign,
                        signature,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error in sign handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: signTemplate,
    validate: async (_runtime: IAgentRuntime) => {
        return true; // No specific validation needed.
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Sign this message: 'Hello, blockchain world!'",
                    action: "SIGN_MESSAGE",
                },
            },
        ],
    ],
    similes: ["SIGN_MESSAGE", "MESSAGE_SIGN", "GENERATE_SIGNATURE"],
};
