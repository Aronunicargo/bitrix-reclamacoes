const { getConnection } = require("../config/database");

const fetchReclamacoes = async () => {
  const connection = await getConnection();
  const [rows] = await connection.execute(`
        SELECT
        r.id_reclamacao,
        rr.id_remessa,
        r.id_cliente,
        r.email,
        f.fantasia AS cliente,
        r.protocolo,
        tr.reclamacao AS tipo_reclamacao,
        r.reclamante,
        u.primeiro_nome AS atendente,
        u2.nome_completo AS responsavel_plano,
        DATE_FORMAT(CONVERT_TZ(r.data_prazo, '+00:00', '-03:00'), '%Y-%m-%dT%H:%i:%s') AS data_prazo,
        r.obs,
        r.plano_acao,
        r.causa_raiz,
        r.acao_imediata,
        rr.id_remessa,
        u.email  AS  atendente_email,
        sr.descricao AS status,
        CONCAT(r.data_incluido, ' ', r.hora_incluido) AS data_hora_incluido,
        GROUP_CONCAT(DISTINCT rh.data ORDER BY rh.data SEPARATOR ' --') AS data_historico,
        GROUP_CONCAT(DISTINCT rh.obs ORDER BY rh.data SEPARATOR '--') AS obs,
        GROUP_CONCAT(DISTINCT u3.nome_completo SEPARATOR ', ') AS usuario_historico
        FROM reclamacao r
        LEFT JOIN fornecedores f ON f.id_local = r.id_cliente
        LEFT JOIN tipo_reclamacao tr ON tr.id_tipo = r.tipo_reclamacao
        LEFT JOIN status_reclamacao sr ON sr.id_status = r.status
        LEFT JOIN usuarios u ON u.id_usuario = r.atendente
        LEFT JOIN reclamacao_remessa rr ON rr.id_reclamacao = r.id_reclamacao
        LEFT JOIN usuarios u2 ON u2.id_usuario = r.resp_prazo
        LEFT JOIN reclamacao_historico rh ON rh.id_reclamacao = r.id_reclamacao
        LEFT JOIN usuarios u3 ON u3.id_usuario = rh.operador
        GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
        ORDER BY r.data_incluido DESC
        LIMIT 10;

  `);
  await connection.end();
  return rows;
};

module.exports = { fetchReclamacoes };
