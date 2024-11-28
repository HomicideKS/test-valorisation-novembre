import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ValuationResult, ValuationMethod, Currency, Scenario } from '../types';
import { Chart } from 'chart.js/auto';

const methodLabels: Record<ValuationMethod, string> = {
  eps: 'EPS',
  ocf: 'OCF/Action',
  fcf: 'FCF/Action'
};

const scenarioLabels: Record<Scenario, string> = {
  pessimistic: 'Pessimiste',
  neutral: 'Neutre',
  optimistic: 'Optimiste'
};

const formatCurrency = (value: number | null, currency: Currency): string => {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number | null): string => {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(value / 100);
};

const generateChartImage = async (
  result: ValuationResult,
  method: ValuationMethod
): Promise<string> => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: result.years,
      datasets: [
        {
          label: `${methodLabels[method]} - Base`,
          data: result.projectedValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
        },
        ...(result.scenarioResults ? [
          {
            label: 'Pessimiste',
            data: result.scenarioResults.pessimistic.projectedValues,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
          },
          {
            label: 'Optimiste',
            data: result.scenarioResults.optimistic.projectedValues,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ] : []),
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Projection ${methodLabels[method]}`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value as number, result.inputs.currency),
          },
        },
      },
    },
  });

  return canvas.toDataURL('image/png');
};

export const generatePDF = async (
  results: Record<ValuationMethod, ValuationResult | null>,
  activeMethod: ValuationMethod,
  companyName: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(24);
  doc.text('Rapport de Valorisation', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text(companyName, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(12);
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Date: ${date}`, pageWidth / 2, 40, { align: 'center' });

  // Summary Table
  const activeResult = results[activeMethod];
  if (activeResult) {
    const { currency } = activeResult.inputs;
    
    const summaryData = [
      ['Prix Actuel', formatCurrency(activeResult.currentPrice, currency)],
      ['Prix Juste', formatCurrency(activeResult.fairValue, currency)],
      ['Marge de Sécurité', formatPercentage(activeResult.safetyMargin)],
      ['Croissance Estimée', `${activeResult.inputs.estimatedGrowth}%`],
      ['CAGR Souhaité', `${activeResult.inputs.desiredCagr}%`],
      ['Multiple Terminal', `${activeResult.inputs.terminalMultiple}x`],
      ['Années de Projection', activeResult.inputs.yearsToProject.toString()]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Métrique', 'Valeur']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [63, 102, 241] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
  }

  // Scenarios Table
  if (activeResult?.scenarioResults) {
    const scenariosData = Object.entries(activeResult.scenarioResults).map(([scenario, data]) => [
      scenarioLabels[scenario as Scenario],
      formatCurrency(data.fairValue, activeResult.inputs.currency),
      formatPercentage(data.safetyMargin),
      `${activeResult.inputs.scenarios?.[scenario as Scenario].estimatedGrowth}%`,
      `${activeResult.inputs.scenarios?.[scenario as Scenario].terminalMultiple}x`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Scénario', 'Prix Juste', 'Marge de Sécurité', 'Croissance', 'Multiple']],
      body: scenariosData,
      theme: 'striped',
      headStyles: { fillColor: [63, 102, 241] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
  }

  // Valuation Methods Comparison
  const methodsData = Object.entries(results)
    .filter(([_, result]) => result !== null)
    .map(([method, result]) => {
      if (!result) return [];
      return [
        methodLabels[method as ValuationMethod],
        formatCurrency(result.fairValue, result.inputs.currency),
        formatPercentage(result.safetyMargin),
        `${result.inputs.terminalMultiple}x`
      ];
    });

  if (methodsData.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Méthode', 'Prix Juste', 'Marge de Sécurité', 'Multiple']],
      body: methodsData,
      theme: 'striped',
      headStyles: { fillColor: [63, 102, 241] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
  }

  // Add Charts
  if (activeResult) {
    // Add a new page for charts
    doc.addPage();
    
    try {
      // Generate and add the metric projection chart
      const chartImage = await generateChartImage(activeResult, activeMethod);
      const imgWidth = 180;
      const imgHeight = 90;
      doc.addImage(chartImage, 'PNG', 15, 20, imgWidth, imgHeight);
      
      doc.setFontSize(14);
      doc.text('Projections par Scénario', pageWidth / 2, 15, { align: 'center' });
    } catch (error) {
      console.error('Error generating chart:', error);
      doc.setFontSize(12);
      doc.setTextColor(255, 0, 0);
      doc.text('Error: Could not generate chart', 15, 20);
      doc.setTextColor(0, 0, 0);
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(10);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`valorisation-${companyName.toLowerCase().replace(/\s+/g, '-')}-${date}.pdf`);
};