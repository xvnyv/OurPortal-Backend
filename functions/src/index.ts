import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const niceware = require("niceware");
var nodemailer = require("nodemailer");

admin.initializeApp();

// Helper function to test if tradeID already exists
const doesTradeExist = (
  db: FirebaseFirestore.CollectionReference,
  tradeID: string
) => {
  return db
    .doc(tradeID)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return true;
      } else {
        return false;
      }
    });
};

const getHASSMod = async (
  db: FirebaseFirestore.CollectionReference,
  studentUID: string
) => {
  // get all data from user
  var doc = await db.doc(studentUID).get();
  if (doc.exists) {
    // get modules
    var modules = doc.data()?.modules;
    // test modules
    for (let element of modules) {
      if (/02\.\S+/gm.test(element)) {
        console.log("Found " + element);
        return element;
      }
    }
  }
};

export const test = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const senderID = req.body.ID as string;
    const db = admin.firestore().collection("users");

    // some async issue here
    var a = await getHASSMod(db, senderID);
    console.log(a);
    res.status(400).send("HELLO");
  }
);

/*
 * Request Parameters
 * @param {string} senderID - UID of requester
 * @param {string} receiverEID - email ID of requestee
 */
export const sendRequest = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    // enable CORS
    res.set("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
      // Send response to OPTIONS requests
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Max-Age", "3600");
      res.status(204).send("");
    }

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "sutd-ourportal@outlook.com",
        pass: "Cor@T^zpvN4*v%",
      },
      tls: {
        ciphers: "SSLv3",
      },
    });

    // initialise variables
    var exists = true as boolean;
    var phrase: string = "";
    var receiverID: string = "";
    const db = admin.firestore();
    const tradeDB = db.collection("trades");
    const usersDB = db.collection("users");

    // get variables from request body
    const senderID = req.body.senderID as string;
    const receiverEID = req.body.senderID as string;

    // check validity of IDs
    if (
      !/100\d{4}/gm.test(receiverEID) || //update this test to use email format
      receiverEID == "" ||
      receiverEID == null ||
      senderID == "" ||
      senderID == null
    ) {
      return res.status(400).send("No ID sent or badly formatted").end();
    }

    // get receiver UID
    const rec = await usersDB.where("email", "==", receiverEID).get();
    receiverID = rec.docs[0].data().uid;

    // get current modules
    const recMod = getHASSMod(usersDB, receiverID);
    const sendMod = getHASSMod(usersDB, senderID);

    while (exists) {
      // generate the trade ID (FORMAT: word-word-word-word)
      phrase = niceware.generatePassphrase(8).join("-");

      // check if trade exists in collection
      if (!(await doesTradeExist(tradeDB, phrase))) {
        // add trade to firestore
        db.doc(phrase).set({
          from: senderID,
          fromMod: sendMod,
          to: receiverID,
          toMod: recMod,
        });

        // change value of exists, break from loop
        exists = false;
      }
    }

    let mailOptions = {
      from: "sutd-ourportal@outlook.com",
      to: `${receiverEID}@mymail.sutd.edu.sg`,
      subject: "You've recieved a trade request!",
      text: `Hello there,\nYou've recieved a trade request from someone! Click the link below to check the deets and accept/decline the request.\n\n${
        "https://ourportal.shohamc1.com/trade/" + phrase
      }\n\nFrom your friends at OurPortal`,
    };

    transporter.sendMail(mailOptions, (err: any, data: any) => {
      if (err) {
        console.log(err);
      } else {
        functions.logger.error(`Initialised trade ${phrase}`);
        res.sendStatus(200);
      }
    });
  }
);

const retrieveTrades = async (
  db: FirebaseFirestore.CollectionReference
): Promise<any[]> => {
  const usersSnapshot = await db.where("autoTradeModules", "!=", null).get();
  const users: any[] = [];
  usersSnapshot.forEach((u) => {
    const data = u.data();
    const curHASSModule = data.modules.find((m: any) => m.slice(0, 2) === "02");
    const autoTradeModules = data.autoTradeModules;
    const id = data.uid;
    users.push({ curHASSModule, autoTradeModules, id });
  });
  return users;
};

const retrieveModules = async (
  db: FirebaseFirestore.CollectionReference
): Promise<any[]> => {
  const modulesSnapshot = await db.where("type", "==", "HASS").get();
  const modules: any[] = [];
  modulesSnapshot.forEach((m) => {
    const data = m.data();
    modules.push({ courseCode: data.courseCode });
  });
  return modules;
};

const initialiseArrays = (current: any, modules: any[]) => {
  for (let m of modules as any) {
    current[m.courseCode] = [];
  }
};

const populateArrays = (current: any, users: any[]) => {
  for (let u of users) {
    if (u.curHASSModule) current[u.curHASSModule].push(u);
  }
};

// const sortRequests = (requested: any) => {
//   for (let mCode of Object.keys(requested)) {
//     requested[mCode] = requested[mCode].sort((a: any, b: any) => {
//       return b.weightage - a.weightage;
//     });
//   }
// };

const shuffleUsers = (users: any[]) => {
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [users[i], users[j]] = [users[j], users[i]];
  }
};

const executeAlgorithm = (users: any[], current: any, swaps: any[]) => {
  // make a copy of users so that we can modify the original array while looping through all users
  const tempUsers = [...users];

  // loop through all users
  for (let i = 0; i < tempUsers.length; i++) {
    const u = tempUsers[i];

    // check if user has already traded but has not been removed from list of users
    // skip this iteration if user has already traded
    if (!users.includes(u)) {
      console.log(`${u.id} has already traded.\n`);
      continue;
    }

    // sort current user's desired modules according to weightage
    u.autoTradeModules = u.autoTradeModules.sort((a: any, b: any) => {
      return b.weightage - a.weightage;
    });

    // record all potential swaps
    let potentialSwaps: any[] = [];

    // iterate through all desired modules of current user
    for (let m of u.autoTradeModules) {
      // iterate through all users who currently have these desired modules
      for (let j = 0; j < current[m.courseCode].length; j++) {
        const u2 = current[m.courseCode][j];

        // current array is intentionally not updated when users are identified for trades to save on computation time
        // check whether potential swapee is already involved in a trade

        // potential swapee has already traded -- remove user from current array
        if (!users.includes(u2)) {
          current[m.courseCode].splice(j, 1);
        }
        // potential swapee can still trade
        else {
          // check whether potential swapee also wants current user's module
          const swappableModule = u2.autoTradeModules.find(
            (m2: any) => m2.courseCode == u.curHASSModule
          );
          // both parties want each others' modules -- add potentialSwapee to potentialSwaps array
          if (swappableModule)
            potentialSwaps.push({ ...swappableModule, id: u2.id });
        }
      }
    }

    // check to make sure the chosen user(s) in potentialSwaps have not traded yet
    // since potentialSwaps is ordered such that first choice for swapee is at index 0
    // we slice potentialSwaps to remove the first element if the first choice has already traded
    // repeat until possible swapee is found or no potentialSwaps are left
    while (
      potentialSwaps.length > 0 &&
      !users.find((searchUser) => searchUser.id == potentialSwaps[0].id)
    ) {
      potentialSwaps = potentialSwaps.slice(1);
    }

    // potential swapee found -- add entry to swaps array and remove both users from users array
    if (potentialSwaps.length > 0) {
      swaps.push([u.id, potentialSwaps[0].id]);
      const studentOneIndex = users.findIndex(
        (searchUser: any) => searchUser.id == u.id
      );
      const studentTwoIndex = users.findIndex(
        (searchUser: any) => searchUser.id == potentialSwaps[0].id
      );
      users.splice(studentOneIndex, 1);
      users.splice(studentTwoIndex, 1);
    }
  }
};

export const autoTrade = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const userDb = admin.firestore().collection("users");
    const moduleDb = admin.firestore().collection("modules");
    const users: any[] = await retrieveTrades(userDb);
    const modules: any[] = await retrieveModules(moduleDb);

    // const requested: any = new Object();
    const current: any = new Object();
    const swaps: any[] = [];

    initialiseArrays(current, modules);
    populateArrays(current, users);
    // sortRequests(requested);
    shuffleUsers(users);

    console.log(current);
    console.log(users);

    executeAlgorithm(users, current, swaps);
    console.log(swaps);
    res.json("done");
  }
);
