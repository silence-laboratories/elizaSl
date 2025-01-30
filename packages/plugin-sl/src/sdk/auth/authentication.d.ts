import { MetadataSetupOpts, KeygenSetupOpts, SignSetupOpts } from '../setupMessage';
import { IBrowserWallet } from './EOAauthentication';
import { PasskeyUser, RelyingPartyConfig } from './passkeyAuthentication';
import { EphKeyClaim, SignAlgorithm } from './ephemeralAuthentication';
/** Type of the request authentication
 * @alpha
 */
export type UserCredentials = {
    id: string;
    method: 'eoa' | 'ephemeral' | 'passkey';
    credentials: string;
};
export type UserAuthentication = {
    credentials: UserCredentials;
    signature: string;
};
export interface AuthModule {
    authenticate({ setup, challenge, }: {
        setup: KeygenSetupOpts | SignSetupOpts | MetadataSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
export interface DkgAuthModule extends AuthModule {
    getEphClaims(): EphKeyClaim | Map<string, EphKeyClaim>;
}
/** The `EOAAuth` implementing Externally Owned Account authentication.
 * @alpha
 */
export declare class EOAAuth implements DkgAuthModule {
    /** An interface to the wallet, like MetaMask, that is used to sign the requests */
    private browserWallet;
    /** the ETH address that is used to do EOA authentication */
    private eoa;
    /** Ephemeral key claim populated for non batched requests*/
    ephClaim?: EphKeyClaim;
    /** Ephemeral key claims map contains pairs of
     * SignatureAlgorithms and their appropriate EphKeyClaims in case of batched requests */
    ephClaims?: Map<string, EphKeyClaim>;
    /**
     *
     * @param eoa - Ethereum address
     * @param browserWallet - Interface to the wallet provider, like MetaMask, that is used to sign the requests
     * @param ephClaimOptions - Either EphKeyClaim or Map of SignatureAlgorithms and their appropriate EphKeyClaims
     */
    constructor(eoa: string, browserWallet: IBrowserWallet, ephClaimOptions: {
        ephClaim?: EphKeyClaim;
        ephClaims?: Map<string, EphKeyClaim>;
    });
    private validateInputs;
    getEphClaims(): EphKeyClaim | Map<string, EphKeyClaim>;
    /**
     * Prepares a message to present on the Browser Wallet window and requests to sign it.
     * @param setup - Keygen setup options
     * @param challenge - the challenge received from the backend
     * @public
     */
    authenticate({ setup, challenge, }: {
        setup: KeygenSetupOpts | MetadataSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
/** The `EphAuth` module is only used for signing requests to the network.
 * @alpha
 * An Ephmeral key used to locally sign the signature requests to network.
 * This eph key is registered during keygen. The key is used to sign the requests without
 * asking the user to sign the request each time.
 * */
export declare class EphAuth implements AuthModule {
    /** Secret key of the ephemeral keypair */
    private ephSK;
    /** Ephemeral key claim */
    private ephClaim;
    /**
     *
     * @param ephId - Ephemeral key ID
     * @param ephSK - Ephemeral secret key
     * @param signAlg - Signature algorithm
     */
    constructor(ephId: string, ephSK: Uint8Array, signAlg: SignAlgorithm);
    /**
     * Prepares a message to present on the Browser Wallet window and requests to sign it.
     * @param setup - Signgen setup options
     * @param challenge - the challenge received from the backend
     *
     * @public
     */
    authenticate({ setup, challenge, }: {
        setup: SignSetupOpts | MetadataSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
/** The `AuthModule` implementing Passkey authentication.
 * @alpha
 */
export declare class PasskeyAuth implements DkgAuthModule {
    /** Replying party object. Read more: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#rp */
    private rpConfig;
    /** ID of the acceptable credential by user. App proves that user has passkey credential by passing the value of this field */
    private allowCredentialId;
    /** Ephemeral key claim populated for non batched requests*/
    ephClaim?: EphKeyClaim;
    /** Ephemeral key claims map contains pairs of
     * SignatureAlgorithms and their appropriate EphKeyClaims in case of batched requests */
    ephClaims?: Map<string, EphKeyClaim>;
    /**
     *
     * @param rpConfig - Passkey relying party configuration. Read more: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#rp
     * @param allowCredentialId - ID of the acceptable credential by user. App proves that user has passkey credential by passing the value of this field
     * @param ephClaimOptions - Either EphKeyClaim or Map of SignatureAlgorithms and their appropriate EphKeyClaims
     */
    constructor(rpConfig: RelyingPartyConfig, allowCredentialId: string, ephClaimOptions: {
        ephClaim?: EphKeyClaim;
        ephClaims?: Map<string, EphKeyClaim>;
    });
    private validateInputs;
    getEphClaims(): EphKeyClaim | Map<string, EphKeyClaim>;
    authenticate({ setup, challenge, }: {
        setup: KeygenSetupOpts | MetadataSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
/** The `AuthModule` implementing Passkey register.
 * @alpha
 */
export declare class PasskeyRegister implements AuthModule {
    /** Replying party object. Read more: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#rp */
    private rpConfig;
    /** Passkey user information, only requires while registering. Read more: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#user */
    private user;
    /**
     *
     * @param rpConfig - Passkey relying party configuration. Read more: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#rp
     * @param user - Passkey user information, only requires while registering. Read more: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions#user
     */
    constructor(rpConfig: RelyingPartyConfig, user: PasskeyUser);
    authenticate({ setup, challenge, }: {
        setup: MetadataSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
