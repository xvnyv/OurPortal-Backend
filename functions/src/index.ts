import * as functions from "firebase-functions";
const niceware = require("niceware");
var nodemailer = require("nodemailer");

// pass emailID in body
export const addToFamily = functions.https.onRequest(
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

    //const emailID = req.body.emailID as string;
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

    // generate the trade ID (FORMAT: word-word-word-word)
    const phrase = niceware.generatePassphrase(8).join("-");

    let mailOptions = {
      from: "sutd-ourportal@outlook.com",
      to: "shhmchk@gmail.com",
      subject: "You've recieved a trade request!",
      text: `Hello there,\nYou've recieved a trade request from someone! Click the link below to check the deets and accept/decline the request.\n\n${
        "https://ourportal.shohamc1.com/trade/" + phrase
      }\n\nFrom your friends at OurPortal`,
    };

    transporter.sendMail(mailOptions, (err: any, data: any) => {
      if (err) {
        console.log(err);
      }
      console.log("Email sent!!!");
    });

    res.send(200);
  }
);
