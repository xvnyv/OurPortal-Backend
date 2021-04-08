import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const fs = require("fs");
import { modules } from "../__tests__/data/modules";
import { users } from "../__tests__/data/users";

import { User } from "./interfaces";
import {
  retrieveTrades,
  // sendEmail,
  shuffleUsers,
  // updateFirestore,
  useBlossom,
} from "./helper";

if (!admin.apps.length) {
  admin.initializeApp();
}
// === remove for deployment
let db = admin.firestore();
db.settings({
  host: "localhost:8080",
  ssl: false,
});
// ===

const setUpDb = async () => {
  const batch = db.batch();
  const modulesCol = db.collection("modulesTest");
  const usersCol = db.collection("usersTest");

  for (let m of modules) {
    const docRef = modulesCol.doc(m.courseCode);
    batch.set(docRef, { ...m });
  }

  for (let u of users) {
    const docRef = usersCol.doc(u.uid);
    batch.set(docRef, { ...u });
  }

  await batch.commit();
};
// === remove for deployment
const writeToFile = (data: String) => {
  fs.writeFileSync("./src/__tests__/data/dataGeneration/results.json", data);
};
// ===

export const autoTrade = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    await setUpDb();
    const userDb = db.collection("usersTest");
    const users: User[] = await retrieveTrades(userDb);
    // shuffle to introduce randomness for when there is more than one possible pair with equal weightage
    shuffleUsers(users);

    // create graph and execute algorithm
    const swaps: User[][] = useBlossom(users);
    // console.log(swaps);
    // await updateFirestore(swaps, userDb);
    console.log("sending email");
    // await sendEmail(req, res, swaps, users);
    writeToFile(JSON.stringify(swaps));

    res.json("done");
  }
);
