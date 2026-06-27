import {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} from "@stellar/stellar-sdk";

export const NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_GOALLOCK_CONTRACT_ID ??
  "CDMOCK7GOALLOCKDEMO2YQ6XLMSTELLARTESTNET2026HACK";
export const IS_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_GOALLOCK_CONTRACT_ID);

export type GoalContractCall =
  | { method: "create_goal"; title: string; target: string; unlockAt: number }
  | { method: "deposit"; goalId: number; amount: string }
  | { method: "withdraw"; goalId: number };

/**
 * Builds, simulates, signs, and submits a GoalLock Soroban invocation. Any error
 * is intentionally allowed to bubble so the UI can switch to its demo fallback.
 */
export async function submitGoalCall(call: GoalContractCall, publicKey: string) {
  if (!IS_CONFIGURED) throw new Error("GoalLock contract ID is not configured");

  const { signTransaction } = await import("@stellar/freighter-api");
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(publicKey);
  const contract = new Contract(CONTRACT_ID);
  const owner = new Address(publicKey).toScVal();

  const operation =
    call.method === "create_goal"
      ? contract.call(
          "create_goal",
          owner,
          nativeToScVal(call.title, { type: "string" }),
          nativeToScVal(BigInt(Math.round(Number(call.target) * 10_000_000)), {
            type: "i128",
          }),
          nativeToScVal(BigInt(call.unlockAt), { type: "u64" }),
        )
      : call.method === "deposit"
        ? contract.call(
            "deposit",
            owner,
            nativeToScVal(call.goalId, { type: "u64" }),
            nativeToScVal(BigInt(Math.round(Number(call.amount) * 10_000_000)), {
              type: "i128",
            }),
          )
        : contract.call(
            "withdraw",
            owner,
            nativeToScVal(call.goalId, { type: "u64" }),
          );

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(90)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation.error);
  }

  const prepared = rpc.assembleTransaction(transaction, simulation).build();
  const signed = await signTransaction(prepared.toXDR(), {
    address: publicKey,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message ?? "Transaction signature was rejected");
  }

  const result = await server.sendTransaction(
    TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE),
  );
  if (result.status === "ERROR") throw new Error("Soroban RPC rejected the transaction");
  return result.hash;
}

export function mockHash() {
  const bytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0"),
  );
  return bytes.join("");
}
