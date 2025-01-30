import { AuthModule, DkgAuthModule } from '../auth/authentication';
import { type KeygenResponse, type SignResponse, type OperationStatusResponse, type RegisterPasskeyResponse } from './types';
import { MetadataSetupOpts, KeygenSetupOpts, SignSetupOpts } from '../setupMessage';
import { ApiVersion, type ClientConfig, IWalletProviderServiceClient, QueryPath } from './walletProviderServiceClientInterface';
/**
 * The Websocket client to the Wallet Provider backend service.
 * All requests are relayed by this entity to the MPC network.
 * @alpha
 */
export declare class WalletProviderServiceClient implements IWalletProviderServiceClient {
    walletProviderId: string;
    walletProviderUrl: string;
    apiVersion: ApiVersion;
    /**
     * Create new client that connects to the backend service
     * @param config - config containing information about backend service
     */
    constructor(config: ClientConfig);
    getVersion(): ApiVersion;
    getWalletId(): string;
    startKeygen({ setups, authModule, }: {
        setups: KeygenSetupOpts[];
        authModule: DkgAuthModule;
    }): Promise<KeygenResponse[]>;
    startSigngen({ setup, authModule }: {
        setup: SignSetupOpts;
        authModule: AuthModule;
    }): Promise<SignResponse[]>;
    addEphemeralKey({ setup, authModule, }: {
        setup: MetadataSetupOpts;
        authModule: DkgAuthModule;
    }): Promise<OperationStatusResponse>;
    revokeEphemeralKey({ setup, authModule, }: {
        setup: MetadataSetupOpts;
        authModule: AuthModule;
    }): Promise<OperationStatusResponse>;
    registerPasskey({ setup, authModule, }: {
        setup: MetadataSetupOpts;
        authModule: AuthModule;
    }): Promise<RegisterPasskeyResponse>;
    connect(path: QueryPath, setupOpts: KeygenSetupOpts[] | SignSetupOpts | MetadataSetupOpts, authModule: AuthModule): Promise<string>;
    connectV2(path: QueryPath, setupOpts: KeygenSetupOpts[] | SignSetupOpts | MetadataSetupOpts, authModule: AuthModule): Promise<string>;
}
export declare const parseSigngenResult: (signResult: string, signAlg: string) => SignResponse[];
