const pRetry = require("p-retry").default;
const pLimit = require("p-limit").default;
const { fetchReclamacoes } = require("../services/databaseService");
const { createOrUpdateDeal } = require("../services/bitrixService");
const { getBitrixStatus } = require("../utils/statusMapping");

const limit = pLimit(2);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const syncReclamacoes = async () => {
  console.log("Iniciando sincronização de reclamações...");
  try {
    const reclamacoes = await fetchReclamacoes();

    for (const row of reclamacoes) {
      await limit(async () => {
        await pRetry(
          async () => {
            const bitrixStatus = getBitrixStatus(row.status);
            await createOrUpdateDeal(row, bitrixStatus);

            await delay(1000);
          },
          { retries: 3 }
        );
      });
    }

    console.log("Sincronização concluída com sucesso.");
  } catch (error) {
    console.error("Erro durante a sincronização:", error.message);
  }
};

module.exports = { syncReclamacoes };
