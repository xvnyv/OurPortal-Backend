module.exports = {
  testRegex: "src(/__tests__/.*|(\\.|/)(test|spec))\\.(js?|ts?)$",
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testPathIgnorePatterns: ["lib/", "node_modules/", "src/__tests__/data/"],
  moduleFileExntensions: ["js", "ts", "tsx", "jsx", "json", "node"],
  testEnvironment: "node",
  rootDir: "src",
};
