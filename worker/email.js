const cron = require("node-cron");
const { sendMail } = require("../utils/email");

class EmailJOB {
  constructor() {
    this.queue = require("../utils/queue");
  }

  start() {
    cron.schedule("*/10 * * * * *", async () => {
      while (!this.queue.isEmpty()) {
        const { email, subject, content, html } = this.queue.dequeue();
        await sendMail(email, subject, content, html);
      }
    });
  }

  push_email(email) {
    this.queue.enqueue(email);
  }
}

module.exports = new EmailJOB();
