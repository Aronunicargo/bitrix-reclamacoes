const cron = require("node-cron");
const { syncReclamacoes } = require("../controllers/syncController");

cron.schedule("0 * * * *", syncReclamacoes);
console.log("Cron job iniciado! O script será executado a cada 1 hora.");
