import * as admin from "firebase-admin";

import { autoTrade } from "./autoTrade";
import { sendRequest } from "./sendRequest";
import { exportCSV } from "./exportCSV";

admin.initializeApp();

exports.sendRequest = sendRequest;
exports.autoTrade = autoTrade;
exports.exportCSV = exportCSV;
