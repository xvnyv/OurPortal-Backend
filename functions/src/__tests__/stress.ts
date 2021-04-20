import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const fs = require("fs").promises;
const util = require("util");
const exec = util.promisify(require("child_process").exec);
import { modules } from "./data/modules";
// import { users } from "../__tests__/data/users";
import { User } from "../autotrade/interfaces";
import {
  retrieveTrades,
  sendEmail,
  shuffleUsers,
  updateFirestore,
  useBlossom,
} from "../autoTrade/helper";

if (!admin.apps.length) {
  admin.initializeApp();
}
let db = admin.firestore();
// === remove for deployment
// db.settings({
//   host: "localhost:8080",
//   ssl: false,
// });
// ===

const setUpDb = async () => {
  let batch = db.batch();
  const modulesCol = db.collection("modulesTest");
  const usersCol = db.collection("usersTest");

  for (let m of modules) {
    const docRef = modulesCol.doc(m.courseCode);
    batch.set(docRef, { ...m });
  }
  await batch.commit();
  const { stderr, stdout } = await exec(
    "node src/__tests__/data/dataGeneration/generateUsers.js"
  );
  console.log(stdout);
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  const data = await fs.readFile(
    "src/__tests__/data/dataGeneration/randomUsers.json"
  );
  let committed;
  const users = JSON.parse(data);
  for (let i = 0; i < users.length; i++) {
    if (i % 500 === 0) {
      batch = db.batch();
      committed = false;
    }
    const u = users[i];
    const docRef = usersCol.doc(u.uid);
    batch.set(docRef, { ...u });
    if (i % 500 === 499) {
      await batch.commit();
      committed = true;
    }
  }
  if (!committed) await batch.commit();
};

const writeToFile = (data: String) => {
  fs.writeFile("./src/__tests__/data/dataGeneration/results.json", data);
};

export const autoTradeStress = functions
  .runWith({ memory: "256MB", timeoutSeconds: 540 })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    await setUpDb();
    const userDb = db.collection("usersTest");
    const users: User[] = await retrieveTrades(userDb);
    // shuffle to introduce randomness for when there is more than one possible pair with equal weightage
    shuffleUsers(users);

    // create graph and execute algorithm
    const start = Date.now();
    const swaps: User[][] = useBlossom(users);
    const end = Date.now();
    const timeTaken = (end - start) / 1000;
    console.log("Time taken: " + timeTaken + "s");
    await updateFirestore(swaps, userDb);
    await sendEmail(req, res, swaps, users);
    writeToFile(JSON.stringify(swaps));

    res.json("done");
  });
