import * as admin from "firebase-admin";
import { modules } from "./data/modules";
import { users } from "./data/users";
import { User, ModuleUserMap } from "../autoTrade/interfaces";

import * as subfunctions from "../autoTrade/helper";

if (!admin.apps.length) {
  admin.initializeApp();
}
let db = admin.firestore();
db.settings({
  host: "localhost:8080",
  ssl: false,
});

/* HELPER FUNCTIONS */

const swapsToString = (swaps: User[][]) => {
  return JSON.stringify(
    swaps.map((s) =>
      s
        .sort((a: User, b: User) => parseInt(a.id, 10) - parseInt(b.id, 10))
        .map((u) => u.id)
    )
  );
};

/* SET UP AND TEAR DOWN */

beforeAll(async () => {
  const batch = db.batch();
  const modulesCol = db.collection("modules");
  const usersCol = db.collection("users");

  for (let m of modules) {
    const docRef = modulesCol.doc(m.courseCode);
    batch.set(docRef, { ...m });
  }

  for (let u of users) {
    const docRef = usersCol.doc(u.uid);
    batch.set(docRef, { ...u });
  }

  await batch.commit();
});

afterAll(async () => {
  const batch = db.batch();
  const modulesCol = db.collection("modules");
  const usersCol = db.collection("users");
  for (let m of modules) {
    const docRef = modulesCol.doc(m.courseCode);
    batch.delete(docRef);
  }
  for (let u of users) {
    const docRef = usersCol.doc(u.uid);
    batch.delete(docRef);
  }
  await batch.commit();
});

/* TESTING retrieveTrades */

test("retrieveTrades: only return users who have selected modules for autotrade", async () => {
  expect.assertions(1);
  const users = await subfunctions.retrieveTrades(db.collection("users"));
  let allHaveAutoTrade = true;
  for (let u of users) {
    // check for autoTradeModules is null/undefined or empty array
    if (!u.autoTradeModules || u.autoTradeModules.length === 0) {
      allHaveAutoTrade = false;
      break;
    }
  }
  expect(allHaveAutoTrade).toBe(true);
});

test("retrieveTrade: only return users who currently have a HASS module", async () => {
  expect.assertions(1);
  const users = await subfunctions.retrieveTrades(db.collection("users"));
  let haveHASSModule = true;
  for (let u of users) {
    if (!u.curHASSModule) {
      haveHASSModule = false;
      break;
    }
  }
  expect(haveHASSModule).toBe(true);
});

/* TESTING shuffleUsers */

test("shuffleUsers: different sequence of users each time", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 80 },
        { courseCode: "02.136DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.136DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.136DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 70 },
        { courseCode: "02.211", weightage: 30 },
      ],
      allModules: ["02.136DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.202", weightage: 80 },
        { courseCode: "02.136DH", weightage: 20 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "5",
      curHASSModule: "02.202",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.127DH", weightage: 10 },
        { courseCode: "02.154HT", weightage: 10 },
      ],
      allModules: ["02.202", "50.001", "50.002", "50.004"],
    },
    {
      id: "6",
      curHASSModule: "02.154HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.202", weightage: 70 },
        { courseCode: "02.211", weightage: 30 },
      ],
      allModules: ["02.154HT", "50.001", "50.002", "50.004"],
    },
  ];
  subfunctions.shuffleUsers(testData);
  const shuffleOne = [...testData];
  subfunctions.shuffleUsers(testData);
  const shuffleTwo = [...testData];
  let equal = true;
  for (let i = 0; i < shuffleOne.length; i++) {
    if (shuffleOne[i] !== shuffleTwo[i]) {
      equal = false;
      break;
    }
  }
  expect(equal).toBe(false);
});

/* TESTING updateFirestore */

test("updateFirestore: Firestore update was successful", async () => {
  expect.assertions(2);
  const testData: User[][] = [
    [
      {
        email: "",
        autoTradeModules: [
          { courseCode: "02.219TS", weightage: 80 },
          { courseCode: "02.230TS", weightage: 20 },
        ],
        allModules: ["02.211", "20.312"],
        curHASSModule: "02.211",
        id: "d0m9yBeISnaXgJFp9PpUEN1BMUo1",
      },
      {
        email: "",
        autoTradeModules: [
          { courseCode: "02.211", weightage: 100 },
          { courseCode: "02.202", weightage: 0 },
          { courseCode: "02.228TS", weightage: 0 },
        ],
        allModules: ["02.219TS", "50.045", "50.041", "50.042"],
        curHASSModule: "02.219TS",
        id: "kOHDsI4HLoOdar7ZoEw6yjVWP952",
      },
    ],
  ];
  await subfunctions.updateFirestore(testData, db.collection("users"));
  const user1: FirebaseFirestore.DocumentSnapshot = await db
    .collection("users")
    .doc("d0m9yBeISnaXgJFp9PpUEN1BMUo1")
    .get();
  const user2: FirebaseFirestore.DocumentSnapshot = await db
    .collection("users")
    .doc("kOHDsI4HLoOdar7ZoEw6yjVWP952")
    .get();

  const getHASSModule = (userSnapshot: FirebaseFirestore.DocumentSnapshot) => {
    const data: any = userSnapshot.data();
    return data.modules.find((m: any) => m.slice(0, 2) === "02");
  };
  expect(getHASSModule(user1)).toBe("02.219TS");
  expect(getHASSModule(user2)).toBe("02.211");
});

/* TESTING useBlossom */

test("useBlossom: output contains an array of arrays with 2 User objects", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.231TS", weightage: 80 },
        { courseCode: "02.136DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.136DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);

  expect(typeof swaps[0][0].id).toBe("string");
  expect(typeof swaps[0][1].id).toBe("string");
  expect(swaps[0][0].autoTradeModules.length).toBeGreaterThan(0);
  expect(swaps[0][1].autoTradeModules.length).toBeGreaterThan(0);
  expect(typeof swaps[0][0].curHASSModule).toBe("string");
  expect(typeof swaps[0][1].curHASSModule).toBe("string");
  expect(swaps[0][0].allModules.length).toBeGreaterThan(0);
  expect(swaps[0][1].allModules.length).toBeGreaterThan(0);
});

test("useBlossom: 2 users, no trade possible", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 80 },
        { courseCode: "02.136DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.136DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
  ];
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swaps.length).toBe(0);
});

test("useBlossom: 2 users, trade possible", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.231TS", weightage: 80 },
        { courseCode: "02.136DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.136DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swaps.length).toBe(1);
});

test("useBlossom: 2 users, possible trade has total weightage 0", () => {
  // trade between 1 and 2 has 0 weightage
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.202",
      email: "",
      autoTradeModules: [
        { courseCode: "02.150HT", weightage: 0 },
        { courseCode: "02.144DH", weightage: 90 },
        { courseCode: "02.126", weightage: 10 },
      ],
      allModules: ["02.202", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.150HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 70 },
        { courseCode: "02.202", weightage: 0 },
        { courseCode: "02.218", weightage: 30 },
      ],
      allModules: ["02.150HT", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swapsToString(swaps)).toBe(JSON.stringify([["1", "2"]]));
});

test("useBlossom: 3 users, trade possible for 2 users", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.231TS", weightage: 80 },
        { courseCode: "02.136DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.136DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.150HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 },
        { courseCode: "02.136DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.150HT", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swaps.length).toBe(1);
});

// User1, 2 and 3, 1 and 2 both want 3, 1 has higher weightage than 2, 3 wants both 1 and 2 with 2 higher weightage, 3 gets to choose before 1 => 2 and 3 trade
test("useBlossom: 3 users, higher weightage pair is selected regardless of sequence", () => {
  const testData1: User[] = [
    {
      id: "3",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.136DH", weightage: 80 }, // user 2's module
        { courseCode: "02.211", weightage: 15 }, // user 1's module
        { courseCode: "02.202", weightage: 5 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.231TS", weightage: 80 }, // user 3's module
        { courseCode: "02.143DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.136DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.143DH", weightage: 80 },
        { courseCode: "02.231TS", weightage: 10 }, // user 3's module
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.136DH", "50.001", "50.002", "50.004"],
    },
  ];
  const testData2: User[] = [...testData1];
  [testData2[0], testData2[2]] = [testData2[2], testData2[0]];

  const swaps1: User[][] = subfunctions.useBlossom(testData1);
  const swaps2: User[][] = subfunctions.useBlossom(testData2);
  expect(swapsToString(swaps1) == swapsToString(swaps2)).toEqual(true);
});

// given 2 pairs of equal weightage, the later pair to be identified will be the final pair
test("useBlossom: 3 users, 2 possible pairs of equal weightage", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.231TS", weightage: 50 }, // user 3's module
        { courseCode: "02.136DH", weightage: 50 }, // user 2's module
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.136DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 }, // user 1's module
        { courseCode: "02.143DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.136DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 }, // user 1's module
        { courseCode: "02.143DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swapsToString(swaps)).toBe(JSON.stringify([["1", "3"]]));
});

// User 1, 2, 3 and 4, 1 and 2 mutual, 3 and 4 mutual => 1 and 2 trade, 3 and 4 trade
test("useBlossom: 4 users, 2 pairs of non-overlapped possible trades", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.211",
      email: "",
      autoTradeModules: [
        { courseCode: "02.136DH", weightage: 80 }, // user 2's module
        { courseCode: "02.143DH", weightage: 20 },
      ],
      allModules: ["02.211", "50.001", "50.002", "50.004"],
    },

    {
      id: "2",
      curHASSModule: "02.136DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 }, // user 1's module
        { courseCode: "02.155TS", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.136DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.126", weightage: 80 }, // user 4's module
        { courseCode: "02.127DH", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.126",
      email: "",
      autoTradeModules: [
        { courseCode: "02.231TS", weightage: 80 }, // user 3's module
        { courseCode: "02.155TS", weightage: 10 },
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.126", "50.001", "50.002", "50.004"],
    },
  ]; // user 3 gets first pick
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swapsToString(swaps)).toEqual(
    JSON.stringify([
      ["1", "2"],
      ["3", "4"],
    ])
  );
});

test("useBlossom: 4 users, maximum trades found regardless of sequence", () => {
  const testData: User[] = [
    {
      id: "3",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 15 },
        { courseCode: "02.127DH", weightage: 65 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 5 },
        { courseCode: "02.150HT", weightage: 90 },
        { courseCode: "02.144DH", weightage: 5 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "1",
      curHASSModule: "02.154HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.150HT", weightage: 80 },
        { courseCode: "02.144DH", weightage: 10 },
        { courseCode: "02.127DH", weightage: 10 },
      ],
      allModules: ["02.154HT", "50.001", "50.002", "50.004"],
    },

    {
      id: "2",
      curHASSModule: "02.150HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 60 },
        { courseCode: "02.127DH", weightage: 20 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.150HT", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps1: User[][] = subfunctions.useBlossom(testData);
  expect(swaps1.length).toBe(2);

  [testData[1], testData[2]] = [testData[2], testData[1]];

  const swaps2: User[][] = subfunctions.useBlossom(testData);
  expect(swaps2.length).toBe(2);

  [testData[1], testData[3]] = [testData[3], testData[1]];

  const swaps3: User[][] = subfunctions.useBlossom(testData);
  expect(swaps3.length).toBe(2);
});

test("useBlossom: 4 users, multiple pairs with the same traded modules but different weightage", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 15 },
        { courseCode: "02.127DH", weightage: 65 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },

    {
      id: "2",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.150HT", weightage: 20 },
        { courseCode: "02.154HT", weightage: 10 },
        { courseCode: "02.127DH", weightage: 70 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 5 },
        { courseCode: "02.150HT", weightage: 10 },
        { courseCode: "02.144DH", weightage: 85 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 60 },
        { courseCode: "02.150HT", weightage: 20 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swapsToString(swaps)).toBe(
    JSON.stringify([
      ["1", "4"],
      ["2", "3"],
    ])
  );
});

test("useBlossom: 4 users, multiple pairs with the same traded modules and same weightage", () => {
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 15 },
        { courseCode: "02.127DH", weightage: 65 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.150HT", weightage: 15 },
        { courseCode: "02.154HT", weightage: 20 },
        { courseCode: "02.127DH", weightage: 65 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 15 },
        { courseCode: "02.150HT", weightage: 20 },
        { courseCode: "02.144DH", weightage: 65 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 65 },
        { courseCode: "02.150HT", weightage: 20 },
        { courseCode: "02.218", weightage: 15 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  const stringedSwaps = swapsToString(swaps);
  expect(
    stringedSwaps ==
      JSON.stringify([
        ["1", "3"],
        ["2", "4"],
      ]) ||
      stringedSwaps ==
        JSON.stringify([
          ["1", "4"],
          ["2", "3"],
        ])
  ).toBe(true);
});

test("useBlossom: 4 users, all users place 100 weightage in one module", () => {
  // they all want user 3's module
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.202",
      email: "",
      autoTradeModules: [
        { courseCode: "02.150HT", weightage: 0 },
        { courseCode: "02.144DH", weightage: 100 },
        { courseCode: "02.126", weightage: 0 },
      ],
      allModules: ["02.202", "50.001", "50.002", "50.004"],
    },
    {
      id: "2",
      curHASSModule: "02.150HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 100 },
        { courseCode: "02.154HT", weightage: 0 },
        { courseCode: "02.218", weightage: 0 },
      ],
      allModules: ["02.150HT", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 0 },
        { courseCode: "02.127DH", weightage: 100 },
        { courseCode: "02.150HT", weightage: 0 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 0 },
        { courseCode: "02.150HT", weightage: 0 },
        { courseCode: "02.144DH", weightage: 100 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swapsToString(swaps)).toBe(JSON.stringify([["3", "4"]]));
});

test("useBlossom: 6 users, trade combinations with highest total weightage selected even if lower total weightage has more pairs", () => {
  // possible trades: (3,5) [145] or (2,3 & 4,5) [95]
  const testData: User[] = [
    {
      id: "1",
      curHASSModule: "02.202",
      email: "",
      autoTradeModules: [
        { courseCode: "02.143DH", weightage: 10 },
        { courseCode: "02.144DH", weightage: 80 },
        { courseCode: "02.126", weightage: 10 },
      ],
      allModules: ["02.202", "50.001", "50.002", "50.004"],
    },

    {
      id: "2",
      curHASSModule: "02.150HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 60 },
        { courseCode: "02.126", weightage: 20 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.150HT", "50.001", "50.002", "50.004"],
    },
    {
      id: "3",
      curHASSModule: "02.144DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 65 },
        { courseCode: "02.127DH", weightage: 15 },
        { courseCode: "02.150HT", weightage: 20 },
      ],
      allModules: ["02.144DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "4",
      curHASSModule: "02.127DH",
      email: "",
      autoTradeModules: [
        { courseCode: "02.154HT", weightage: 5 },
        { courseCode: "02.150HT", weightage: 5 },
        { courseCode: "02.144DH", weightage: 90 },
      ],
      allModules: ["02.127DH", "50.001", "50.002", "50.004"],
    },
    {
      id: "5",
      curHASSModule: "02.154HT",
      email: "",
      autoTradeModules: [
        { courseCode: "02.150HT", weightage: 10 },
        { courseCode: "02.144DH", weightage: 80 },
        { courseCode: "02.127DH", weightage: 10 },
      ],
      allModules: ["02.154HT", "50.001", "50.002", "50.004"],
    },

    {
      id: "6",
      curHASSModule: "02.228TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.144DH", weightage: 60 },
        { courseCode: "02.154HT", weightage: 20 },
        { courseCode: "02.218", weightage: 20 },
      ],
      allModules: ["02.228TS", "50.001", "50.002", "50.004"],
    },
  ];
  const swaps: User[][] = subfunctions.useBlossom(testData);
  expect(swapsToString(swaps)).toBe(JSON.stringify([["3", "5"]]));
});
