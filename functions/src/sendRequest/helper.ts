const validateEmail = (email: string) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Helper function to test if tradeID already exists
const doesTradeExist = (
  db: FirebaseFirestore.CollectionReference,
  tradeID: string
) => {
  return db
    .doc(tradeID)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return true;
      } else {
        return false;
      }
    });
};

// Helper function to get HASS modules
const getHASSMod = (
  db: FirebaseFirestore.CollectionReference,
  studentUID: string
) => {
  // get all data from user
  return db
    .doc(studentUID)
    .get()
    .then((doc) => {
      if (doc.exists) {
        // get modules
        var modules = doc.data()?.modules;
        // test modules
        for (let element of modules) {
          if (/02\.\S+/gm.test(element)) {
            return element;
          }
        }
      }
    });
};

export { validateEmail, doesTradeExist, getHASSMod };
