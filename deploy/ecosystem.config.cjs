// PM2 process file (PRD §16). Two processes, both fork mode (the rate limiter is in-process):
//   web  — the Next.js standalone server, bound to 127.0.0.1:3000 (only Nginx talks to it)
//   cron — mail queue (every minute), fee records (00:05 day 1), file cleanup (03:00)
// Start/reload:  pm2 startOrReload deploy/ecosystem.config.cjs --update-env && pm2 save
const path = require("node:path");

const APP = path.resolve(__dirname, "..");
const ENV_FILE = path.join(APP, ".env");

module.exports = {
    apps: [
        {
            name: "web",
            cwd: path.join(APP, ".next/standalone"),
            script: "server.js",
            node_args: `--env-file=${ENV_FILE}`,
            env: { PORT: "3000", HOSTNAME: "127.0.0.1", APP_PROCESS: "web" },
            exec_mode: "fork",
            instances: 1,
            max_memory_restart: "450M", // 1 GB VPS: restart before the kernel OOM-kills us
            kill_timeout: 10_000, // let in-flight uploads finish on reload
            time: false, // our logs already carry ISO timestamps
        },
        {
            name: "cron",
            cwd: APP,
            script: "scripts/cron.js",
            node_args: `--conditions=react-server --env-file=${ENV_FILE}`,
            env: { APP_PROCESS: "cron" },
            exec_mode: "fork",
            instances: 1,
            max_memory_restart: "250M",
            time: false,
        },
    ],
};
