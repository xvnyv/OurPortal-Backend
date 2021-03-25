interface User {
  id: string;
  curHASSModule: string;
  autoTradeModules: AutoTradeModule[];
  allModules: string[];
  email: string;
}

interface AutoTradeModule {
  weightage: number;
  courseCode: string;
}

interface ModuleUserMap {
  [key: string]: User[];
}

export { User, AutoTradeModule, ModuleUserMap };
