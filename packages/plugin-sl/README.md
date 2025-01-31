# @elizaos/plugin-sl

This Eliza OS plugin enables seamless interaction with Silence Labs' Wallet Provider SDK, allowing key generation, signing, and transaction management. The plugin uses MockWallet instead of MetaMask and integrates with the Eliza OS framework.


## Features
- generate random private key.
- Key Generation: Uses WalletProviderServiceClient for distributed key generation.
- MockWallet Support: Mimics an EOA for authentication without requiring MetaMask.
- Ephemeral Key Handling: Generates and manages ephemeral keys for secure signing.
- Integration with Eliza OS: Works as an Eliza OS action, enabling automated workflows.



## Configuration

### Required Environment Variables

```env
# Required

note: Use any AI Api key

```

### Architecture and Interaction Flow
The following sequence diagram illustrates the interaction between Eliza OS, Silence Labs SDK, Eliza OS Plugin, and Silence Labs Backend.

![alt text](image.png)


## Actions

### 1. Keygen

Generate mpc keys:

```typescript
// Example: Generate a new keypair
start Keygen
```

### 2. sign

Sign a unsigned transaction using the mpc key:
```typescript
// Example: Sign a transaction
sign 0x1234567890abcdef
```

## Development

1. Clone the repository
```bash
git clone https://github.com/silence-laboratories/elizaSl/tree/feat/final

```
2. Install dependencies:

```bash
pnpm install
```

3. Build the plugin:

```bash
pnpm run build
```

4. Run the plugin:

```bash
pnpm start --character="characters/dobby.character.json"
```
