import { UserAuthentication } from './authentication';
import { EphKeyClaim } from './ephemeralAuthentication';
/** Information about the user currently registering. Read more: https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-user
 * @alpha
 * */
export type PasskeyUser = {
    id: string;
    name: string;
    displayName: string;
};
/** The RP responsible for registering and authenticating the user. Read more: https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-rp
 * @alpha
 * */
export type RelyingPartyConfig = {
    rpName: string;
    rpId: string;
};
export declare function passkeyRegister({ user, challenge, rpConfig, }: {
    user: PasskeyUser;
    challenge: string;
    rpConfig: RelyingPartyConfig;
}): Promise<UserAuthentication>;
export declare function passkeyLogin({ challenge, allowCredentialId, rpConfig, ephClaim, }: {
    challenge: string;
    allowCredentialId: string | null;
    rpConfig: RelyingPartyConfig;
    ephClaim: EphKeyClaim;
}): Promise<UserAuthentication>;
