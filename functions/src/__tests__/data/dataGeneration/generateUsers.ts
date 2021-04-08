import { modules } from "../modules";
const fs = require("fs");

const hassModules = modules.filter((m) => m.courseCode.slice(0, 2) === "02");
const hassN = hassModules.length;

const randomInt = (start: number, end: number) => {
  // end is not inclusive
  return Math.floor(Math.random() * (end - start) + start);
};

const getRandomHassModule = () => {
  return hassModules[randomInt(0, hassN)].courseCode;
};

const generateUsers = () => {
  const n = 50;
  const firstName = "Test User";
  const emails = ["xvvnyv", "hazel2934", "bunsis29"];
  const users = [];

  for (let i = 0; i < n; i++) {
    const lastName = `${i + 1}`;
    const email = `${emails[randomInt(0, 3)]}+${i + 1}@gmail.com`;

    const selectedModules = [];
    const modules = [getRandomHassModule()];
    selectedModules.push(modules[0]);

    const autoTradeModules = [];
    const autoTradeModulesN = randomInt(1, 4);
    let remainingWeightage = 100;
    for (let j = 0; j < autoTradeModulesN; j++) {
      let newModule = getRandomHassModule();
      while (selectedModules.includes(newModule)) {
        newModule = getRandomHassModule();
      }
      selectedModules.push(newModule);
      let weightage;
      if (j + 1 === autoTradeModulesN) {
        weightage = remainingWeightage;
      } else {
        weightage = randomInt(0, remainingWeightage + 1);
      }
      autoTradeModules.push({ courseCode: newModule, weightage });
      remainingWeightage -= weightage;
    }
    const uid = `${i + 1}`;
    const user = { firstName, lastName, email, modules, autoTradeModules, uid };
    users.push(user);
  }

  let data = JSON.stringify(users);
  fs.writeFileSync("./randomUsers.json", data);
};

generateUsers();
