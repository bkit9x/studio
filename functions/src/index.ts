
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Type definitions - should match your client-side types
interface Wallet {
  id: string;
  name: string;
  initialBalance: number;
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

interface Transaction {
  id: string;
  walletId: string;
  type: "income" | "expense";
  amount: number;
}


const updateWalletOnTransaction = async (
    change: functions.Change<functions.firestore.DocumentSnapshot> | null,
    snapshot: functions.firestore.DocumentSnapshot | null,
    context: functions.EventContext,
    operation: "create" | "delete" | "update",
) => {
  const {userId, transactionId} = context.params;

  let transactionData: Transaction;
  let oldTransactionData: Transaction | null = null;
  let walletId: string;
  let oldWalletId: string | null = null;

  switch (operation) {
    case "create":
      transactionData = snapshot!.data() as Transaction;
      walletId = transactionData.walletId;
      break;
    case "delete":
      transactionData = snapshot!.data() as Transaction;
      walletId = transactionData.walletId;
      break;
    case "update":
      oldTransactionData = change!.before.data() as Transaction;
      transactionData = change!.after.data() as Transaction;
      walletId = transactionData.walletId;
      oldWalletId = oldTransactionData.walletId;
      break;
    default:
      functions.logger.error("Invalid operation type");
      return;
  }

  functions.logger.log(`Processing transaction ${transactionId} for user ${userId}. Operation: ${operation}`);


  // Handle case where wallet is changed during an update
  if (operation === "update" && oldWalletId && oldWalletId !== walletId) {
    await updateWalletTotals(userId, oldWalletId, oldTransactionData, "delete");
    await updateWalletTotals(userId, walletId, transactionData, "create");
  } else {
    await updateWalletTotals(userId, walletId, transactionData, operation, oldTransactionData);
  }
};


const updateWalletTotals = async (
    userId: string,
    walletId: string,
    transaction: Transaction,
    operation: "create" | "delete" | "update",
    oldTransaction?: Transaction | null,
) => {
  const walletRef = db.collection("users").doc(userId).collection("wallets").doc(walletId);

  return db.runTransaction(async (t) => {
    const walletDoc = await t.get(walletRef);
    if (!walletDoc.exists) {
      functions.logger.error(`Wallet ${walletId} not found for user ${userId}.`);
      return;
    }

    const walletData = walletDoc.data() as Wallet;
    let {balance, totalIncome, totalExpense} = walletData;

    // Initialize if undefined
    balance = balance ?? walletData.initialBalance ?? 0;
    totalIncome = totalIncome ?? 0;
    totalExpense = totalExpense ?? 0;

    // First, revert the old transaction amounts if it's an update
    if (operation === "update" && oldTransaction) {
      if (oldTransaction.type === "income") {
        balance -= oldTransaction.amount;
        totalIncome -= oldTransaction.amount;
      } else {
        balance += oldTransaction.amount;
        totalExpense -= oldTransaction.amount;
      }
    }

    // Apply the new/current transaction amounts
    if (operation === "create" || operation === "update") {
      if (transaction.type === "income") {
        balance += transaction.amount;
        totalIncome += transaction.amount;
      } else { // expense
        balance -= transaction.amount;
        totalExpense += transaction.amount;
      }
    } else if (operation === "delete") {
      if (transaction.type === "income") {
        balance -= transaction.amount;
        totalIncome -= transaction.amount;
      } else { // expense
        balance += transaction.amount;
        totalExpense -= transaction.amount;
      }
    }
    
    functions.logger.log(`Updating wallet ${walletId}:`, {balance, totalIncome, totalExpense});
    t.update(walletRef, {balance, totalIncome, totalExpense});
  });
};


export const onTransactionCreated = functions.firestore
    .document("users/{userId}/transactions/{transactionId}")
    .onCreate(async (snapshot, context) => {
      return updateWalletOnTransaction(null, snapshot, context, "create");
    });

export const onTransactionDeleted = functions.firestore
    .document("users/{userId}/transactions/{transactionId}")
    .onDelete(async (snapshot, context) => {
      return updateWalletOnTransaction(null, snapshot, context, "delete");
    });

export const onTransactionUpdated = functions.firestore
    .document("users/{userId}/transactions/{transactionId}")
    .onUpdate(async (change, context) => {
      return updateWalletOnTransaction(change, null, context, "update");
    });
