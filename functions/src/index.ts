import * as admin from "firebase-admin";

import { autoTrade } from "./autoTrade";
import { sendRequest } from "./sendRequest";

admin.initializeApp();

exports.sendRequest = sendRequest;
exports.autoTrade = autoTrade;
