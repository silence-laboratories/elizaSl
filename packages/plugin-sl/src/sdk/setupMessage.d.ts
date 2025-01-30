import { EphKeyClaim } from './auth/ephemeralAuthentication';
export declare const TAG_EPH_KEY = 2;
export declare const TAG_KEY_ID = 3;
export declare class KeygenSetupOpts {
    /** Threshold, number of parties that needs to participate in a protocol in order to produce valid signature */
    t: number;
    /** Total number of nodes that participate in Key generation, must be greater or equal than `t` */
    n: number;
    /** Optional key label */
    key_label?: string;
    /** Metadata for a key. Currently they store the permissions, can be set in a constructor of this class.
        If permissions are not set, all operations are allowed.
       */
    private metadata;
    /** Signature algorithm chosen for key generation */
    signAlg: string;
    constructor({ t, n, key_label, permissions, signAlg, }: {
        t: number;
        n: number;
        key_label: string | undefined;
        permissions: string | undefined;
        signAlg: string;
    });
    set ephClaim(ephClaim: EphKeyClaim);
    get requestSchema(): {
        Request: {
            name: string;
            type: string;
        }[];
        KeygenSetupOpts: {
            name: string;
            type: string;
        }[];
        TaggedValue: {
            name: string;
            type: string;
        }[];
    };
}
export declare class SignSetupOpts {
    /** Number of nodes that will participate in the signature execution */
    t: number;
    /** Select the key using it's ID */
    key_id: string;
    /** The message to sign */
    message: string;
    /** Select which signature algorithm to use */
    signAlg: string;
    constructor({ t, key_id, signAlg, message }: {
        t: number;
        key_id: string;
        message: string;
        signAlg: string;
    });
}
export declare class MetadataSetupOpts {
    /** Metadata for a keyshare if in used by adding eph key. Otherwise, it provides metadata for the authentication setup.*/
    private metadata;
    constructor();
    set ephClaim(ephClaim: EphKeyClaim);
    set keyId(keyId: string);
    extractMetadataByTag(tag: number): string;
    get requestSchema(): {
        Request: {
            name: string;
            type: string;
        }[];
        MetadataSetupOpts: {
            name: string;
            type: string;
        }[];
        TaggedValue: {
            name: string;
            type: string;
        }[];
    };
}
