import * as admin from "firebase-admin";

import { autoTrade } from "./autoTrade";
import { sendRequest } from "./sendRequest";
import { exportCSV } from "./exportCSV";
if (!admin.apps.length) admin.initializeApp();

exports.sendRequest = sendRequest;
exports.autoTrade = autoTrade;
exports.exportCSV = exportCSV;
