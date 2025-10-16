'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { FileText, Send, Loader2, CheckCircle2, XCircle, Calendar, Eye, X } from 'lucide-react'
import { ContratoParaEnvio } from '@/types/documentos'

export default function DocumentosPage() {
  const [competencia, setCompetencia] = useState('')
  const [contratos, setContratos] = useState<ContratoParaEnvio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<ContratoParaEnvio | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  /**
   * Consulta contratos do BigQuery para a competência selecionada
   */
  const handleConsultar = async () => {
    if (!competencia) {
      setErro('Por favor, selecione uma competência')
      return
    }

    setCarregando(true)
    setErro(null)
    setResultado(null)
    
    try {
      const response = await fetch('/api/documentos/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencia })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar dados')
      }

      setContratos(data.contratos.map((c: ContratoParaEnvio) => ({ ...c, selecionado: false })))
      
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao consultar dados')
      setContratos([])
    } finally {
      setCarregando(false)
    }
  }

  /**
   * Visualiza prévia do e-mail
   */
  const handlePreview = async (contrato: ContratoParaEnvio) => {
    setPreviewing(contrato)
    setLoadingPreview(true)
    setPreviewHtml('')

    try {
      const response = await fetch('/api/documentos/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto: contrato.projeto,
          prestador: contrato.prestador,
          contrato: contrato.contrato,
          competencia: contrato.competencia
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar prévia')
      }

      setPreviewHtml(data.html)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar prévia')
      setPreviewing(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  /**
   * Fecha o modal de prévia
   */
  const closePreview = () => {
    setPreviewing(null)
    setPreviewHtml('')
  }

  /**
   * Envia e-mails para os contratos selecionados
   */
  const handleEnviar = async () => {
    const selecionados = contratos.filter(c => c.selecionado)
    
    if (selecionados.length === 0) {
      setErro('Selecione pelo menos um contrato para enviar')
      return
    }

    setEnviando(true)
    setErro(null)
    setResultado(null)

    try {
      const envios = selecionados.map(c => ({
        projeto: c.projeto,
        prestador: c.prestador,
        contrato: c.contrato,
        competencia: c.competencia,
        emails: c.email_envio.split(/[;,]/).map(e => e.trim()).filter(e => e)
      }))

      const response = await fetch('/api/documentos/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envios })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar e-mails')
      }

      setResultado(data)
      
      // Limpa seleção após envio bem-sucedido
      if (data.total_enviados > 0) {
        setContratos(prev => prev.map(c => ({ ...c, selecionado: false })))
      }

    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar e-mails')
    } finally {
      setEnviando(false)
    }
  }

  /**
   * Alterna seleção de um contrato
   */
  const toggleContrato = (index: number) => {
    setContratos(prev => prev.map((c, i) => 
      i === index ? { ...c, selecionado: !c.selecionado } : c
    ))
  }

  /**
   * Seleciona/deseleciona todos os contratos
   */
  const toggleTodos = () => {
    const todosSelecionados = contratos.every(c => c.selecionado)
    setContratos(prev => prev.map(c => ({ ...c, selecionado: !todosSelecionados })))
  }

  /**
   * Retorna cor baseada na legenda
   */
  const getCorLegenda = (legenda: string): string => {
    const cores: Record<string, string> = {
      "Atende": "text-green-600 bg-green-50",
      "Atende Parcial": "text-yellow-600 bg-yellow-50",
      "Não Atende": "text-red-600 bg-red-50",
      "Crítico": "text-red-900 bg-red-100",
      "Baixa Performance": "text-orange-600 bg-orange-50",
      "Sem dados": "text-gray-600 bg-gray-50"
    }
    return cores[legenda] || "text-gray-600 bg-gray-50"
  }

  const totalSelecionados = contratos.filter(c => c.selecionado).length

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-metax-light min-h-screen p-6 rounded-lg">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-metax-primary to-metax-secondary text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Pendências de Documentos
              </h1>
              <p className="mt-2 text-blue-100">
                Consulte e envie relatórios de pendências por competência
              </p>
            </div>
          </div>
        </div>

        {/* Card de seleção de competência */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Selecionar Competência
            </h2>
          </div>

          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 max-w-xs min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competência (YYYY-MM)
              </label>
              <input
                type="month"
                value={competencia}
                onChange={(e) => {
                  console.log('Competência selecionada:', e.target.value)
                  setCompetencia(e.target.value)
                  setErro(null)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-metax-secondary focus:border-transparent"
                placeholder="2025-09"
              />
              {competencia && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Competência: {competencia}
                </p>
              )}
            </div>
            <button
              onClick={handleConsultar}
              disabled={carregando || !competencia}
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 transition-colors shadow-md font-semibold ${
                competencia && !carregando 
                  ? 'bg-metax-secondary hover:bg-metax-primary cursor-pointer' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              title={!competencia ? 'Selecione uma competência primeiro' : 'Clique para consultar'}
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Consultar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensagens de erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Erro</h3>
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          </div>
        )}

        {/* Resultado do envio */}
        {resultado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  E-mails Enviados com Sucesso
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {resultado.total_enviados} e-mail(s) enviado(s) com sucesso
                  {resultado.total_erros > 0 && ` • ${resultado.total_erros} erro(s)`}
                </p>
                
                {resultado.erros && resultado.erros.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium text-red-800">Erros:</p>
                    {resultado.erros.map((err: any, idx: number) => (
                      <p key={idx} className="text-xs text-red-700">
                        • {err.prestador} - {err.contrato}: {err.erro}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de contratos */}
        {contratos.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Contratos Encontrados ({contratos.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {totalSelecionados} selecionado(s)
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleTodos}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {contratos.every(c => c.selecionado) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                  <button
                    onClick={handleEnviar}
                    disabled={enviando || totalSelecionados === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-md font-semibold"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Selecionados ({totalSelecionados})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={contratos.length > 0 && contratos.every(c => c.selecionado)}
                        onChange={toggleTodos}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prestador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contrato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projeto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendências
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Atingido
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contratos.map((contrato, index) => (
                    <tr
                      key={`${contrato.prestador}-${contrato.contrato}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        contrato.selecionado ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={contrato.selecionado || false}
                          onChange={() => toggleContrato(index)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contrato.prestador}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contrato.email_envio}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contrato.contrato}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {contrato.projeto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {contrato.total_documentos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-medium ${
                          contrato.total_pendencias > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {contrato.total_pendencias}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                        {(contrato.perc_atingido * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getCorLegenda(contrato.legenda)
                        }`}>
                          {contrato.legenda}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handlePreview(contrato)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-metax-secondary text-white text-xs font-medium rounded-lg hover:bg-metax-primary transition-colors shadow-sm"
                          title="Visualizar prévia do e-mail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Prévia
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!carregando && contratos.length === 0 && competencia && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-600">
              Não foram encontrados contratos para a competência selecionada.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Prévia */}
      {previewing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={closePreview}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-metax-primary to-metax-secondary px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-6 h-6 text-white" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Prévia do E-mail
                      </h3>
                      <p className="text-sm text-blue-100 mt-0.5">
                        {previewing.prestador} - {previewing.contrato}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePreview}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-gray-100 p-4 max-h-[70vh] overflow-y-auto">
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-metax-secondary mx-auto mb-3" />
                      <p className="text-gray-600">Gerando prévia do e-mail...</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[65vh] border-0"
                      title="Prévia do E-mail"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Esta é uma prévia de como o e-mail será enviado
                </p>
                <button
                  onClick={closePreview}
                  className="px-4 py-2 bg-metax-secondary text-white rounded-lg hover:bg-metax-primary transition-colors font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
