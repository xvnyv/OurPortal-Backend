import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { User } from "./interfaces";
import {
  retrieveTrades,
  sendEmail,
  shuffleUsers,
  updateFirestore,
  useBlossom,
} from "./helper";

if (!admin.apps.length) {
  admin.initializeApp();
}
let db = admin.firestore();

export const autoTrade = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const userDb = db.collection("usersTest");
    const users: User[] = await retrieveTrades(userDb);
    // shuffle to introduce randomness for when there is more than one possible pair with equal weightage
    shuffleUsers(users);

    // create graph and execute algorithm
    const start = Date.now();
    const swaps: User[][] = useBlossom(users);
    const end = Date.now();
    const timeTaken = (end-start) / 1000;
    console.log("Time taken: " + timeTaken + "s");
    await updateFirestore(swaps, userDb);
    await sendEmail(req, res, swaps, users);

    res.json("done");
  }
);
