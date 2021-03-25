import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
var cors = require("cors")({ origin: true });

import { User, ModuleUserMap } from "./interfaces";
import { getTransporter } from "../helper";

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

/* Query Modules collection on Firestore and retrieve all HASS modules.
  
  Returns array of module course codes. */

const retrieveModules = async (
  db: FirebaseFirestore.CollectionReference
): Promise<any[]> => {
  const modulesSnapshot = await db.where("type", "==", "HASS").get();
  const modules: any[] = [];
  modulesSnapshot.forEach((m) => {
    const data = m.data();
    modules.push(data.courseCode);
  });
  return modules;
};

/* Modifies current such that current will contain all HASS course codes as keys and empty arrays as values.
  
  Does not return anything as current is modified directly through argument. */

const initialiseArrays = (current: ModuleUserMap, modules: string[]) => {
  for (let m of modules as any) {
    current[m] = [];
  }
};

/* Populates current such that current["course1"] contains 
  an array of all users currently enrolled in module with course code "course1" */

const populateArrays = (current: ModuleUserMap, users: User[]) => {
  for (let u of users) {
    if (u.curHASSModule) current[u.curHASSModule].push(u);
  }
};

/* Randomly shuffles an array of User objects */

const shuffleUsers = (users: User[]) => {
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [users[i], users[j]] = [users[j], users[i]];
  }
};

/* Executes trading algorithm 
  
  Algorithm works by:
  1. Looping through the randomly shuffled array of users (u1)
    2. If u1 has not traded yet, loop through all 1-3 modules that user has selected for autotrade
      3. Loop through all users who are currently enrolled in the current selected module (u2)
      4. Check if u2 has selected u1's current HASS module for autotrading
      5a. Yes: if u2 has not already traded, add u2 as a potential swap
      5b. No: skip and carry on 
    6. Once all swaps for u1 have been found, check that chosen swap has not traded yet 
    7. If already traded, move on to next potential swap 
    8a. If no more potential swaps remaining, u1 cannot trade
    8b. Else, u1 has a swap saved in the swaps array
    
    Output swap array contains swaps represented as arrays containing 2 User objects */

const executeAlgorithm = (
  users: User[],
  current: ModuleUserMap,
  swaps: User[][]
) => {
  // make a copy of users so that we can modify the original array while looping through all users
  const tempUsers = [...users];

  // loop through all users
  for (let i = 0; i < users.length; i++) {
    const u = users[i];

    // check if user has already traded but has not been removed from list of users
    // skip this iteration if user has already traded
    if (!tempUsers.includes(u)) {
      // console.log(`${u.id} has already traded.\n`);
      continue;
    }

    // sort current user's desired modules according to weightage
    u.autoTradeModules = u.autoTradeModules.sort((a: any, b: any) => {
      return b.weightage - a.weightage;
    });

    // record all potential swaps
    let potentialSwaps: User[] = [];

    // iterate through all desired modules of current user
    for (let m of u.autoTradeModules) {
      // iterate through all users who currently have these desired modules
      for (let j = 0; j < current[m.courseCode].length; j++) {
        const u2 = current[m.courseCode][j];

        // current array is intentionally not updated when users are identified for trades to save on computation time
        // check whether potential swapee is already involved in a trade

        // potential swapee has already traded -- remove user from current array
        if (!tempUsers.includes(u2)) {
          current[m.courseCode].splice(j, 1);
        }
        // potential swapee can still trade
        else if (u2 !== u) {
          // check whether potential swapee also wants current user's module
          const swappableModule = u2.autoTradeModules.find(
            (m2: any) => m2.courseCode == u.curHASSModule
          );
          // both parties want each others' modules -- add potentialSwapee to potentialSwaps array
          if (swappableModule) potentialSwaps.push(u2);
        }
      }
    }

    // check to make sure the chosen user(s) in potentialSwaps have not traded yet
    // since potentialSwaps is ordered such that first choice for swapee is at index 0
    // we slice potentialSwaps to remove the first element if the first choice has already traded
    // repeat until possible swapee is found or no potentialSwaps are left
    while (
      potentialSwaps.length > 0 &&
      !tempUsers.find((searchUser) => searchUser.id == potentialSwaps[0].id)
    ) {
      potentialSwaps = potentialSwaps.slice(1);
    }

    // potential swapee found -- add entry to swaps array and remove both users from users array
    if (potentialSwaps.length > 0) {
      swaps.push([u, potentialSwaps[0]]);
      const studentOneIndex = tempUsers.findIndex(
        (searchUser: any) => searchUser.id == u.id
      );
      tempUsers.splice(studentOneIndex, 1);
      const studentTwoIndex = tempUsers.findIndex(
        (searchUser: any) => searchUser.id == potentialSwaps[0].id
      );
      tempUsers.splice(studentTwoIndex, 1);
    }
  }
};

const updateFirestore = async (
  swaps: User[][],
  db: FirebaseFirestore.CollectionReference
) => {
  const batch = admin.firestore().batch();

  for (let swap of swaps) {
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
  }

  await batch.commit();
};

const sendEmail = (
  req: functions.Request,
  res: functions.Response,
  swaps: User[][],
  users: User[]
) => {
  cors(req, res, async () => {
    const flattenedSwaps: any = swaps.reduce(
      (accumulator: any, currentValue: User[]) => {
        accumulator[currentValue[0].id] = currentValue[1].curHASSModule;
        accumulator[currentValue[1].id] = currentValue[0].curHASSModule;
        return accumulator;
      },
      {}
    );

    var transporter = getTransporter();

    console.log(flattenedSwaps);

    for (let u of users) {
      let message;
      if (flattenedSwaps.hasOwnProperty(u.id)) {
        message = `Congratulations! The HASS module that you were previously enrolled in, ${
          u.curHASSModule
        }, has now been swapped for the module ${
          flattenedSwaps[u.id]
        }. You can log on to OurPortal via the link https://our-portal-c30lx5sjw-shohamc1.vercel.app to view all modules that you have enrolled in.`;
      } else {
        message = `It appears that our automatic trading system was unable to find any suitable trades for your current HASS module ${u.curHASSModule}. Better luck next time!`;
      }

      console.log(u.email);
      console.log(message);
      let mailOptions = {
        from: "sutd-ourportal@outlook.com",
        to: u.email,
        subject: "Automated HASS Trading Results",
        text: `Hello there,\n\n${message}\n\nFrom your friends at OurPortal`,
      };

      transporter.sendMail(mailOptions, (err: any, data: any) => {
        if (err) {
          functions.logger.error(err);
        } else {
          functions.logger.info(`Sent AutoTrade results to ${u.id}`);
          res.sendStatus(200);
        }
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
  });
};

export {
  retrieveTrades,
  retrieveModules,
  initialiseArrays,
  populateArrays,
  shuffleUsers,
  executeAlgorithm,
  updateFirestore,
  sendEmail,
};
