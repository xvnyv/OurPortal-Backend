"use strict";
exports.__esModule = true;
var modules_1 = require("../modules");
var fs = require("fs");
var hassModules = modules_1.modules.filter(function (m) {
  return m.courseCode.slice(0, 2) === "02";
});
var hassN = hassModules.length;
var randomInt = function (start, end) {
  // end is not inclusive
  return Math.floor(Math.random() * (end - start) + start);
};
var getRandomHassModule = function () {
  return hassModules[randomInt(0, hassN)].courseCode;
};
var generateUsers = function () {
  var n = 100;
  var firstName = "Test User";
  var emails = ["xvvnyv", "hazel2934", "bunsis29"];
  var users = [];
  console.log("Total requests: " + n);
  for (var i = 0; i < n; i++) {
    var lastName = "" + (i + 1);
    var email = emails[randomInt(0, 3)] + "@gmail.com";
    var selectedModules = [];
    var modules_2 = [getRandomHassModule()];
    selectedModules.push(modules_2[0]);
    var autoTradeModules = [];
    var autoTradeModulesN = randomInt(1, 4);
    var remainingWeightage = 100;
    for (var j = 0; j < autoTradeModulesN; j++) {
      var newModule = getRandomHassModule();
      while (selectedModules.includes(newModule)) {
        newModule = getRandomHassModule();
      }
      selectedModules.push(newModule);
      var weightage = void 0;
      if (j + 1 === autoTradeModulesN) {
        weightage = remainingWeightage;
      } else {
        weightage = randomInt(0, remainingWeightage + 1);
      }
      autoTradeModules.push({ courseCode: newModule, weightage: weightage });
      remainingWeightage -= weightage;
    }
    var uid = "" + (i + 1);
    var user = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      modules: modules_2,
      autoTradeModules: autoTradeModules,
      uid: uid,
    };
    users.push(user);
  }
  var data = JSON.stringify(users);
  fs.writeFileSync("src/__tests__/data/dataGeneration/randomUsers.json", data);
};
generateUsers();
