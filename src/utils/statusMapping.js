const statusMapping = {
  ABERTO: "C10:NEW",
  "EM ATENDIMENTO": "C10:PREPARATION",
  CANCELADA: "C10:LOSE",
  "FINALIZADA - PROCEDE": "C10:WON",
  "FINALIZADA - IMPROCE": "C10:UC_QKHKXE",
};

const getBitrixStatus = (status) => {
  return statusMapping[status] || "NEW";
};

module.exports = { getBitrixStatus };
