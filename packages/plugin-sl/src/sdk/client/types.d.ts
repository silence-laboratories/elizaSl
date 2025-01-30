/**
 * Response from the network for keygen requests
 * @alpha
 */
export interface KeygenResponse {
    /**
     * Unique ID of produced key used in subsequent API calls.
     */
    keyId: string;
    /**
     * Public key encoded with SEC1 format.
     *
     * If point is uncompressed it's in a form of 0x04 || X || Y
     *
     * If point is compressed it's in a form Y || X,
     *
     * where Y is set to 0x02 if Y-coord is even, or 0x03 if Y-coord is odd
     */
    publicKey: string;
    /**
     * Signature algorithm that uses this key for signing
     */
    signAlg: string;
}
/**
 * Response from the network for sign request
 * @alpha
 */
export interface SignResponse {
    transactionId: string;
    /**
     * Hexstring of length 128 bytes, in a form: r || s
     */
    sign: string;
    /**
     * Recovery id, either 0, or 1
     */
    recid: number;
}
/**
 * Response from the network for adding ephemeral key request
 * @alpha
 */
export interface OperationStatusResponse {
    /**
     * Status of the request.
     */
    status: string;
}
/**
 * Response from the network for registering passkey request
 * @alpha
 */
export interface RegisterPasskeyResponse {
    /**
     * The registered passkey credential id. This helps both the user and the network to identify the passkey.
     * @alpha
     */
    passkeyCredentialId: string;
}
