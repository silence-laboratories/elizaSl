import { UserAuthentication } from './authentication';
import { MetadataSetupOpts, SignSetupOpts } from '../setupMessage';
/**
 * Supported signature algorithms for ephemeral key
 * @alpha
 */
export type SignAlgorithm = 'ed25519' | 'secp256k1';
/** The `EphKeyClaim` object represents the public claim of the ephemeral key.
 * @alpha
 */
export declare class EphKeyClaim {
    ephId: string;
    ephPK: string;
    signAlg: SignAlgorithm;
    expiry: number;
    /**
     *
     * @param ephId - Ephemeral key ID
     * @param ephPK - Ephemeral public key
     * @param signAlg - Signature algorithm.
     * @param lifetime - Lifetime of the ephemeral key. Default is 1 hour
     */
    constructor(ephId: string, ephPK: Uint8Array, signAlg: SignAlgorithm, lifetime?: number);
    private validateInputs;
    toJSON(): string;
}
/** Locally sign the signature requests to network without asking the user, the ephSK is registered during keygen.
 * The signature is the authorization for signgen operation
 */
export declare function authenticateUsingEphKey({ setup, challenge, ephSK, ephClaim, }: {
    setup: SignSetupOpts | MetadataSetupOpts;
    challenge: string;
    ephSK: Uint8Array;
    ephClaim: EphKeyClaim;
}): Promise<UserAuthentication>;
export declare function genHexSignature(msg: Uint8Array, ephSK: Uint8Array, signAlg: SignAlgorithm): Promise<string>;
/** Generate Ephemeral `privateKey`
 * @public
 */
export declare function generateEphPrivateKey(algSign: SignAlgorithm): Uint8Array;
/** Derive Ephemeral `publicKey` from `privateKey` returned from `generateEphPrivateKey`
 * @public
 */
export declare function getEphPublicKey(ephSK: Uint8Array, algSign: SignAlgorithm): Uint8Array;
