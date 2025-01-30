import { LocalAccount } from 'viem/accounts';
import { NetworkSigner } from './client/networkSigner';
import { Address } from 'viem';
/**
 * Create a new viem custom account for signing transactions using
 * the MPC network.
 * @param networkSigner API to communicate with the Silent MPC Network.
 * @param keyId The selected Key ID.
 * @param publicKey Associated public key of the selected Key ID.
 * @param signAlg The signature algorithm for signing (default: secp256k1).
 */
export declare function createViemAccount(networkSigner: NetworkSigner, keyId: string, publicKey: string, signAlg?: string): LocalAccount;
/** Computes ETH address from ECDSA `publicKey` returned by Silent Network
 * @public
 */
export declare function computeAddress(publicKey: string): Address;
