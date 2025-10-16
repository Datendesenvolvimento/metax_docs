/**
 * Cliente BigQuery para consultas de documentos
 * Mantém fidelidade às queries SQL do script Python
 */

import { BigQuery } from '@google-cloud/bigquery'
import { DocumentoRegistro, CardHistorico } from '@/types/documentos'

// Nome da tabela no BigQuery
const TABELA = "datalake-metax.zz_Disparo_Docs.Cubo_Documentos"

/**
 * Cria e retorna uma instância do cliente BigQuery
 */
export function criarClienteBigQuery(credentialsBase64: string): BigQuery {
  // Decodifica as credenciais do base64
  const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8')
  const credentials = JSON.parse(credentialsJson)
  
  return new BigQuery({
    credentials,
    projectId: credentials.project_id
  })
}

/**
 * Consulta registros da competência alvo
 * Replica: SQL_COMPETENCIA do Python
 */
export async function consultarCompetencia(
  client: BigQuery,
  competencia: string
): Promise<DocumentoRegistro[]> {
  const query = `
    SELECT
      PROJETO,
      COMPETENCIA,
      Competencia_Data,
      DOCUMENTO,
      PRESTADOR,
      CNPJ_PRESTADOR,
      CONTRATO,
      STATUS_GERAL_Regra,
      CRITICO,
      RELEVANCIA,
      DOCUMENTO_APROV_OBS2,
      DOCUMENTO_APROV_REGULARIZA2,
      Chave_Composta,
      email_envio
    FROM \`${TABELA}\`
    WHERE COMPETENCIA = @competencia
  `

  const options = {
    query,
    params: { competencia }
  }

  const [rows] = await client.query(options)
  return rows as DocumentoRegistro[]
}

/**
 * Consulta histórico dos últimos 5 meses com cards
 * Replica: SQL_CARDS do Python
 */
export async function consultarCards(
  client: BigQuery,
  competencia: string
): Promise<CardHistorico[]> {
  const query = `
    WITH referencia AS (
      SELECT DISTINCT Competencia_Data AS data_ref
      FROM \`${TABELA}\`
      WHERE COMPETENCIA = @competencia
      LIMIT 1
    ),
    ultimas_5 AS (
      SELECT DISTINCT t.COMPETENCIA, t.Competencia_Data
      FROM \`${TABELA}\` AS t
      CROSS JOIN referencia r
      WHERE t.Competencia_Data BETWEEN DATE_SUB(r.data_ref, INTERVAL 4 MONTH)
                                  AND r.data_ref
    ),
    base AS (
      SELECT
        PROJETO,
        PRESTADOR,
        CONTRATO,
        COMPETENCIA,

        -- 🔹 Soma total de relevância (com conversão segura)
        SUM(SAFE_CAST(RELEVANCIA AS FLOAT64)) AS relevancia_total,

        -- 🔹 Soma apenas das relevâncias consideradas "conformes"
        SUM(
          CASE
            WHEN (
              (PROJETO IN ('Reparação Bacia do Rio Doce','Samarco - COA')
               AND STATUS_GERAL_Regra = 'Conforme')
              OR (PROJETO NOT IN ('Reparação Bacia do Rio Doce','Samarco - COA')
                  AND STATUS_GERAL_Regra IN ('Conforme','Em Análise'))
            )
            THEN SAFE_CAST(RELEVANCIA AS FLOAT64)
            ELSE 0
          END
        ) AS relevancia_conforme,

        -- 🔹 Contagem total de pendências e críticos
        COUNTIF(STATUS_GERAL_Regra = 'Não Conforme') AS total_pendencias,
        COUNTIF(STATUS_GERAL_Regra = 'Não Conforme' AND SAFE_CAST(CRITICO AS INT64) = 1) AS total_criticos

      FROM \`${TABELA}\`
      WHERE COMPETENCIA IN (SELECT COMPETENCIA FROM ultimas_5)
      GROUP BY PROJETO, PRESTADOR, CONTRATO, COMPETENCIA
    )
    SELECT
      PROJETO,
      PRESTADOR,
      CONTRATO,
      COMPETENCIA,
      total_pendencias,
      total_criticos,
      relevancia_conforme AS perc_atingido
    FROM base
    ORDER BY COMPETENCIA
  `

  const options = {
    query,
    params: { competencia }
  }

  const [rows] = await client.query(options)
  return rows as CardHistorico[]
}

/**
 * Consulta histórico completo de pendências (todas as competências)
 * Replica: SQL_PENDENCIAS_HIST do Python
 */
export async function consultarPendenciasHistoricas(
  client: BigQuery
): Promise<DocumentoRegistro[]> {
  const query = `
    SELECT
      PROJETO,
      COMPETENCIA,
      Competencia_Data,
      DOCUMENTO,
      PRESTADOR,
      CNPJ_PRESTADOR,
      CONTRATO,
      STATUS_GERAL_Regra,
      CRITICO,
      RELEVANCIA,
      DOCUMENTO_APROV_OBS2,
      DOCUMENTO_APROV_REGULARIZA2,
      Chave_Composta,
      email_envio
    FROM \`${TABELA}\`
    WHERE STATUS_GERAL_Regra IN ('Não Conforme', 'Não Enviado')
  `

  const [rows] = await client.query(query)
  return rows as DocumentoRegistro[]
}

/**
 * Testa a conexão com o BigQuery
 */
export async function testarConexao(client: BigQuery): Promise<boolean> {
  try {
    const query = 'SELECT 1 as test'
    await client.query(query)
    return true
  } catch (error) {
    console.error('Erro ao testar conexão BigQuery:', error)
    return false
  }
}

