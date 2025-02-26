const cron = require("node-cron");
const { syncReclamacoes } = require("../controllers/syncController");

cron.schedule("* * * * *", syncReclamacoes);
console.log("Cron job iniciado! O script será executado a cada minuto.");
