"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const TOUR_STEPS = [
  {
    target: "how-to",
    title: "Tour sempre disponível",
    description: "Use o botão Como usar sempre que quiser rever este passo a passo.",
  },
  {
    target: "dashboard-intro",
    title: "Visão geral da gestão",
    description: "Aqui você acompanha as notas abertas somente dos equipamentos classificados como críticos.",
  },
  {
    target: "filters",
    title: "Refine o recorte",
    description: "Combine equipamento, local, período, status, impacto ou a busca por número, descrição e ordem.",
  },
  {
    target: "critical-filter",
    title: "Equipamentos críticos",
    description: "Clique neste card para voltar ao recorte completo dos equipamentos críticos.",
  },
  {
    target: "urgent-filter",
    title: "Notas urgentes",
    description: "Clique para mostrar apenas as notas urgentes nos indicadores, gráficos e tabela.",
  },
  {
    target: "charts",
    title: "Distribuição e criticidade",
    description: "Os gráficos mostram onde estão as notas. Clique em um equipamento para filtrar todo o painel.",
  },
  {
    target: "notes-table",
    title: "Detalhes das notas",
    description: "A tabela reúne o resultado do recorte. Clique em uma nota para abrir todos os seus campos.",
  },
  {
    target: "critical-admin",
    title: "Cadastro de equipamentos",
    description: "Nesta área o administrador define quais equipamentos entram no monitoramento crítico.",
  },
  {
    target: "excel-import",
    title: "Atualização da base",
    description: "Use esta opção para validar e carregar uma nova planilha Excel. A conexão com SharePoint será incorporada depois.",
  },
] as const;

const PENDING_TOUR_KEY = "preditiva-pending-tour";
const SPOTLIGHT_MARGIN = 7;
const TOOLTIP_WIDTH = 360;
const TOOLTIP_HEIGHT_ESTIMATE = 245;

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
};

function targetRect(target: string): SpotlightRect | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(SPOTLIGHT_MARGIN, rect.top - SPOTLIGHT_MARGIN),
    left: Math.max(SPOTLIGHT_MARGIN, rect.left - SPOTLIGHT_MARGIN),
    width: Math.min(window.innerWidth - SPOTLIGHT_MARGIN * 2, rect.width + SPOTLIGHT_MARGIN * 2),
    height: Math.min(window.innerHeight - SPOTLIGHT_MARGIN * 2, rect.height + SPOTLIGHT_MARGIN * 2),
    bottom: Math.min(window.innerHeight - SPOTLIGHT_MARGIN, rect.bottom + SPOTLIGHT_MARGIN),
  };
}

export function GuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const closeTour = useCallback(() => {
    setStepIndex(null);
    setSpotlight(null);
  }, []);

  const startTour = useCallback(() => {
    if (pathname !== "/dashboard") {
      sessionStorage.setItem(PENDING_TOUR_KEY, "1");
      router.push("/dashboard");
      return;
    }
    setStepIndex(0);
  }, [pathname, router]);

  useEffect(() => {
    if (pathname === "/dashboard" && sessionStorage.getItem(PENDING_TOUR_KEY) === "1") {
      sessionStorage.removeItem(PENDING_TOUR_KEY);
      const frame = window.requestAnimationFrame(() => setStepIndex(0));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [pathname]);

  useEffect(() => {
    if (stepIndex === null) return;
    const step = TOUR_STEPS[stepIndex];
    const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!element) {
      const frame = window.requestAnimationFrame(() => setSpotlight(null));
      return () => window.cancelAnimationFrame(frame);
    }

    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const updatePosition = () => setSpotlight(targetRect(step.target));
    const frame = window.requestAnimationFrame(updatePosition);
    const timer = window.setTimeout(updatePosition, 420);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [stepIndex]);

  useEffect(() => {
    if (stepIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight") {
        setStepIndex((current) => current === null || current >= TOUR_STEPS.length - 1 ? current : current + 1);
      }
      if (event.key === "ArrowLeft") {
        setStepIndex((current) => current === null || current <= 0 ? current : current - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTour, stepIndex]);

  const activeStep = stepIndex === null ? null : TOUR_STEPS[stepIndex];
  const activeStepIndex = stepIndex ?? 0;
  const availableWidth = activeStep ? Math.min(TOOLTIP_WIDTH, window.innerWidth - 32) : TOOLTIP_WIDTH;
  const tooltipLeft = spotlight
    ? Math.min(
      window.innerWidth - availableWidth - 16,
      Math.max(16, spotlight.left + spotlight.width / 2 - availableWidth / 2),
    )
    : 16;
  const tooltipTop = spotlight
    ? spotlight.bottom + TOOLTIP_HEIGHT_ESTIMATE <= window.innerHeight
      ? spotlight.bottom + 16
      : Math.max(16, spotlight.top - TOOLTIP_HEIGHT_ESTIMATE)
    : 16;

  return (
    <>
      <button className="how-to-button" type="button" data-tour="how-to" onClick={startTour} aria-haspopup="dialog">
        <CircleHelp size={16} aria-hidden="true" /> Como usar
      </button>
      {activeStep && createPortal(
        <div className="guided-tour" aria-live="polite">
          <div className="tour-interaction-shield" aria-hidden="true" />
          {spotlight && <div className="tour-spotlight" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} aria-hidden="true" />}
          <section
            className="tour-tooltip"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            aria-describedby="tour-description"
            style={{ top: tooltipTop, left: tooltipLeft, width: availableWidth }}
          >
            <div className="tour-tooltip-heading">
              <span>PASSO {activeStepIndex + 1} DE {TOUR_STEPS.length}</span>
              <button type="button" onClick={closeTour} aria-label="Fechar tutorial"><X size={17} /></button>
            </div>
            <h2 id="tour-title">{activeStep.title}</h2>
            <p id="tour-description">{activeStep.description}</p>
            <div className="tour-progress" aria-hidden="true"><span style={{ width: `${(activeStepIndex + 1) / TOUR_STEPS.length * 100}%` }} /></div>
            <footer className="tour-actions">
              <button className="tour-skip" type="button" onClick={closeTour}>Pular tutorial</button>
              <div>
                <button type="button" disabled={activeStepIndex === 0} onClick={() => setStepIndex((current) => current === null ? null : Math.max(0, current - 1))}><ChevronLeft size={16} /> Anterior</button>
                {activeStepIndex < TOUR_STEPS.length - 1
                  ? <button className="tour-next" type="button" onClick={() => setStepIndex(activeStepIndex + 1)}>Próximo <ChevronRight size={16} /></button>
                  : <button className="tour-next" type="button" onClick={closeTour}>Concluir</button>}
              </div>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
