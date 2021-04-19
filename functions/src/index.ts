import * as admin from "firebase-admin";

import { autoTrade } from "./autoTrade";
import {sendTradeResults } from "./sendTradeResults";
import { sendRequest } from "./sendRequest";
import { exportCSV } from "./exportCSV";
import { autoTradeStress  } from "./__tests__/stress";
if (!admin.apps.length) admin.initializeApp();

exports.sendRequest = sendRequest;
exports.autoTrade = autoTrade;
exports.exportCSV = exportCSV;
exports.stressTester = autoTradeStress;
exports.sendTradeResults = sendTradeResults;
