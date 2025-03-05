const express = require("express");
require("dotenv").config();
require("./jobs/syncJob");

const { syncReclamacoes } = require("./controllers/syncController");

const app = express();

syncReclamacoes()
  .then(() => console.log("Primeira chamada para atualizar as reclamações"))
  .catch((err) => console.error("Erro ao executar syncReclamacoes:", err));

app.listen(3000, () => {
  console.log(`Server is running...`);
});
