
/**
 * Mail service
 *
 * @module services/mail-service
 */

import * as nodemailer from "nodemailer";
import config from "../core/config";
import forms from "../core/forms";
import log from "../core/log";

export default {
  sendMail,
};

let mailTransporter = null;

if (!config.DEBUG_TEST_MAILER) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'miaw.dz@gmail.com',
      pass: 'miawrma95',
    },
  });

  mailTransporter.verify((err) => {
    if (err) {
      log.error("Failed to initialize SMTP mailer: " + err.message);
    } else {
      log.info("SMTP mailer initialized");
    }
  });
} else {
  nodemailer.createTestAccount((err, account) => {
    if (!err) {
      mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'miaw.dz@gmail.com',
          pass: 'miawrma95',
        },
      });
    } else {
      log.error(err.message);
    }
  });
}

/**
 * Sends an email
 * @param  {App} app
 * @param  {User} user mail recipient
 * @param  {string} subject mail subject
 * @param  {string} template mail template name
 * @param  {object} context data to be included while rendering the template (optional)
 * @return {void}
 */
async function sendMail(app, user, subject, template, context = {}) {
  const result = new Promise((resolve, reject) => {
    if (mailTransporter === null) {
      reject(new Error("Mail transporter is not correctly configured. "
        + "Please [contact](/article/docs) the administrators."));
    }

    const mergedContext = Object.assign({ rootUrl: config.ROOT_URL }, context);

    app.render("mail/" + template, mergedContext, (err, html) => {
      if (!err) {
        const textVersion = forms.htmlToText(html);

        const mailOptions = {
          from: "miaw.dz@gmail.com",
          to: user.get("email"),
          subject: "[CNPSR] " + subject,
          html,
          text: textVersion,
        };

        mailTransporter.sendMail(mailOptions, (err2) => {
          if (!err2) {
            if (config.DEBUG_TEST_MAILER) {
              log.info("===============");
              log.info("mail sent");
              log.info("to: " + (user.get("title") || user.get("name")));
              log.info("subject: " + subject);
              log.info("body: \n" + textVersion);
              log.info("===============");
            }
            resolve();
          } else {
            reject(new Error("Failed to send mail: " + err2.message));
          }
        });
      } else {
        reject(new Error("Failed to render mail: " + err.message));
      }
    });
  });

  result.catch((err) => {
    log.warn(err.message);
  });

  return result;
}
