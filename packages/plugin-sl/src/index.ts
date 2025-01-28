export * from "./actions/bridge";
export * from "./actions/swap";
export * from "./actions/transfer";
export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { bridgeAction } from "./actions/bridge";
import { swapAction } from "./actions/swap";
import { transferAction } from "./actions/transfer";
import { signAction } from "./actions/sign"
import { keygenAction } from "./actions/keygen";
import { evmWalletProvider } from "./providers/wallet";

export const slPlugin: Plugin = {
    name: "sl",
    description: "Silence Laboratories: Silent Network plugin for Eliza",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [transferAction, bridgeAction, swapAction, signAction, keygenAction],
};

export default slPlugin;
