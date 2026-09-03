"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFTheme, ReportMode } from "./ExportPDFModal";
import { DashboardWidgetConfig } from "@/modules/dashboard/WidgetConfigModal";

// Função utilitária para converter imagem do servidor (/cg-logo.png) em Base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Erro ao carregar logo para o PDF:", err);
    return null;
  }
}

export async function generateProfessionalPDF({
  stats,
  config,
  widgets,
}: {
  stats: any;
  config: {
    theme: PDFTheme;
    mode: ReportMode;
  };
  widgets: DashboardWidgetConfig[];
}) {
  if (!stats) return;

  const isDark = config.theme === "DARK";

  // Sempre em formato LANDSCAPE executivo (297mm x 210mm - A4 Landscape)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm

  // Cores vetoriais no formato [R, G, B]
  const bgRGB: [number, number, number] = isDark ? [15, 23, 42] : [255, 255, 255];
  const textRGB: [number, number, number] = isDark ? [248, 250, 252] : [15, 23, 42];
  const mutedRGB: [number, number, number] = isDark ? [148, 163, 184] : [100, 116, 139];
  const cardBgRGB: [number, number, number] = isDark ? [30, 41, 59] : [248, 250, 252];
  const borderRGB: [number, number, number] = isDark ? [51, 65, 85] : [226, 232, 240];
  const primaryRGB: [number, number, number] = [37, 99, 235]; // #2563eb Blue institucional CG

  // Pinta o fundo da página caso seja tema escuro
  function paintBackground() {
    if (isDark) {
      doc.setFillColor(...bgRGB);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
    }
  }
  paintBackground();

  // 1. CARREGAR LOGO CG CONSTRUÇÕES
  const logoData = await loadImageAsBase64("/cg-logo.png");

  // 2. DESENHAR CABEÇALHO EXECUTIVO
  const startX = 14;
  let currentY = 14;

  if (logoData) {
    // Maintain logo aspect ratio — calculate dimensions from image
    const maxLogoH = 12;
    const maxLogoW = 30;
    try {
      const img = new Image();
      img.src = logoData;
      const ratio = img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : 2.2; // fallback ratio
      let logoW = maxLogoH * ratio;
      let logoH = maxLogoH;
      if (logoW > maxLogoW) {
        logoW = maxLogoW;
        logoH = maxLogoW / ratio;
      }
      doc.addImage(logoData, "PNG", startX, currentY, logoW, logoH, undefined, "FAST");
    } catch {
      doc.addImage(logoData, "PNG", startX, currentY, 26, 12, undefined, "FAST");
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...textRGB);
  doc.text("Relatório Executivo de BI & Indicadores de TI", startX + 30, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedRGB);
  doc.text(
    `CG Construções — Departamento de TI | Modo do Relatório: ${config.mode}`,
    startX + 30,
    currentY + 10
  );

  // Bloco direito do cabeçalho
  const nowStr = new Date().toLocaleString("pt-BR");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...textRGB);
  doc.text(`Período: ${stats.periodRange?.label || "Últimos 30 dias"}`, pageWidth - 14, currentY + 4, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedRGB);
  doc.text(`Gerado em: ${nowStr}`, pageWidth - 14, currentY + 9, {
    align: "right",
  });

  // Linha separadora do cabeçalho
  currentY = 28;
  doc.setDrawColor(...primaryRGB);
  doc.setLineWidth(0.6);
  doc.line(startX, currentY, pageWidth - 14, currentY);

  currentY = 35;

  // 3. DESENHAR 6 CARDS DE KPIS MACRO (EM LINHA HORIZONTAL LANDSCAPE)
  const kpis = stats.kpis || {};
  const kpiItems = [
    {
      label: "TOTAL CHAMADOS",
      value: String(kpis.totalTickets?.value || 0),
      sub: typeof kpis.totalTickets?.changePercent === "number"
        ? `${kpis.totalTickets.changePercent >= 0 ? "+" : ""}${kpis.totalTickets.changePercent}% vs ant.`
        : "No período",
    },
    {
      label: "EM ATENDIMENTO",
      value: String(kpis.inProgress?.value || 0),
      sub: "Fila em tratativa",
    },
    {
      label: "CONCLUÍDOS",
      value: String(kpis.completed?.value || 0),
      sub: `Taxa: ${
        kpis.totalTickets?.value > 0
          ? Math.round(((kpis.completed?.value || 0) / kpis.totalTickets.value) * 100)
          : 0
      }%`,
    },
    {
      label: "PENDENTES",
      value: String(kpis.waiting?.value || 0),
      sub: `+ ${kpis.scheduled?.value || 0} agendados`,
    },
    {
      label: "TEMPO MÉDIO GERAL",
      value: String(kpis.avgTimeMinutes?.formatted || "0 min"),
      sub: "Abertura à resolução",
    },
    {
      label: "TÉCNICOS ATIVOS",
      value: String(kpis.activeTechCount?.value || 0),
      sub: "Equipe habilitada",
    },
  ];

  const kpiWidth = 42;
  const kpiHeight = 19;
  const kpiGap = (pageWidth - 28 - kpiWidth * 6) / 5;

  kpiItems.forEach((item, idx) => {
    const cardX = startX + idx * (kpiWidth + kpiGap);

    // Retângulo com cantos arredondados
    doc.setFillColor(...cardBgRGB);
    doc.setDrawColor(...borderRGB);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, kpiWidth, kpiHeight, 2, 2, "FD");

    // Rótulo superior do KPI
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...mutedRGB);
    doc.text(item.label, cardX + 4, currentY + 5);

    // Valor Principal do KPI
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...textRGB);
    doc.text(item.value, cardX + 4, currentY + 12);

    // Subtítulo do KPI
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...mutedRGB);
    doc.text(item.sub, cardX + 4, currentY + 16.5);
  });

  currentY += 26;

  // 4. TABELAS DE RANKING (TOP TÉCNICOS & TOP SERVIÇOS EM DUAS COLUNAS LADO A LADO)
  const rankings = stats.rankings || {};
  const topTechRows = (rankings.topTechnicians || []).map((t: any, i: number) => [
    `${i + 1}º`,
    t.name,
    String(t.count),
    `${t.avgTimeMinutes} min`,
  ]);
  const topServiceRows = (rankings.topServices || []).map((s: any) => [
    s.name,
    String(s.count),
    `${s.percentage}%`,
  ]);

  const colWidth1 = 130;
  const colWidth2 = 130;
  const colX2 = pageWidth - 14 - colWidth2;

  // Tabela 1: Top Técnicos em Resolução (Esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textRGB);
  doc.text("Ranking — Top Técnicos em Resolução", startX, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: startX },
    tableWidth: colWidth1,
    head: [["#", "Analista TI", "Resolvidos", "Tempo Médio"]],
    body: topTechRows.length > 0 ? topTechRows : [["-", "Sem registros no período", "0", "-"]],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textRGB,
      fillColor: cardBgRGB,
      lineColor: borderRGB,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: isDark ? [51, 65, 85] : [241, 245, 249],
      textColor: isDark ? [248, 250, 252] : [51, 65, 85],
      fontStyle: "bold",
    },
  });

  // Tabela 2: Top Serviços Acionados (Direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textRGB);
  doc.text("Ranking — Top Serviços mais Acionados", colX2, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: colX2 },
    tableWidth: colWidth2,
    head: [["Serviço", "Volume", "% Part."]],
    body: topServiceRows.length > 0 ? topServiceRows : [["Sem registros no período", "0", "0%"]],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textRGB,
      fillColor: cardBgRGB,
      lineColor: borderRGB,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: isDark ? [51, 65, 85] : [241, 245, 249],
      textColor: isDark ? [248, 250, 252] : [51, 65, 85],
      fontStyle: "bold",
    },
  });

  // 5. SEGUNDA PÁGINA: WIDGETS POR MODO DE RELATÓRIO SELECIONADO
  doc.addPage("a4", "landscape");
  paintBackground();

  let page2Y = 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...textRGB);
  doc.text(`Consolidado de Indicadores Analíticos (${config.mode})`, startX, page2Y);

  page2Y += 8;

  const charts = stats.charts || {};
  const modeWidgets = widgets.filter((w) => {
    if (!w.visible) return false;
    if (config.mode === "EXECUTIVO") {
      return ["bySector", "byOrigin", "byMonth", "byStatus"].includes(w.id);
    }
    if (config.mode === "OPERACIONAL") {
      return ["byStatus", "byDay", "byWeek", "byService", "byOrigin"].includes(w.id);
    }
    if (config.mode === "PRODUTIVIDADE") {
      return ["byTechnician", "avgTimeByTechnician", "byService"].includes(w.id);
    }
    if (config.mode === "PERFORMANCE") {
      return ["avgTimeByTechnician", "avgTimeByService", "avgTimeBySector", "byDay"].includes(w.id);
    }
    return true; // PERSONALIZADO exibe todos os habilitados
  });

  // Agrupamento Inteligente: em grid de 2 colunas horizontais (130mm cada) por página Landscape
  const cardW = 130;
  const cardHGap = (pageWidth - 28 - cardW * 2);

  for (let i = 0; i < modeWidgets.length; i++) {
    const widget = modeWidgets[i];
    const chartData = charts[widget.id] || [];
    const unit = widget.id.startsWith("avgTime") ? "min" : "chamados";
    const topData = chartData.slice(0, 7);

    const isRightCol = i % 2 === 1;
    const tableX = isRightCol ? startX + cardW + cardHGap : startX;

    // Se precisamos de uma nova página após duas linhas (4 tabelas)
    if (i > 0 && i % 4 === 0) {
      doc.addPage("a4", "landscape");
      paintBackground();
      page2Y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...textRGB);
    doc.text(widget.title, tableX, page2Y);

    const rows = topData.map((row: any) => [
      row.name || row.label || row.displayLabel || "-",
      `${row.value ?? row.total ?? 0} ${unit}`,
      row.percentage ? `${row.percentage}%` : "-",
    ]);

    autoTable(doc, {
      startY: page2Y + 2,
      margin: { left: tableX },
      tableWidth: cardW,
      head: [["Indicador / Item", `Valor (${unit})`, "% Part."]],
      body: rows.length > 0 ? rows : [["Sem dados no período", "0", "-"]],
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: textRGB,
        fillColor: cardBgRGB,
        lineColor: borderRGB,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: isDark ? [51, 65, 85] : [241, 245, 249],
        textColor: isDark ? [248, 250, 252] : [51, 65, 85],
        fontStyle: "bold",
      },
    });

    if (isRightCol) {
      page2Y += 60; // Desce para a próxima linha na mesma página
    }
  }

  // 6. DESENHAR RODAPÉ INSTITUCIONAL EM TODAS AS PÁGINAS DO PDF
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    const footerY = pageHeight - 12;
    doc.setDrawColor(...borderRGB);
    doc.setLineWidth(0.3);
    doc.line(startX, footerY - 4, pageWidth - 14, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedRGB);

    // Esquerda do rodapé
    doc.text(
      "CG Construções — Departamento de TI | Gerado automaticamente pelo HelpDesk Pro",
      startX,
      footerY
    );

    // Direita do rodapé
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - 14, footerY, {
      align: "right",
    });
  }

  // 7. DISPARAR DONWLOAD DIRETO IMEDIATO DO ARQUIVO PDF VETORIAL (SEM JANELAS OU PRINT DO NAVEGADOR)
  const filename = `CG_Construcoes_HelpDesk_${config.mode}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}
