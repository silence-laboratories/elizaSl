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
} from "@silencelaboratories/walletprovider-sdk";
import { v4 as uuidv4 } from "uuid";
import { KeyConfigManager } from "./keygen";
import { Buffer } from 'buffer';
import { hexToBytes, keccak256 } from "viem";
import { request } from "http";

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
                walletProviderId: "WalletProvider",
                walletProviderUrl: "ws://34.118.117.249",
                apiVersion: "v1",
            }),
            config.t,
            config.n,
            authModule
        );
    }
// Add hex conversion utility
     private hexToBytes(hexString: string): Uint8Array {
        return Uint8Array.from(Buffer.from(hexString, 'hex'));
    }

    async signMessage(): Promise<string> {
        const config = KeyConfigManager.loadConfig();
        if (!config?.keyId) {
            throw new Error("Missing key ID in configuration");
        }
        const signer = await this.getConfiguredSigner();
        // const messageHashBytes = hexToBytes(`0x${messageToSign}`);
        // const messageHashHex = keccak256(messageHashBytes);
        // const signMessage1 = JSON.stringify({
        //     message: "0x345346543",
        //     requestType: 'rawBytes',
        //   });
        const signMessage = JSON.stringify({
            message: JSON.stringify({
              userOperation: {
                sender: '0x8d4cb2540d993fe34c646299f1ab4af3012ff34c',
                nonce: '0x7',
                initCode: '0x',
                callData:
                '0000189a0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044095ea7b30000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000',
                callGasLimit: '0x18473',
                verificationGasLimit: '0x18473',
                preVerificationGas: '66768',
                maxFeePerGas: '',
                maxPriorityFeePerGas: '',
                paymasterAndData: '0x',
              },
              entryPointVersion: 'v0.6.0',
              entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
              chainId: 80002,
            }),
            requestType: 'accountAbstractionTx',
          });
        const signatureResult = await signer.signMessage(
            config.keyId,
            signMessage
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



        try {
            const action = new SignAction();
            const signature = await action.signMessage();
            const config = KeyConfigManager.loadConfig();

            callback?.({
                text: `✍️ Dobby has signed the message with ${config?.keyId?.slice(0, 8)}...!\n` +
                      `🔏 Signature: ${signature}\n` +
                      `🔑 Used Key: ${config?.publicKey?.slice(0, 16)}...`,
                content: {
                    success: true,
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
