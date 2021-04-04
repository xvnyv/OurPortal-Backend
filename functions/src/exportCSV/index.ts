import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
var cors = require("cors")({ origin: true });
const { parse } = require("json2csv");

export const exportCSV = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    cors(req, res, async () => {
      const db = admin.firestore();
      const fields = [
        "lastName",
        "autoTradeModules",
        "modules",
        "uid",
        "firstName",
        "email",
      ];

      let result = await db.collection("users").get();
      let data: FirebaseFirestore.DocumentData[] = [];

      result.forEach((doc) => {
        data.push(doc.data());
      });

      const output = await parse(data, { fields });

      res.send(output);
    });
  }
);
