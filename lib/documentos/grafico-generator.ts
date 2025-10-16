/**
 * Gerador de gráficos de pendências
 * Mantém fidelidade ao estilo do script Python (matplotlib)
 */

import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { ChartConfiguration } from 'chart.js'
import { HistoricoMensal } from '@/types/documentos'

// Paleta de cores Meta.X (do script Python)
const COR_PRINCIPAL = "#001847"
const COR_LINHA_FORTE = "#1E3A8A"
const COR_LINHA_SUAVE = "#93C5FD"

/**
 * Gera gráfico de pendências dos últimos 5 meses
 * Replica: gerar_grafico do Python
 */
export async function gerarGraficoPendencias(
  historico: HistoricoMensal[]
): Promise<Buffer | null> {
  if (!historico || historico.length === 0) {
    return null
  }

  // Ordena por competência e extrai dados
  const dadosOrdenados = [...historico].sort((a, b) => 
    a.COMPETENCIA.localeCompare(b.COMPETENCIA)
  )

  const competencias = dadosOrdenados.map(d => d.COMPETENCIA)
  const pendencias = dadosOrdenados.map(d => d.total_pendencias)

  // Configuração do canvas (mesmas dimensões do Python)
  const width = 832 // 5.2 * 160 dpi
  const height = 352 // 2.2 * 160 dpi
  
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width, 
    height,
    backgroundColour: 'transparent'
  })

  // Configuração do gráfico (estilo similar ao matplotlib)
  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: competencias,
      datasets: [
        {
          label: 'Pendências',
          data: pendencias,
          borderColor: COR_LINHA_FORTE,
          backgroundColor: COR_LINHA_SUAVE + '33', // 20% opacity
          borderWidth: 3,
          fill: true,
          tension: 0.4, // Linha suave (similar ao spline do Python)
          pointBackgroundColor: COR_PRINCIPAL,
          pointBorderColor: COR_PRINCIPAL,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Pendências nas últimas competências',
          color: COR_PRINCIPAL,
          font: {
            size: 16,
            weight: 'normal'
          },
          padding: {
            bottom: 15
          }
        },
        legend: {
          display: false // Remove legenda (igual ao Python)
        },
        tooltip: {
          enabled: true,
          backgroundColor: COR_PRINCIPAL,
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Pendências: ${context.parsed.y}`
            }
          }
        }
      },
      scales: {
        y: {
          display: true,
          grid: {
            display: true,
            color: '#E5E7EB40', // Grid suave
            lineWidth: 1
          },
          ticks: {
            display: true,
            color: '#6B7280',
            font: {
              size: 11
            }
          },
          beginAtZero: true
        },
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: '#374151',
            font: {
              size: 13
            }
          },
          border: {
            display: true,
            color: '#D1D5DB'
          }
        }
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 15,
          right: 15
        }
      },
      // Plugin para adicionar labels nos pontos (igual ao Python)
      animation: false
    },
    plugins: [{
      id: 'dataLabels',
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex)
          if (!meta.hidden) {
            meta.data.forEach((element, index) => {
              // Desenha o valor acima do ponto
              const data = dataset.data[index] as number
              const x = element.x
              const y = element.y - 15 // Offset para cima
              
              ctx.fillStyle = COR_PRINCIPAL
              ctx.font = 'bold 13px Arial'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'bottom'
              ctx.fillText(String(data), x, y)
            })
          }
        })
      }
    }]
  }

  // Gera o buffer da imagem PNG
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration)
  return buffer
}

/**
 * Converte buffer de imagem para base64
 */
export function bufferParaBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

