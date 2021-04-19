import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const axios = require("axios");

var blossom = require("edmonds-blossom");

import { User } from "./interfaces";

/* Query User collection on Firestore and retrieves only users who:
  1. have already enrolled in a HASS module  
  2. have selected modules for autotrade

Returns an array of users with User interface */

const retrieveTrades = async (
  db: FirebaseFirestore.CollectionReference
): Promise<any[]> => {
  const usersSnapshot = await db.where("autoTradeModules", "!=", null).get();
  const users: any[] = [];
  usersSnapshot.forEach((u) => {
    const data = u.data();
    const curHASSModule = data.modules.find((m: any) => m.slice(0, 2) === "02");
    const autoTradeModules = data.autoTradeModules;
    if (autoTradeModules && autoTradeModules.length && curHASSModule) {
      users.push({
        curHASSModule,
        autoTradeModules,
        id: data.uid,
        allModules: data.modules,
        email: data.email,
      });
    }
  });
  return users;
};

/* Randomly shuffles an array of User objects */

const shuffleUsers = (users: User[]) => {
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [users[i], users[j]] = [users[j], users[i]];
  }
};

const updateFirestore = async (
  swaps: User[][],
  db: FirebaseFirestore.CollectionReference
) => {
  let batch = admin.firestore().batch();
  let committed = false;
  for (let i = 0; i < swaps.length; i++) {
    if (i !== 0 && i % 250 === 0) {
      batch = admin.firestore().batch();
      committed = false;
    }
    const swap = swaps[i];
    const docRef1 = db.doc(swap[0].id);
    const docRef2 = db.doc(swap[1].id);
    batch.update(docRef1, {
      modules: swap[0].allModules.map((m) =>
        m === swap[0].curHASSModule ? swap[1].curHASSModule : m
      ),
    });
    batch.update(docRef2, {
      modules: swap[1].allModules.map((m) =>
        m === swap[1].curHASSModule ? swap[0].curHASSModule : m
      ),
    });
    if (i % 250 === 249) {
      await batch.commit();
      committed = true;
    }
  }
  if (!committed) await batch.commit();
};

const sendEmail = async (
  req: functions.Request,
  res: functions.Response,
  swaps: User[][],
  users: User[]
) => {
  const flattenedSwaps: any = swaps.reduce(
    (accumulator: any, currentValue: User[]) => {
      accumulator[currentValue[0].id] = currentValue[1].curHASSModule;
      accumulator[currentValue[1].id] = currentValue[0].curHASSModule;
      return accumulator;
    },
    {}
  );

  const sortedUsers: any = [];
  for (let u of users) {
    let message;
    if (flattenedSwaps.hasOwnProperty(u.id)) {
      message = `Congratulations! The HASS module that you were previously enrolled in, ${
        u.curHASSModule
      }, has now been swapped for the module ${
        flattenedSwaps[u.id]
      }. You can log on to OurPortal via the link https://our-portal-c30lx5sjw-shohamc1.vercel.app to view all modules that you have enrolled in.`;
      sortedUsers.push({ email: u.email, message, id: u.id });
    } else {
      message = `It appears that our automatic trading system was unable to find any suitable trades for your current HASS module ${u.curHASSModule}. Better luck next time!`;
      sortedUsers.push({ email: u.email, message, id: u.id });
    }
  }

  await axios.post(
    "http://localhost:5001/ourportal-e0a9c/us-central1/sendTradeResults",
    { data: JSON.stringify(sortedUsers) }
  );
};

const useBlossom = (users: User[]) => {
  const graph = [];
  let count = 0;

  for (let i = 0; i < users.length; i++) {
    let u = users[i];

    for (let j = i + 1; j < users.length; j++) {
      let u2 = users[j];
      const uWantsu2 = u.autoTradeModules.find(
        (m) => m.courseCode == u2.curHASSModule
      );
      const u2WantsU = u2.autoTradeModules.find(
        (m) => m.courseCode == u.curHASSModule
      );
      if (uWantsu2 && u2WantsU) {
        const totalWeightage = uWantsu2.weightage + u2WantsU.weightage;
        graph.push([i, j, totalWeightage == 0 ? 0.1 : totalWeightage]);
        count++;
      }
    }
  }

  console.log("Possible trades: " + count);

  // console.log("GRAPH STARTS");
  // graph.forEach((e) => {
  //   console.log(e);
  // });
  // console.log("GRAPH ENDS");

  const trades = [];
  const completed = new Array(users.length);
  const optimisedResults = blossom(graph);
  // console.log(optimisedResults);

  for (let i = 0; i < completed.length; i++) {
    completed[i] = false;
  }

  for (let i = 0; i < optimisedResults.length; i++) {
    if (
      optimisedResults[i] != -1 &&
      !completed[i] &&
      !completed[optimisedResults[i]]
    ) {
      const u1 = users[i];
      const u2 = users[optimisedResults[i]];

      completed[i] = true;
      completed[optimisedResults[i]] = true;

      trades.push([u1, u2]);
    }
  }

  console.log("Successful trades: " + trades.length);
  console.log("\nFulfilled requests: " + trades.length * 2);
  return trades;
};

export { retrieveTrades, shuffleUsers, updateFirestore, sendEmail, useBlossom };
