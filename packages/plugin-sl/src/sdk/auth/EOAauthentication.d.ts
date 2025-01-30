/** Externally Owned Account (EOA) atuhentication. Uses secret key stored on a wallet to sign requests.
 * The requests are presented to the user in a readable form by using TypedData (EIP712).
 */
import { MetadataSetupOpts, KeygenSetupOpts } from '../setupMessage';
import { type UserAuthentication } from './authentication';
import { type TypedDataDomain } from 'viem';
import { EphKeyClaim } from './ephemeralAuthentication';
export type FieldDefinition = {
    name: string;
    type: string;
};
/** EIP-712 Typed data struct definition.
 * @alpha
 * */
export type TypedData<T> = {
    /** contains the schema definition of the types that are in `msg` */
    types: Record<string, Array<FieldDefinition>>;
    /** is the signature domain separator */
    domain: TypedDataDomain;
    /** points to the type from `types`. It's the root object of `message` */
    primaryType: string;
    /** the request that User is asked to sign */
    message: T;
};
/**
 * Interface to implement communication between this library, and a Browser Wallet. In order to
 * request the signature from the User.
 * @alpha
 */
export interface IBrowserWallet {
    /** Sign data using the secret key stored on Browser Wallet
     * It creates a popup window, presenting the human readable form of `request`
     * @param from - the address used to sign the request
     * @param request - the request to sign by the User in the form of EIP712 typed data.
     * @throws Throws an error if User rejected signature
     * @example The example implementation:
     * ```ts
     * async signTypedData<T>(from: string, request: TypedData<T>): Promise<unknown> {
     *   return await browserWallet.request({
     *     method: 'eth_signTypedData_v4',
     *     params: [from, JSON.stringify(request)],
     *   });
     * }
     * ```
     */
    signTypedData<T>(from: string, request: TypedData<T>): Promise<unknown>;
}
type RequestToSign<T> = {
    setup: T;
    challenge: string;
};
export declare const EIP712SilentShardAuthenticationDomain: {
    name: string;
    version: string;
};
export declare function createTypedRequest(setup: KeygenSetupOpts | MetadataSetupOpts, aggregated_challenge: string, ephClaim: EphKeyClaim): TypedData<RequestToSign<KeygenSetupOpts | MetadataSetupOpts>>;
/** Present the request to the User using wallet UI, and ask for sign.
 * The signature is the authorization for keygen operation
 */
export declare function authenticateUsingEOA({ setup, eoa, challenge, browserWallet, ephClaim, }: {
    setup: KeygenSetupOpts | MetadataSetupOpts;
    eoa: string;
    challenge: string;
    browserWallet: IBrowserWallet;
    ephClaim: EphKeyClaim;
}): Promise<UserAuthentication>;
export {};
