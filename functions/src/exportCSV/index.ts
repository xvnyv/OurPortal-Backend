import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
var cors = require("cors")({ origin: true });

export const exportCSV = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    cors(req, res, async () => {
      const db = admin.firestore();
      let result = await db.collection("users").get();
      let data: FirebaseFirestore.DocumentData[] = [];

      result.forEach((doc) => {
        data.push(doc.data());
      });

      res.send(data);
    });
  }
);
