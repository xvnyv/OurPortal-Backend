import * as admin from "firebase-admin";
import { modules } from "./data/modules";
import { users } from "./data/users";
import {
  User,
  // AutoTradeModule,
  // ModuleUserMap,
  ModuleUserMap,
  // autoTrade,
} from "../autoTrade/interfaces";

import * as subfunctions from "../autoTrade/helper";

if (!admin.apps.length) {
  admin.initializeApp();
}
let db = admin.firestore();
// db.settings({
//   host: "localhost:8080",
//   ssl: false,
// });

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

/* TESTING retrieveModules */

test("retrieveModules: return an array of course codes", async () => {
  expect.assertions(1);
  const modules = await subfunctions.retrieveModules(db.collection("modules"));
  let allString = true;
  for (let m of modules) {
    if (m instanceof String) {
      allString = false;
      break;
    }
  }
  expect(allString).toBe(true);
});

test("retrieveModules: only returns HASS modules", async () => {
  expect.assertions(1);
  const modules = await subfunctions.retrieveModules(db.collection("modules"));
  let allHASS = true;
  for (let m of modules) {
    if (m.slice(0, 2) !== "02") {
      allHASS = false;
      break;
    }
  }
  expect(allHASS).toBe(true);
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

/* TESTING initialiseArrays */

test("initialiseArrays: current is initialised with every HASS module course code as keys", () => {
  let allHASSModules: string[] = modules.reduce(
    (accumulator: any[], m: any) => {
      if (m.type === "HASS") accumulator.push(m.courseCode);
      return accumulator;
    },
    []
  );

  const current = {};
  subfunctions.initialiseArrays(current, allHASSModules);

  let hasAllCourseCodesAsKey = true;
  for (let m of allHASSModules) {
    if (!current.hasOwnProperty(m)) {
      console.log(m);
      hasAllCourseCodesAsKey = false;
      break;
    }
  }
  expect(hasAllCourseCodesAsKey).toBe(true);
});

/* TESTING populateArrays */

test("populateArrays: correctly populate current with User objects", () => {
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
  ];
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  subfunctions.populateArrays(current, testData);
  const expected: ModuleUserMap = {};
  modules.forEach((m: any) => {
    const arr: User[] = [];
    testData.forEach((u) => {
      if (u.curHASSModule === m.courseCode) {
        arr.push(u);
      }
    });
    if (m.type === "HASS") expected[m.courseCode] = arr;
  });
  expect(current).toEqual(expected);
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

/* TESTING executeAlgorithm */

test("executeAlgorithm: 2 users, no mutual swap possible", () => {
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
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(swaps.length).toBe(0);
});

test("executeAlgorithm: 2 users, mutual swap possible", () => {
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
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(swaps.length).toBe(1);
});

test("executeAlgorithm: output contains an array of arrays with 2 User objects", () => {
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
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);

  expect(typeof swaps[0][0].id).toBe("string");
  expect(typeof swaps[0][1].id).toBe("string");
  expect(swaps[0][0].autoTradeModules.length).toBeGreaterThan(0);
  expect(swaps[0][1].autoTradeModules.length).toBeGreaterThan(0);
  expect(typeof swaps[0][0].curHASSModule).toBe("string");
  expect(typeof swaps[0][1].curHASSModule).toBe("string");
  expect(swaps[0][0].allModules.length).toBeGreaterThan(0);
  expect(swaps[0][1].allModules.length).toBeGreaterThan(0);
});

test("executeAlgorithm: 3 users, mutual swap possible for 2 users", () => {
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
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(swaps.length).toBe(1);
});

// User1, 2 and 3, 1 and 2 both want 3, 1 has higher weightage than 2, 3 wants both 1 and 2 with 1 higher weightage => 1 and 3 trade
test("executeAlgorithm: 3 users, u1 and u2 want u3's module, u1 gave higher weightage than u2, u3 wants u1's module more than u2's", () => {
  const testData: User[] = [
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
    {
      id: "3",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.211", weightage: 80 }, // user 1's module
        { courseCode: "02.136DH", weightage: 10 }, // user 2's module
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
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(
    swaps[0]
      .sort((a: User, b: User) => parseInt(a.id, 10) - parseInt(b.id, 10))
      .map((u) => u.id)
  ).toEqual(["1", "3"]);
});

// User1, 2 and 3, 1 and 2 both want 3, 1 has higher weightage than 2, 3 wants both 1 and 2 with 2 higher weightage, 3 gets to choose before 1 => 2 and 3 trade
test("executeAlgorithm: 3 users, u1 and u2 want u3's module, u1 gave higher weightage than u2, u3 wants u2's module more than u1's, u3 gets to select modules before u1", () => {
  const testData: User[] = [
    {
      id: "3",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.136DH", weightage: 80 }, // user 2's module
        { courseCode: "02.211", weightage: 10 }, // user 1's module
        { courseCode: "02.202", weightage: 10 },
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
  ]; // user 3 gets first pick
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(
    swaps[0]
      .sort((a: User, b: User) => parseInt(a.id, 10) - parseInt(b.id, 10))
      .map((u) => u.id)
  ).toEqual(["2", "3"]);
});

// User1, 2 and 3, 1 and 2 both want 3, 1 has higher weightage than 2, 3 wants both 1 and 2 with 2 higher weightage, 1 gets to choose before 3 => 1 and 3 trade
test("executeAlgorithm: 3 users, u1 and u2 want u3's module, u1 gave higher weightage than u2, u3 wants u2's module more than u1's, u1 gets to select modules before u3", () => {
  const testData: User[] = [
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
      id: "3",
      curHASSModule: "02.231TS",
      email: "",
      autoTradeModules: [
        { courseCode: "02.136DH", weightage: 80 }, // user 2's module
        { courseCode: "02.211", weightage: 10 }, // user 1's module
        { courseCode: "02.202", weightage: 10 },
      ],
      allModules: ["02.231TS", "50.001", "50.002", "50.004"],
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
  ]; // user 3 gets first pick
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(
    swaps[0]
      .sort((a: User, b: User) => parseInt(a.id, 10) - parseInt(b.id, 10))
      .map((u) => u.id)
  ).toEqual(["1", "3"]);
});

// User1, 2, 3 and 4, 1 and 2 mutual, 3 and 4 mutual => 1 and 2 trade, 3 and 4 trade
test("executeAlgorithm: 4 users, 2 pairs of possible trades", () => {
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
  let current: ModuleUserMap = modules.reduce((accumulator: any[], m: any) => {
    if (m.type === "HASS") accumulator[m.courseCode] = [];
    return accumulator;
  }, {});
  testData.forEach((u) => {
    current[u.curHASSModule].push(u);
  });
  const swaps: User[][] = [];
  subfunctions.executeAlgorithm(testData, current, swaps);
  expect(
    swaps.reduce((accumulator: string[][], currentValue: User[]) => {
      accumulator.push(
        currentValue
          .sort((a: User, b: User) => parseInt(a.id, 10) - parseInt(b.id, 10))
          .map((u) => u.id)
      );
      return accumulator;
    }, [])
  ).toEqual([
    ["1", "2"],
    ["3", "4"],
  ]);
});
