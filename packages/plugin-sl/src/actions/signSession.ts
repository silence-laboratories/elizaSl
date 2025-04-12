import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import { composeContext, generateObjectDeprecated, ModelClass } from "@elizaos/core";
import {
  createSmartAccountClient,
  toNexusAccount,
  smartSessionActions,

} from "@biconomy/abstractjs";
import { encodeFunctionData, parseEther, Address, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
import { createViemAccount, createSignerFromKeyConfig } from "./sl";
import { readFileSync } from "fs";
import path from "path";
import { transactionTemplate } from "../templates";

// --- Constants --- //
const chain = { ...baseSepolia, id: 84532 };
const ALCHEMY_RPC = "https://base-sepolia.g.alchemy.com/v2/71BtTS_ke_J_XJg8P2LtjAGZuDKOQUJD";
const BICONOMY_BUNDLER_URL = "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";
const ERC20_TOKEN_ADDRESS: Address = "0x03AA93e006fBa956cdBAfa2b8EF789D0Cb63e7b4";

// The path to the downloaded session info file.
const SESSION_INFO_PATH = path.resolve(
  "/Users/yogendrasankhla/Downloads/session-info.json"
);

/**
 * This helper parses a natural language command into recipient and token amount.
 * It expects a command like: "send 0.1 eth to 0xABC123...DEF".
 */
function parseTransactionCommand(text: string): { recipient: string; amount: string } | null {
  const regex = /send\s+([\d.]+)\s*eth\s+to\s+(0x[a-fA-F0-9]{40})/i;
  const match = text.match(regex);
  if (match && match[1] && match[2]) {
    return { amount: match[1], recipient: match[2] };
  }
  return null;
}

export class TransactionAction {
  /**
   * Reads the downloaded session-info.json file and reinitializes the MPC signer using
   * the saved key configuration.
   */
  private async getMpcSigner(sessionInfo: any) {
    // Use the saved key configuration to reinitialize the signer.
    const keyConfig = {
        ...sessionInfo.keyConfig,
        ephemeralPrivateKey: sessionInfo.keyConfig.ephemeralPrivateKey.startsWith('0x')
          ? sessionInfo.keyConfig.ephemeralPrivateKey
          : `0x${sessionInfo.keyConfig.ephemeralPrivateKey}`,
      };

    const { networkSigner, keyId, publicKey } = await createSignerFromKeyConfig(keyConfig);
    const mpcSigner = createViemAccount(networkSigner, keyId, publicKey);
    // Validate that the signer’s address matches what we saved in sessionDetails.
    if (mpcSigner.address.toLowerCase() !== sessionInfo.keyConfig.sessionAddress.toLowerCase()) {
        throw new Error("MPC signer configuration mismatch with session info");
      }
    return mpcSigner;
  }

  /**
   * Reads session-info.json, reconstructs the MPC signer and Nexus account, parses the natural language
   * command from the message text (if not provided via _options), and executes the ERC20 transfer.
   * Returns the user operation hash.
   *
   * @param commandText - The full command text (e.g., "send 0.1 eth to 0xABC123...DEF")
   */
  async executeTransaction(commandText: string): Promise<string> {
    // Read session info from disk.
    let rawSessionData: string;
    try {
      rawSessionData = readFileSync(SESSION_INFO_PATH, "utf-8");
    } catch (error) {
      console.error("Error reading session info file:", error);
      throw new Error("Session info file not found. Please ensure sessionInfo.json is available.");
    }
    // Parse the session info; using JSON.parse here (if needed, you may use parse() from abstractjs)
    const sessionInfo = JSON.parse(rawSessionData);
    console.log("Session info loaded:", sessionInfo);

    // Reinitialize the MPC signer using the saved key configuration.
    const mpcSigner = await this.getMpcSigner(sessionInfo);

    // Parse the command text to extract recipient and amount.
    const parsed = parseTransactionCommand(commandText);
    if (!parsed) {
      throw new Error("Unable to parse transaction command. Please use the format: 'send 0.1 eth to 0xABC123...DEF'");
    }
    const { recipient, amount } = parsed;
    console.log("Parsed command:", { recipient, amount });

    // Create an emulated account using the saved Nexus account address from session info.
    const emulatedAccount = await toNexusAccount({
      accountAddress: sessionInfo.nexusAccountAddress,
      signer: mpcSigner,
      chain,
      transport: http(ALCHEMY_RPC),
    });

    // Create the smart account client.
    const nexusClient = createSmartAccountClient({
      account: emulatedAccount,
      transport: http(BICONOMY_BUNDLER_URL),
    });

    // Prepare the ERC20 transfer call data.
    const data = encodeFunctionData({
      abi: parseAbi([
        "function transfer(address to, uint256 amount) returns (bool)",
      ]),
      functionName: "transfer",
      args: [recipient as Address, parseEther(amount)],
    });

    // Extend the client with smart session actions.
    const smartSessionsClient = nexusClient.extend(smartSessionActions());

    // Execute the transaction using the pre-authorized session details.
    const userOpHash = await smartSessionsClient.usePermission({
      sessionDetails: sessionInfo.sessionDetails,
      calls: [
        {
          to: ERC20_TOKEN_ADDRESS,
          data,
        },
      ],
      mode: "ENABLE_AND_USE",
    });

    // Wait for the operation receipt and verify success.
    const receipt = await nexusClient.waitForUserOperationReceipt({ hash: userOpHash });
    if (!receipt.success) throw new Error("Transfer failed");

    return userOpHash;
  }
}

export const transactionAction = {
  name: "executeTransaction",
  description: "Execute an ERC20 transfer using pre-authorized session info parsed from command text.",
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    state: State,
    _options: any,
    callback?: any
  ) => {
    console.log("Transaction action handler initiated");

    // Compose context for additional runtime parameters if needed.
    const transactionContext = composeContext({
      state,
      template: transactionTemplate,
    });
    await generateObjectDeprecated({
      runtime,
      context: transactionContext,
      modelClass: ModelClass.SMALL,
    });

    try {
      // Use the natural language command text from the message.
      // For Eliza OS, the command is typically provided within _message.content.text.
      let commandText = _options?.text;
      if (!commandText && _message && _message.content && typeof _message.content.text === "string") {
        commandText = _message.content.text;
      }

      if (!commandText) {
        throw new Error("No transaction command text provided.");
      }

      const action = new TransactionAction();
      const txHash = await action.executeTransaction(commandText);

      callback?.({
        text: ` 🚀 Transaction executed successfully!\n🔗 Transaction Hash: ${txHash}`,
        content: {
          success: true,
          transaction_hash: txHash,
        },
      });
      return true;
    } catch (error: any) {
      console.error("Transaction execution failed:", error);
      callback?.({
        text: ` ❌ Transaction execution failed: ${error.message}`,
      });
      return false;
    }
  },
  template: transactionTemplate,
  validate: async (_runtime: IAgentRuntime) => true,
  examples: [
    [
      {
        user: "user",
        content: {
          text: "send 0.1 eth to 0xABC123DEF4567890ABC123DEF4567890ABC123DE", // Example command text
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],
  ],
  similes: ["EXECUTE_TRANSACTION", "RUN_SESSION", "SUBMIT_TRANSACTION"],
};
