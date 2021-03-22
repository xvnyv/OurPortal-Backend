import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
var cors = require("cors")({ origin: true });
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

// Helper function to get HASS modules
const getHASSMod = (
  db: FirebaseFirestore.CollectionReference,
  studentUID: string
) => {
  // get all data from user
  return db
    .doc(studentUID)
    .get()
    .then((doc) => {
      if (doc.exists) {
        // get modules
        var modules = doc.data()?.modules;
        // test modules
        for (let element of modules) {
          if (/02\.\S+/gm.test(element)) {
            return element;
          }
        }
      }
    });
};

/*
 * Request Parameters
 * @param {string} senderID - UID of requester
 * @param {string} receiverEID - email ID of requestee
 */

/* EXAMPLE REQUEST
{
  "senderID": "d0m9yBeISnaXgJFp9PpUEN1BMUo1",
  "receiverEID": "shhmchk@gmail.com"
}
*/
export const sendRequest = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    cors(req, res, async () => {
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
      const receiverEID = req.body.receiverEID as string;

      // check validity of IDs
      if (
        //!/100\d{4}/gm.test(receiverEID) || //update this test to use email format
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
      const recMod = await getHASSMod(usersDB, receiverID);
      const sendMod = await getHASSMod(usersDB, senderID);

      while (exists) {
        // generate the trade ID (FORMAT: word-word-word-word)
        phrase = niceware.generatePassphrase(8).join("-");

        // check if trade exists in collection
        if (!(await doesTradeExist(tradeDB, phrase))) {
          // add trade to firestore
          tradeDB.doc(phrase).set({
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
        to: receiverEID,
        subject: "You've recieved a trade request!",
        text: `Hello there,\nYou've recieved a trade request from someone! Click the link below to check the deets and accept/decline the request.\n\n${
          "https://ourportal.shohamc1.com/trade/" + phrase
        }\n\nFrom your friends at OurPortal`,
      };

      transporter.sendMail(mailOptions, (err: any, data: any) => {
        if (err) {
          functions.logger.error(err);
        } else {
          functions.logger.info(`Initialised trade ${phrase}`);
          res.sendStatus(200);
        }
      });
    });
  }
);
