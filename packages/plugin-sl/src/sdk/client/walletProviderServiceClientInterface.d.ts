import { AuthModule, UserAuthentication } from '../auth/authentication';
import { KeygenResponse, SignResponse, OperationStatusResponse, RegisterPasskeyResponse } from './types';
import { MetadataSetupOpts, KeygenSetupOpts, SignSetupOpts } from '../setupMessage';
/**
 * The config used to create Wallet Provider Service backend client.
 * Please refer to {@link https://shipyard.rs/silencelaboratories/crates/wallet-provider-service | example backend service}
 * implementation for requirements that the backend service must fulfill.
 * @alpha
 */
export type ClientConfig = {
    /**
     * The version of the API used to connect to the service
     */
    apiVersion: ApiVersion;
    /**
     * The id of the Wallet Provider Service
     * @alpha
     */
    walletProviderId: string;
    /**
     * The URL used to connect to the service
     * @alpha
     */
    walletProviderUrl: string;
};
/**
 * The API version of the Wallet Provider Service
 * @public
 */
export type ApiVersion = 'v1' | 'v2';
export type Signer = (challenge: string) => Promise<UserAuthentication>;
/** Interface for client of  Wallet Provider Service
 * @alpha
 */
export interface IWalletProviderServiceClient {
    getWalletId(): string;
    getVersion(): ApiVersion;
    startKeygen({ setups, authModule }: {
        setups: KeygenSetupOpts[];
        authModule: AuthModule;
    }): Promise<KeygenResponse[]>;
    startSigngen({ setup, authModule }: {
        setup: SignSetupOpts;
        authModule: AuthModule;
    }): Promise<SignResponse[]>;
    addEphemeralKey({ setup, authModule, }: {
        setup: MetadataSetupOpts;
        authModule: AuthModule;
    }): Promise<OperationStatusResponse>;
    revokeEphemeralKey({ setup, authModule, }: {
        setup: MetadataSetupOpts;
        authModule: AuthModule;
    }): Promise<OperationStatusResponse>;
    registerPasskey({ setup, authModule, }: {
        setup: MetadataSetupOpts;
        authModule: AuthModule;
    }): Promise<RegisterPasskeyResponse>;
}
export type QueryPath = 'signgen' | 'keygen' | 'addEphemeralKey' | 'revokeEphemeralKey' | 'registerPasskey';
