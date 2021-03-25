import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { User, ModuleUserMap } from "./interfaces";
import {
  retrieveTrades,
  retrieveModules,
  initialiseArrays,
  populateArrays,
  shuffleUsers,
  executeAlgorithm,
  updateFirestore,
  sendEmail,
} from "./helper";

export const autoTrade = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const userDb = admin.firestore().collection("users");
    const moduleDb = admin.firestore().collection("modules");
    const users: User[] = await retrieveTrades(userDb);
    const modules: string[] = await retrieveModules(moduleDb);

    const current: ModuleUserMap = {};
    const swaps: User[][] = [];

    initialiseArrays(current, modules);
    populateArrays(current, users);
    shuffleUsers(users);

    executeAlgorithm(users, current, swaps);

    await updateFirestore(swaps, userDb);
    await sendEmail(req, res, swaps, users);
    res.json("done");
  }
);
