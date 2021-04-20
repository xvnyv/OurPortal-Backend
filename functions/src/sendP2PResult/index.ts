import * as functions from "firebase-functions";
var cors = require("cors")({ origin: true });

import { getTransporter } from "../helper";

export const sendP2PResult = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    cors(req, res, async () => {
      var transporter = getTransporter();

      const { email, outcome } = req.body;
      console.log(email);

      let message;
      if (outcome === "accept") {
        message =
          "Congratulations! Your trade request has been accepted. Log in to https://ourportal.shohamc1.com to see your new modules.";
      } else if (outcome === "decline") {
        message =
          "It appears that your trade request has been declined. You may log in to https://ourportal.shohamc1.com to either trade with a different peer or create an autotrade request.";
      }

      if (message) {
        let mailOptions = {
          from: "sutd-ourportal@outlook.com",
          to: email,
          subject: "P2P Trade Outcome",
          text: `Hello there,\n${message}\n\nFrom your friends at OurPortal`,
        };

        transporter.sendMail(mailOptions, (err: any, data: any) => {
          if (err) {
            functions.logger.error(err);
          } else {
            functions.logger.info(`Sent ${outcome} email to ${email}`);
            res.sendStatus(200);
          }
        });
      } else {
        res.sendStatus(200);
      }
    });
  }
);
