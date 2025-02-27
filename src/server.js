const express = require("express");
require("dotenv").config();
require("./jobs/syncJob");

const { syncReclamacoes } = require("./controllers/syncController");

const app = express();

syncReclamacoes()
  .then(() => console.log("syncReclamacoes executado na inicialização"))
  .catch((err) => console.error("Erro ao executar syncReclamacoes:", err));

app.listen(3000, () => {
  console.log(`Server is running...`);
});
