const axios = require("axios");
const { BITRIX_URL } = require("../config/bitrix");
const formatObservations = require("../utils/formatObs");

;

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

const getOrCreateContactId = async (email, name, fieldsToUpdate = {}) => {
  try {
    const response = await axios.get(`${BITRIX_URL}/crm.contact.list`, {
      params: { FILTER: { EMAIL: email }, SELECT: ["ID"] },
    });
    const contact = response.data.result?.[0];

    if (contact) {
      await updateContact(contact.ID, fieldsToUpdate);
      return contact.ID;
    }

    const createResponse = await axios.post(`${BITRIX_URL}/crm.contact.add`, {
      fields: {
        NAME: name,
        EMAIL: [{ VALUE: email, VALUE_TYPE: "WORK" }],
        ...fieldsToUpdate,
      },
    });
    return createResponse.data.result || null;
  } catch (error) {
    console.error(
      "Erro ao buscar/criar contato:",
      error.response?.data || error.message
    );
    return null;
  }
};

const getOrCreateCompanyId = async (companyName) => {
  try {
    const response = await axios.get(`${BITRIX_URL}/crm.company.list`, {
      params: { FILTER: { TITLE: companyName }, SELECT: ["ID"] },
    });
    const company = response.data.result?.[0];

    if (company) {
      return company.ID;
    }

    const createResponse = await axios.post(`${BITRIX_URL}/crm.company.add`, {
      fields: { TITLE: companyName },
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

const updateContact = async (contactId, fields) => {
  try {
    await axios.post(`${BITRIX_URL}/crm.contact.update`, {
      id: contactId,
      fields,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar contato:",
      error.response?.data || error.message
    );
  }
};

const createOrUpdateDeal = async (row, bitrixStatus) => {
  const title = `${row.tipo_reclamacao} - ID ${row.id_reclamacao}`;
  const existingDeal = await getExistingDeal(title);
  const contactId = await getOrCreateContactId(row.email, row.reclamante, {
    PHONE: [{ VALUE: row.telefone, VALUE_TYPE: "WORK" }],
  });
  const companyId = await getOrCreateCompanyId(row.empresa);

  if (!contactId) {
    return {
      success: false,
      message: `Erro ao associar contato: ${row.cliente}`,
    };
  }

  const formattedObs = formatObservations(row.obs);
  const dealFields = {
    TITLE: title,
    BEGINDATE: row.data_hora_incluido,
    CONTACT_ID: contactId,
    COMPANY_ID: companyId,
    COMMENTS: `Observação: ${formattedObs}`,
    UF_CRM_1740592978672: row.data_prazo,
    UF_CRM_1740593059509: row.responsavel_plano,
    UF_CRM_1740592837763: row.atendente,
    UF_CRM_1740658224474: row.protocolo,
    UF_CRM_1740658862035: row.acao_imediata,
    UF_CRM_1740659501570: row.atendente_email,
    UF_CRM_1740682751557: row.id_remessa,
    UF_CRM_1740683175156: row.plano_acao,
    UF_CRM_1740690771499: row.cliente,
    STATUS_ID: bitrixStatus,
    STAGE_ID: bitrixStatus,
    CATEGORY_ID: "1",
  };

  try {
    if (existingDeal) {
      await axios.post(`${BITRIX_URL}/crm.deal.update`, {
        id: existingDeal.ID,
        fields: dealFields,
      });
      return {
        success: true,
        message: `Negócio (${existingDeal.ID}) atualizado com sucesso.`,
      };
    }

    const response = await axios.post(`${BITRIX_URL}/crm.deal.add`, {
      fields: dealFields,
    });
    return {
      success: true,
      message: `Negócio (${response.data.result}) criado com sucesso.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao criar/atualizar negócio: ${
        error.response?.data || error.message
      }`,
    };
  }
};

module.exports = { createOrUpdateDeal };
