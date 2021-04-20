import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
var cors = require("cors")({ origin: true });
const niceware = require("niceware");

import { validateEmail, doesTradeExist, getHASSMod } from "./helper";

import { getTransporter } from "../helper";

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
      var transporter = getTransporter();

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
        !validateEmail(receiverEID) ||
        receiverEID == "" ||
        receiverEID == null ||
        senderID == "" ||
        senderID == null
      ) {
        return res.status(400).send("No ID sent or badly formatted").end();
      }

      // get receiver UID
      try {
        const rec = await usersDB.where("email", "==", receiverEID).get();
        if (!rec.docs.length) {
          return res.status(400).send("No email found in database").end();
        }
        receiverID = rec.docs[0].data().uid;

        // get current modules
        const recMod = await getHASSMod(usersDB, receiverID);
        const sendMod = await getHASSMod(usersDB, senderID);

        if (!recMod || !sendMod) {
          return res.status(400).send("Recipient has no HASS module").end();
        }

        while (exists) {
          // generate the trade ID (FORMAT: word-word-word-word)
          phrase = niceware.generatePassphrase(8).join("-");
          // check if trade exists in collection
          if (!(await doesTradeExist(tradeDB, phrase))) {
            // add trade to firestore
            console.log("in loop: " + phrase);
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
      } catch (err) {
        console.log(err);
      }
    });
  }
);
