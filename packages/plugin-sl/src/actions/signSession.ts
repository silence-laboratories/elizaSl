/* src/actions/transaction.ts
 *
 * Eliza-OS action that:
 *   • receives a natural-language transfer command
 *   • receives a UUID (`session_id`) that identifies the session-info JSON in the backend DB
 *   • fetches that JSON over HTTP (`GET /api/session` with x-user-id header)
 *   • reconstructs MPC signer & Nexus account, then submits the ERC-20 transfer
 */

import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import {
  composeContext,
  generateObjectDeprecated,
  ModelClass,
} from "@elizaos/core";

import {
  createSmartAccountClient,
  toNexusAccount,
  smartSessionActions,
} from "@biconomy/abstractjs";

import {
  encodeFunctionData,
  parseEther,
  Address,
  http,
  parseAbi,
} from "viem";
import { baseSepolia } from "viem/chains";

import {
  createViemAccount,
  createSignerFromKeyConfig,
} from "./sl";

import { transactionTemplate } from "../templates";

/* ---------- constants ---------- */
const chain = { ...baseSepolia, id: 84532 };
const ALCHEMY_RPC =
  "https://base-sepolia.g.alchemy.com/v2/71BtTS_ke_J_XJg8P2LtjAGZuDKOQUJD";
const BICONOMY_BUNDLER_URL =
  "https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";
const ERC20_TOKEN_ADDRESS: Address =
  "0x03AA93e006fBa956cdBAfa2b8EF789D0Cb63e7b4";

/* backend that stores session-info JSON */
const SESSION_ENDPOINT = "https://sessionstoreservice.demo.silencelaboratories.com/api/session";

/* ---------- utils ---------- */
function parseTransactionCommand(text: string): {
  recipient: string;
  amount: string;
} | null {
  const regex = /send\s+([\d.]+)\s*eth\s+to\s+(0x[a-fA-F0-9]{40})/i;
  const m = text.match(regex);
  return m ? { amount: m[1], recipient: m[2] } : null;
}

/* ---------- action ---------- */
class TransactionAction {
  /** GET /api/session with x-user-id header → JSON object */
  private async fetchSessionInfo(sessionId: string) {
    const res = await fetch(SESSION_ENDPOINT, {
      headers: { "x-user-id": sessionId },
    });
    if (!res.ok) throw new Error(await res.text());

    /* unwrap new shape, fall back to old */
    const data = await res.json();
    return data.sessionInfo ?? data;          // ← ★ THIS LINE
  }


  /** MPC signer from keyConfig */
  private async getMpcSigner(sessionInfo: any) {
    const epk = sessionInfo.keyConfig.ephemeralPrivateKey;
    const keyConfig = {
      ...sessionInfo.keyConfig,
      /* prepend 0x if missing */
      ephemeralPrivateKey: epk.startsWith("0x") ? epk : `0x${epk}`,
    };


    const { networkSigner, keyId, publicKey } =
      await createSignerFromKeyConfig(keyConfig);
    const mpcSigner = createViemAccount(networkSigner, keyId, publicKey);

    if (
      mpcSigner.address.toLowerCase() !==
      sessionInfo.keyConfig.sessionAddress.toLowerCase()
    ) {
      throw new Error("MPC signer address mismatch with session info");
    }
    return mpcSigner;
  }

  /** full flow: fetch JSON, rebuild signer, submit ERC-20 transfer */
  async executeTransaction(commandText: string, sessionId: string) {
    /* 1️⃣ fetch session-info */
    const sessionInfo = await this.fetchSessionInfo(sessionId);
    console.log("Session fetched:", sessionInfo);

    /* 2️⃣ rebuild MPC signer */
    const mpcSigner = await this.getMpcSigner(sessionInfo);

    /* 3️⃣ parse natural-language command */
    const parsed = parseTransactionCommand(commandText);
    if (!parsed)
      throw new Error(
        "Parse error. Use: 'send 0.1 eth to 0xABC123...'",
      );
    const { recipient, amount } = parsed;

    /* 4️⃣ emulated Nexus account */
    const emulatedAccount = await toNexusAccount({
      accountAddress: sessionInfo.nexusAccountAddress,
      signer: mpcSigner,
      chain,
      transport: http(ALCHEMY_RPC),
    });

    /* 5️⃣ client */
    const nexusClient = createSmartAccountClient({
      account: emulatedAccount,
      transport: http(BICONOMY_BUNDLER_URL),
    });

    /* 6️⃣ call data for ERC20 transfer */
    const data = encodeFunctionData({
      abi: parseAbi([
        "function transfer(address to, uint256 amount) returns (bool)",
      ]),
      functionName: "transfer",
      args: [recipient as Address, parseEther(amount)],
    });

    const smartSessionsClient = nexusClient.extend(smartSessionActions());

    /* 7️⃣ use pre-authorised session */
    const userOpHash = await smartSessionsClient.usePermission({
      sessionDetails: sessionInfo.sessionDetails,
      calls: [{ to: ERC20_TOKEN_ADDRESS, data }],
      mode: "ENABLE_AND_USE",
    });

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    if (!receipt.success) throw new Error("Transfer failed");

    return userOpHash;
  }
}

/* ---------- exported Eliza action ---------- */
export const transactionAction = {
  name: "executeTransaction",
  description:
    "Execute an ERC-20 transfer via pre-authorised smart session.",
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    state: State,
    _options: any,
    callback?: any,
  ) => {
    /* pull natural-language command */
    /* pull natural-language command */
    let commandText =
    _options?.text ??
    (_message?.content?.text as string | undefined);
    if (!commandText) throw new Error("Missing command text.");

    /* ✂️ grab session_id prefix  [sid:UUID] */
    let sessionId =
    _options?.session_id ??
    (_message?.content?.session_id as string | undefined);
    const sidMatch = commandText.match(/\[sid:([0-9a-fA-F-]{36})]/);
    if (!sessionId && sidMatch) {
    sessionId = sidMatch[1];
    commandText = commandText.replace(sidMatch[0], "").trim();  // remove tag
    }
    if (!sessionId) throw new Error("Missing session_id (UUID).");


    /* (optional) compose context for LLM prompt */
    const ctx = composeContext({ state, template: transactionTemplate });
    await generateObjectDeprecated({
      runtime,
      context: ctx,
      modelClass: ModelClass.SMALL,
    });

    try {
      const action = new TransactionAction();
      const txHash = await action.executeTransaction(
        commandText,
        sessionId,
      );

      callback?.({
        text: `🚀 Transaction sent!\n🔗 Hash: ${txHash}`,
        content: { success: true, transaction_hash: txHash },
      });
      return true;
    } catch (e: any) {
      console.error(e);
      callback?.({
        text: `❌ Transaction failed: ${e.message}`,
        content: { success: false },
      });
      return false;
    }
  },
  template: transactionTemplate,
  validate: async () => true,
  examples: [
    [
      {
        user: "user",
        content: {
          text: "send 0.1 eth to 0xABC123DEF4567890ABC123DEF4567890ABC123DE",
          session_id: "550e8402-e48b-42d4-a716-446655440000",
        },
      },
    ],
  ],
  similes: ["EXECUTE_TRANSACTION", "RUN_SESSION", "SUBMIT_TRANSACTION"],
};
