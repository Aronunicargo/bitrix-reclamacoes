// const statusMapping = {
//   ABERTO: "C1:NEW",
//   "EM ATENDIMENTO": "C1:PREPARATION",
//   CANCELADA: "C1:LOSE",
//   "FINALIZADA - PROCEDE": "C1:WON",
//   "FINALIZADA - IMPROCE": "C1:PREPAYMENT_INVOIC",
// };
const statusMapping = {
  "ABERTO": "C10:NEW",
  "EM ATENDIMENTO": "C10:PREPARATION",
  "CANCELADA": "C10:LOSE",
  "FINALIZADA - PROCEDE": "C10:WON",
  "FINALIZADA - IMPROCE": "C10:UC_QKHKXE",
};

const getBitrixStatus = (status) => {
  return statusMapping[status] || "NEW";
};

module.exports = { getBitrixStatus };
