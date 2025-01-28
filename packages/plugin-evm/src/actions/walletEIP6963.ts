// Provides an interface to wallets that are discoverable via EIP-6963,
// like MetaMask, or Brave Wallet

import type { IBrowserWallet, TypedData } from '@silencelaboratories/walletprovider-sdk';
import { canonicalize } from 'json-canonicalize';

// Interfaces from EIP-6963 specification
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;

  request: (request: RequestArguments) => Promise<unknown>;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

// Announce Event dispatched by a Wallet
interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

// List of discovered browser wallets
export const discoveredBrowserWallets: Map<string, EIP6963ProviderDetail> = new Map();
export let selectedBrowserWalletId: string = '';

// Browser wallet currently in use
let selectedBrowserWallet: EIP1193Provider | null = null;
export let accountsFromBrowserWallet: Array<string>;

// Sets up an event listener, that gets triggered upon Wallet announcement
export const detectBrowserWallets = () => {
  console.log('Waiting for wallets to announce');
  window.addEventListener('eip6963:announceProvider', (e) => {
    const event = e as EIP6963AnnounceProviderEvent;
    console.log('Wallet announced:', event.detail.info.name);
    storeDiscoveredWallet(event.detail);
  });

  window.dispatchEvent(new Event('eip6963:requestProvider'));
};

// Store the wallet provider info into a list
const storeDiscoveredWallet = async (providerDetail: EIP6963ProviderDetail) => {
  if (selectedBrowserWalletId === '') {
    selectedBrowserWalletId = providerDetail.info.name;
    setActiveBrowserWallet(providerDetail);
  }

  discoveredBrowserWallets.set(providerDetail.info.name, providerDetail);
};

// Set current browser wallet as active - all following operations shall refer to it.
export function setActiveBrowserWallet(wallet: EIP6963ProviderDetail) {
  console.log('Setting up browser wallet as active', wallet.info.name);
  // For now we don't use any listeners, but for the future:
  // close current provider - remove listeners
  selectedBrowserWallet = wallet.provider;
  accountsFromBrowserWallet = [];
  // initialize new provider - add listeners
}

// Sends a request to fetch the accounts. Upon first call,
// the Wallet UI will pop up asking user to grant permission.
// After that session between website and a Wallet is established.
// That session can be revoked from Wallet UI.
// If session is already established no UI popup happens,
// the accounts are returned immediately
export async function connectToBrowserWallet() {
    const { ethereum } = window as any;

    if (!ethereum) {
      throw new Error('No browser wallet (like Metamask) detected');
    }

    // Request user accounts (triggers popup if not already connected)
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. User likely rejected connection.');
    }

    return { ethereum, accounts };
  }

// Sign data using the secret key stored on Browser Wallet
// It creates a popup window, presenting the human readable form of `request`
// Throws an error if User rejected signature
export class BrowserWallet implements IBrowserWallet {
  async signTypedData<T>(from: string, request: TypedData<T>): Promise<unknown> {
    return await selectedBrowserWallet!.request({
      method: 'eth_signTypedData_v4',
      params: [from, canonicalize(request)],
    });
  }
}
