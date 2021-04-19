var cors = require("cors")({ origin: true });
const { promisify } = require("util");
const axios = require("axios");
const mailgun = require("mailgun-js");
const mg = mailgun({
  apiKey: "d03aaac0b0278af7f88f9450849818a6-71b35d7e-305d5ee4",
  domain: "mg.shohamc1.com",
});
const mgBaseUrl =
  "https://api:d03aaac0b0278af7f88f9450849818a6-71b35d7e-305d5ee4@api.mailgun.net/v3";

const testFunc = async () => {
  const members = [
    {
      address: "hazel2934+3@gmail.com",
      vars: {
        message:
          "Congratulations! The HASS module that you were previously enrolled in, 02.231TS, has now been swapped for the module 02.230TS. You can log on to OurPortal via the link https://our-portal-c30lx5sjw-shohamc1.vercel.app to view all modules that you have enrolled in.",
      },
    },
    {
      address: "hazel2934+2@gmail.com",
      vars: {
        message:
          "It appears that our automatic trading system was unable to find any suitable trades for your current HASS module 02.219TS. Better luck next time!",
      },
    },
  ];

  await mg.lists("ourportal@mg.shohamc1.com").members().add({
    members: members,
    subscribed: true,
  });
  const recipients = ["hazel2934+2@gmail.com", "hazel2934+3@gmail.com"];
  const recipientVars = {
    "hazel2934+1@gmail.com": {
      message:
        "Congratulations! The HASS module that you were previously enrolled in, 02.231TS, has now been swapped for the module 02.230TS. You can log on to OurPortal via the link https://our-portal-c30lx5sjw-shohamc1.vercel.app to view all modules that you have enrolled in.",
    },
    "hazel2934+2@gmail.com": {
      message:
        "It appears that our automatic trading system was unable to find any suitable trades for your current HASS module 02.219TS. Better luck next time!",
    },
  };

  const data = {
    sender: "mg.shohamc1.com",
    from: "sutd-ourportal@outlook.com",
    to: recipients,
    subject: "Automated HASS Trading Results",
    text:
      "Hello there,\n\n%recipient.message%\n\nFrom your friends at OurPortal",
    "recipient-variables": JSON.stringify(recipientVars),
  };

  await mg.messages().send(data);
  for (let addr of recipients) {
    axios.delete(
      `${mgBaseUrl}/lists/ourportal@mg.shohamc1.com/members/${addr}`
    );
    // console.log(res.data.message);
  }
};

testFunc();
console.log("done");
