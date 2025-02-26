const formatObservations = (obs) => {
  if (!obs) return "";

  const obsArray = obs.split("--").map((item) => item.trim());

  return obsArray
    .map((item, index) => (index === 0 ? item : `Nova Observação: ${item}`))
    .join("\n");
};

module.exports = formatObservations;
