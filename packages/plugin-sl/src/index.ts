export * from "./providers/wallet";
export * from "./types";
export * from "./actions/keygen"
export * from  "./actions/sign"

import type { Plugin } from "@elizaos/core";
import { keygenAction } from "./actions/keygen";
import { signAction } from "./actions/sign";
import {WalletProvider} from "./providers/wallet"
export const slPlugin: Plugin = {
    name: "sl",
    description: "Silence Laboratories: Silent Network plugin for Eliza",
    evaluators: [],
    services: [],
    actions: [signAction, keygenAction],
};

export default slPlugin;
