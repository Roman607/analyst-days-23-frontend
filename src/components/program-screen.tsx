"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Schedule } from "@/components/schedule";
import { Button } from "@/components/ui/button";
import { downloadRoute } from "@/lib/download-route";
import { dateLabel } from "@/lib/trajectory";
import { useTrajectory } from "@/lib/use-trajectory";

export function ProgramScreen() {
  const { confirmed, request, loadProgram, toggleTopic, act, resetFilter, retryPreview } = useTrajectory();
  const [downloadFailed, setDownloadFailed] = useState(false);
  const loadingProgram = request.kind === "loading-program";
  const loadingPreview = request.kind === "loading-preview";

  async function download() {
    if (!confirmed) return;
    setDownloadFailed(false);
    try {
      await downloadRoute(confirmed);
    } catch {
      setDownloadFailed(true);
    }
  }

  return (
    <main className="page-width program-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Персональная траектория</p>
          <h1 className="program-title">Программа</h1>
          <p className="text-muted">20–21 ноября · Время московское</p>
        </div>
        {confirmed && (
          <div className="download-bar">
            <Button type="button" className="min-h-12 text-base" onClick={download}>
              <Download aria-hidden="true" /> Скачать картинку
            </Button>
          </div>
        )}
      </div>

      {confirmed && (
        <>
          <div className="program-tools">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Темы">
              <span className="mr-1 text-sm font-semibold" aria-hidden="true">Темы</span>
              {confirmed.program.topics.map((topic) => (
                <Button
                  key={topic.id}
                  type="button"
                  variant="chip"
                  disabled={loadingProgram}
                  aria-pressed={confirmed.selection.input.topic_ids.includes(topic.id)}
                  onClick={() => toggleTopic(topic.id)}
                >
                  {topic.name}
                </Button>
              ))}
            </div>
            <Button type="button" variant="outline" disabled={!confirmed.preview.is_custom || loadingProgram} onClick={resetFilter}>
              Обновить по фильтру
            </Button>
          </div>
          <nav className="days-nav" aria-label="Дни программы">
            {confirmed.program.days.map((day) => (
              <a key={day} href={`#day-${day}`}>{dateLabel(day, { day: "numeric", month: "long" })}</a>
            ))}
          </nav>
        </>
      )}

      {(loadingProgram || loadingPreview) && (
        <p className="feedback" role="status">
          {loadingProgram ? "Загружаем программу…" : "Пересчитываем маршрут…"}
        </p>
      )}
      {"message" in request && (
        <div className="feedback feedback-error" role="alert">
          <p>{request.message}</p>
          {request.kind === "program-error" && (
            <Button type="button" variant="outline" onClick={loadProgram}>Повторить загрузку</Button>
          )}
          {request.kind === "stale" && (
            <Button type="button" variant="outline" onClick={loadProgram}>Загрузить новую программу</Button>
          )}
          {request.kind === "preview-error" && (
            <Button type="button" variant="outline" onClick={retryPreview}>Повторить</Button>
          )}
        </div>
      )}
      {downloadFailed && (
        <div className="download-error feedback-error" role="alert">
          Не удалось сохранить PNG. Попробуйте скачать ещё раз.
        </div>
      )}

      {confirmed && <Schedule snapshot={confirmed} disabled={loadingProgram} onAction={act} />}
    </main>
  );
}
