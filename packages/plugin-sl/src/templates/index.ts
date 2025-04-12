
// signTemplate.js
export const signTemplate = `You are an AI assistant specialized in signing messages. Your task is to extract the message to sign from the user's input and validate it.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract and validate the following information:
1. message_to_sign: A string that represents the message to be signed.

Steps:
1. Identify the message to sign from the recent conversation. Quote the part of the message explicitly mentioning it.
2. Validate the message to ensure it is a non-empty string.
3. If the message is valid, provide a JSON response with the structure below. If the message is missing or invalid, prepare an appropriate error message.

Provide the output in the following JSON structure:

\`\`\`json
{
    "message_to_sign": string
}
\`\`\`
`;

// keygenTemplate.js
export const keygenTemplate = `You are an AI assistant specialized in generating cryptographic keys. Your task is to extract and validate the user's request to generate a key.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to:
1. Confirm the user's intent to generate a key.
2. Validate that no additional input is required.

If the intent to generate a key is clear, provide the JSON response below. If the request is ambiguous, prepare an appropriate error message.

Provide the output in the following JSON structure:

\`\`\`json
{
    "keygen": true
}
\`\`\`
`;


export const transactionTemplate = `Your task is to execute a transaction using the pre-authorized session info from sessionInfo.json.
The transaction will call the 'increment' function on the designated smart contract.
Provide the transaction hash in the following JSON format:

\`\`\` json
{
    "transaction_hash": string
}
\`\`\`
`
;

