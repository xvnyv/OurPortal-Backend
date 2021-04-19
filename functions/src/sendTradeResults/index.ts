import * as functions from "firebase-functions";
var cors = require("cors")({ origin: true });
const { promisify } = require("util");
const axios = require("axios");
const mailgun = require("mailgun-js");
const mg = mailgun({
  apiKey: functions.config().mailgun.apikey,
  domain: functions.config().mailgun.domain,
});

export const sendTradeResults = functions
  .runWith({ memory: "256MB", timeoutSeconds: 120 })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    const promisifiedCors = promisify(cors);
    await promisifiedCors(req, res);

    let { data } = req.body;
    data = JSON.parse(data);
    let dataCopy = [...data];
    console.log("Called with length: " + data.length);

    for (let i = 0; i < 40; i++) {
      const u = data[i];
      if (u === undefined) break;
      let mailOptions = {
        from: "sutd-ourportal@outlook.com",
        to: u.email,
        subject: "Automated HASS Trading Results",
        text: `Hello there,\n\n${u.message}\n\nFrom your friends at OurPortal`,
      };

      try {
        await mg.messages().send(mailOptions);

        dataCopy = dataCopy.filter((um: any) => um.id !== u.id);
        console.log(`Sent AutoTrade results to ${u.id} with email ${u.email}`);
        functions.logger.info(
          `Sent AutoTrade results to ${u.id} with email ${u.email}`
        );
        // res.sendStatus(200);
      } catch (e) {
        try {
          await mg.messages().send(mailOptions);
          dataCopy = dataCopy.filter((um: any) => um.id !== u.id);
          console.log(
            `Sent AutoTrade results to ${u.id} with email ${u.email}`
          );
          functions.logger.info(
            `Sent AutoTrade results to ${u.id} with email ${u.email}`
          );
        } catch (e) {
          console.log(`Error sending email to ${u.id} with email ${u.email}`);
        }
      }

      await new Promise((r) => setTimeout(r, 250));
    }
    if (dataCopy.length) {
      await axios.post(
        "http://localhost:5001/ourportal-e0a9c/us-central1/sendTradeResults",
        { data: JSON.stringify(dataCopy) }
      );
    }
    res.json("done");
  });
