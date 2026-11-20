"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError, getPreview, getProgram, readSelection, storeSelection,
  type Action, type Confirmed, type PreviewRequest, type Program, type Selection,
} from "@/lib/trajectory";

type RequestState =
  | { kind: "idle" | "loading-program" | "loading-preview" }
  | { kind: "program-error" | "stale" | "invalid"; message: string }
  | { kind: "preview-error"; message: string; selection: Selection };

export function useTrajectory() {
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [request, setRequest] = useState<RequestState>({ kind: "loading-program" });
  const current = useRef<Confirmed | null>(null);
  // New clicks build on the pending input. Only the server reply can change the screen.
  const intended = useRef<Selection | null>(null);
  const generation = useRef(0);

  const publish = useCallback((snapshot: Confirmed) => {
    current.current = snapshot;
    intended.current = snapshot.selection;
    setConfirmed(snapshot);
  }, []);

  const recalculate = useCallback(async (program: Program, selection: Selection) => {
    const attempt = ++generation.current;
    intended.current = selection;
    setRequest({ kind: "loading-preview" });
    try {
      const preview = await getPreview(program, selection.input);
      if (generation.current !== attempt) return;

      publish({ program, selection, preview });
      storeSelection(selection);
      setRequest({ kind: "idle" });
    } catch (error) {
      if (generation.current !== attempt) return;

      intended.current = current.current?.selection ?? null;
      const message = error instanceof ApiError
        ? error.message
        : "Не удалось пересчитать маршрут. Проверьте соединение и попробуйте ещё раз.";
      if (error instanceof ApiError && error.code === "stale_program") {
        setRequest({ kind: "stale", message });
      } else if (error instanceof ApiError && error.status === 422) {
        setRequest({ kind: "invalid", message });
      } else {
        setRequest({ kind: "preview-error", message, selection });
      }
    }
  }, [publish]);

  const loadProgram = useCallback(async () => {
    const attempt = ++generation.current;
    intended.current = current.current?.selection ?? null;
    setRequest({ kind: "loading-program" });
    try {
      const program = await getProgram();
      if (generation.current !== attempt) return;

      const previous = current.current;
      if (previous?.program.revision === program.revision) {
        setRequest({ kind: "idle" });
        return;
      }

      const saved = previous ? null : readSelection(program);
      if (previous) storeSelection(null);
      publish({
        program,
        selection: { input: { revision: program.revision, topic_ids: [], actions: [] }, changedAt: 0 },
        preview: { revision: program.revision, items: [], is_custom: false },
      });
      if (saved) {
        void recalculate(program, saved);
      } else {
        setRequest({ kind: "idle" });
      }
    } catch (error) {
      if (generation.current !== attempt) return;
      setRequest({
        kind: "program-error",
        message: error instanceof ApiError ? error.message : "Не удалось загрузить программу. Проверьте соединение и попробуйте ещё раз.",
      });
    }
  }, [publish, recalculate]);

  useEffect(() => {
    void loadProgram();
    return () => { generation.current += 1; };
  }, [loadProgram]);

  function update(change: (input: PreviewRequest) => PreviewRequest) {
    const snapshot = current.current;
    if (!snapshot || request.kind === "loading-program") return;

    const input = intended.current?.input ?? snapshot.selection.input;
    void recalculate(snapshot.program, { input: change(input), changedAt: Date.now() });
  }

  function toggleTopic(id: string) {
    update((input) => {
      const topics = new Set(input.topic_ids);
      if (topics.has(id)) topics.delete(id);
      else topics.add(id);
      return { ...input, topic_ids: [...topics], actions: [] };
    });
  }

  function act(action: Action) {
    update((input) => ({ ...input, actions: [...input.actions, action] }));
  }

  function resetFilter() {
    update((input) => ({ ...input, actions: [] }));
  }

  function retryPreview() {
    if (request.kind === "preview-error" && current.current) {
      void recalculate(current.current.program, request.selection);
    }
  }

  return { confirmed, request, loadProgram, toggleTopic, act, resetFilter, retryPreview };
}
