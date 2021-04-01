import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const exportCSV = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const db = admin.firestore();
    let result = await db.collection("users").get();
    let data: any = [];

    result.forEach((doc) => {
      data.push(doc.data());
    });

    res.send(data);
  }
);
