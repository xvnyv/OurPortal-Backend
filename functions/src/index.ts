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
