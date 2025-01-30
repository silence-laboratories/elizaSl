import { SignAlgorithm } from '../auth/ephemeralAuthentication';
export declare const throwIfInvalidString: (key: string, value: string) => void;
export declare const throwIfInvalidEphPK: (ephKey: Uint8Array, signAlg: SignAlgorithm) => void;
export declare const throwIfInvalidEphSK: (ephKey: Uint8Array, signAlg: SignAlgorithm) => void;
export declare const throwIfInvalidSignAlg: (signAlg: SignAlgorithm) => void;
export declare const throwIf: (condition: boolean, message: string) => void;
