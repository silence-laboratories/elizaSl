export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { signAction } from "./actions/sign"
import { keygenAction } from "./actions/keygen";

export const slPlugin: Plugin = {
    name: "sl",
    description: "Silence Laboratories: Silent Network plugin for Eliza",
    providers: [],
    evaluators: [],
    services: [],
    actions: [signAction, keygenAction],
};

export default slPlugin;
