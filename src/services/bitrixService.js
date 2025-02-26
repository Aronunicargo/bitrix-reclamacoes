const axios = require("axios");
const { BITRIX_URL } = require("../config/bitrix");

const formatObservations = require("../utils/formatObs");

const getExistingDeal = async (title) => {
  try {
    const response = await axios.get(`${BITRIX_URL}/crm.deal.list`, {
      params: { FILTER: { TITLE: title }, SELECT: ["ID", "STAGE_ID"] },
    });

    return response.data.result?.[0] || null;
  } catch (error) {
    console.error(
      "Erro ao buscar negócio existente:",
      error.response?.data || error.message
    );
    return null;
  }
};

const getOrCreateCompanyId = async (companyName, email) => {
  try {
    const response = await axios.get(`${BITRIX_URL}/crm.company.list`, {
      params: { FILTER: { TITLE: companyName }, SELECT: ["ID", "EMAIL"] },
    });

    const company = response.data.result?.[0];

    if (company) {
      const existingEmails = company.EMAIL || [];
      const emailExists = existingEmails.some(
        (e) => e.VALUE.toLowerCase() === email.toLowerCase()
      );

      if (!emailExists) {
        await axios.post(`${BITRIX_URL}/crm.company.update`, {
          id: company.ID,
          fields: {
            EMAIL: [...existingEmails, { VALUE: email, VALUE_TYPE: "WORK" }],
          },
        });
      }

      return company.ID;
    }

    const createResponse = await axios.post(`${BITRIX_URL}/crm.company.add`, {
      fields: {
        TITLE: companyName,
        EMAIL: [{ VALUE: email, VALUE_TYPE: "WORK" }],
      },
    });

    return createResponse.data.result || null;
  } catch (error) {
    console.error(
      "Erro ao buscar/criar empresa:",
      error.response?.data || error.message
    );
    return null;
  }
};

const getExistingActivity = async (dealId, row) => {
  try {
    const response = await axios.get(`${BITRIX_URL}/crm.activity.list`, {
      params: {
        FILTER: {
          OWNER_TYPE_ID: 2,
          OWNER_ID: dealId,
          TITLE: `Plano de Ação - Reclamação ID ${row.id_reclamacao}`,
        },
        SELECT: ["ID"],
      },
    });

    return response.data.result?.[0] || null;
  } catch (error) {
    console.error(
      "Erro ao buscar atividade existente:",
      error.response?.data || error.message
    );
    return null;
  }
};

const createActivityForDeal = async (dealId, row) => {
  if (!row.plano_acao || row.plano_acao.trim() === "") {
    return {
      success: false,
      message: `Atividade não criada para o negócio (${dealId}): plano_acao está vazio ou null.`,
    };
  }

  const existingActivity = await getExistingActivity(dealId, row);

  if (existingActivity) {
    return {
      success: false,
      message: `Atividade já existe para o negócio (${dealId}): ${existingActivity.ID}`,
    };
  }

  let deadline = null;
  if (row.data_prazo) {
    try {
      const dateObj = new Date(row.data_prazo);
      if (!isNaN(dateObj.getTime())) {
        deadline = dateObj.toISOString().slice(0, 19);
      } else {
        return {
          success: false,
          message: `Data inválida para o negócio (${dealId}): ${row.data_prazo}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao processar data_prazo para ${dealId}: ${error.message}`,
      };
    }
  }

  if (!deadline) {
    return {
      success: false,
      message: `Atividade não criada para o negócio (${dealId}): data_prazo inválida.`,
    };
  }

  try {
    const response = await axios.post(`${BITRIX_URL}/crm.activity.todo.add`, {
      ownerTypeId: 2,
      ownerId: dealId,
      deadline: deadline,
      title: `Plano de Ação - Reclamação ID ${row.id_reclamacao}`,
      description: row.plano_acao,
      responsibleId: 1,
      colorId: "10",
    });

    return {
      success: true,
      message: "Atividade criada com sucesso",
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: "Erro ao criar atividade",
      error: error.response?.data || error.message,
    };
  }
};

const createOrUpdateDeal = async (row, bitrixStatus) => {
  const title = `${row.tipo_reclamacao} - ID ${row.id_reclamacao}`;
  const existingDeal = await getExistingDeal(title);
  const companyId = await getOrCreateCompanyId(row.cliente, row.email);

  if (!companyId) {
    return {
      success: false,
      message: `Erro ao associar empresa: ${row.cliente}`,
    };
  }

  const formattedObs = formatObservations(row.obs);

  if (existingDeal) {
    if (
      existingDeal.STAGE_ID !== bitrixStatus ||
      existingDeal.STATUS_ID !== bitrixStatus
    ) {
      try {
        await axios.post(`${BITRIX_URL}/crm.deal.update`, {
          id: existingDeal.ID,
          fields: {
            TITLE: title,
            BEGINDATE: row.data_hora_incluido,
            COMPANY_ID: companyId,
            NAME: row.reclamante,
            COMMENTS: `Observação: ${formattedObs}`,
            UF_CRM_1740592978672: row.data_prazo,
            UF_CRM_1740593059509: row.responsavel_plano,
            UF_CRM_1740592837763: row.atendente,
            STATUS_ID: bitrixStatus,
            STAGE_ID: bitrixStatus,
            CATEGORY_ID: "10",
          },
        });

        await createActivityForDeal(existingDeal.ID, row);

        return {
          success: true,
          message: `Negócio (${existingDeal.ID}) atualizado com sucesso.`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Erro ao atualizar negócio ${existingDeal.ID}: ${
            error.response?.data || error.message
          }`,
        };
      }
    } else {
      return {
        success: false,
        message: `Negócio (${existingDeal.ID}) já está atualizado. Nenhuma mudança feita.`,
      };
    }
  } else {
    try {
      const response = await axios.post(`${BITRIX_URL}/crm.deal.add`, {
        fields: {
          TITLE: title,
          BEGINDATE: row.data_hora_incluido,
          COMPANY_ID: companyId,
          NAME: row.reclamante,
          COMMENTS: `Observação: ${formattedObs}`,
          UF_CRM_1740592978672: row.data_prazo,
          UF_CRM_1740593059509: row.responsavel_plano,
          UF_CRM_1740592837763: row.atendente,
          STATUS_ID: bitrixStatus,
          STAGE_ID: bitrixStatus,
          CATEGORY_ID: "1",
        },
      });

      const dealId = response.data.result;

      if (dealId) {
        await createActivityForDeal(dealId, row);
      }

      return {
        success: true,
        message: `Negócio (${dealId}) criado com sucesso.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao criar negócio: ${
          error.response?.data || error.message
        }`,
      };
    }
  }
};

module.exports = { createOrUpdateDeal };
