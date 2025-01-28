import { type ClientConfig, type RelyingPartyConfig } from '@silencelaboratories/walletprovider-sdk';

export type Config = {
  walletProvider: ClientConfig;
  rpConfig: RelyingPartyConfig;
};

export const GetConfig = (): Config => {
  const walletProviderId = "WalletProvider"
  const walletProviderUrl ="ws://localhost:8090"
  const rpId ="localhost"
  const rpName ="http://localhost:5173"
  const apiVersion ="v2"

  if (!walletProviderId) {
    throw new Error('Missing environment variable: VITE_ASSETS_WALLET_PROVIDER_ID');
  }
  if (!walletProviderUrl) {
    throw new Error('Missing environment variable: VITE_WALLET_PROVIDER_URL');
  }

  return {
    walletProvider: {
      walletProviderId,
      walletProviderUrl,
      apiVersion,
    },
    rpConfig: {
      rpId,
      rpName,
    },
  };
};
