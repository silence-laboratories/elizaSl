export * from "./providers/wallet";
export * from "./types";
export * from "./actions/sign";
export * from "./actions/keygen";
export * from "./providers/wallet";
export * from "./actions/signSession";

import type { Plugin } from "@elizaos/core";
import { signAction } from "./actions/sign"
import { keygenAction } from "./actions/keygen";
import { transactionAction } from "./actions/signSession";

export const slPlugin: Plugin = {
    name: "sl",
    description: "Silence Laboratories: Silent Network plugin for Eliza",
    providers: [],
    evaluators: [],
    services: [],
    actions: [signAction, keygenAction,transactionAction],
};

export default slPlugin;
