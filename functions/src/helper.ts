var nodemailer = require("nodemailer");

// Helper function to create nodemailer object
const getTransporter = () => {
  var transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "sutd-ourportal@outlook.com",
      pass: "Cor@T^zpvN4*v%",
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  return transporter;
};

export { getTransporter };
