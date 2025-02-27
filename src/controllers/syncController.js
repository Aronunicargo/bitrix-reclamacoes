const { fetchReclamacoes } = require("../services/databaseService");
const { createOrUpdateDeal } = require("../services/bitrixService");
const { getBitrixStatus } = require("../utils/statusMapping");

const syncReclamacoes = async () => {
  console.log("Iniciando sincronização de reclamações...");
  try {
    const reclamacoes = await fetchReclamacoes();

    for (const row of reclamacoes) {

      const bitrixStatus = getBitrixStatus(row.status);
      await createOrUpdateDeal(row, bitrixStatus);
    }

    console.log("Sincronização concluída com sucesso.");
  } catch (error) {
    console.error("Erro durante a sincronização:", error.message);
  }
};
module.exports = { syncReclamacoes };
