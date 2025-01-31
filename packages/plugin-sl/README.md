# @elizaos/plugin-sl

## Description
This Eliza OS plugin by Silence Laboratories enables seamless interaction with the MPC TSS network - "Silent Network", allowing delegated distributed key management for AI agents.


## Features

- **Distributed Key Generation**: Uses WalletProviderServiceClient for distributed key generation.
- **Ephemeral Key Handling**: Generates and manages ephemeral keys for secure signing.
- **Distributed Signature Generation**: Generated a distributed signature of the message provided by the user / agent.
- **Integration with Eliza OS**: Works as an Eliza OS action, enabling automated workflows.


### Required Environment Variables
API key for the GenAI model to be used for the plugin. View the .env.example file for more information.

```env
# Example
# Required
OPENAI_API_KEY=                 # OpenAI API key, starting with sk-
```
**Note**: Make sure to change the model provider settings in the character file (./characters/dobby.character.json) accordingly.

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
**Note: Use nvm 23.3.0 to install the dependencies.**

3. Build the plugin:

```bash
pnpm run build
```

4. Run the plugin:

```bash
pnpm start --character="characters/dobby.character.json"
```


## Demo flow

View the demo flow in the video below:

[Video here](https://drive.google.com/file/d/1hAr2J3aYJjXe3XE8x1Y4DD6jWC0t9eZ5/view?usp=sharing)

In the video, we use the [this repository](https://github.com/silence-laboratories/TxElizaExample.git) to create the unsigned transaction and broadcast it to the chain in a simple cli interface.

A representative flow is shown below:
![alt text](<demo flow 1.png>)

*Post this, the user adds funds to Eliza's distributed wallet*

![alt text](<demo flow 2.png>)

