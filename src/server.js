const express = require("express");

require("dotenv").config();
require("./jobs/syncJob");

const { syncReclamacoes } = require("./controllers/syncController");

const app = express();

const host = "0.0.0.0";

syncReclamacoes()
  .then(() => console.log("Primeira chamada para atualizar as reclamações"))
  .catch((err) => console.error("Erro ao executar syncReclamacoes:", err));

app.get("/", (req, res) => {
  res.send({ message: "Ai caliquinha" });
});

app.listen({ host, port: process.env.PORT || 3333 }, () => {
  console.log(`Server is running...`);
});
