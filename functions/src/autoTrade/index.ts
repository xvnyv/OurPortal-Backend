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

export const autoTrade = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const userDb = admin.firestore().collection("users");
    const users: User[] = await retrieveTrades(userDb);
    // shuffle to introduce randomness for when there is more than one possible pair with equal weightage
    shuffleUsers(users);

    // create graph and execute algorithm
    const swaps: User[][] = useBlossom(users);
    console.log(swaps);
    await updateFirestore(swaps, userDb);
    await sendEmail(req, res, swaps, users);

    res.json("done");
  }
);
