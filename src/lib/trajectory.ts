export type NamedItem = { id: string; name: string };

export type Entry = {
  id: string;
  kind: "talk" | "blitz" | "workshop" | "discussion" | "break" | "service" | "hackathon";
  title: string;
  speakers: string | null;
  day: string;
  starts_at: string;
  ends_at: string;
  room_id: string | null;
  topic_ids: string[];
  previous_part_id: string | null;
};

export type Program = {
  revision: string;
  timezone: "Europe/Moscow";
  days: string[];
  rooms: NamedItem[];
  topics: NamedItem[];
  entries: Entry[];
};

export type Action = { op: "choose" | "skip_continuation"; entry_id: string };

export type PreviewRequest = {
  revision: string;
  topic_ids: string[];
  actions: Action[];
};

export type PreviewItem = {
  entry_id: string;
  state: "selected" | "alternative";
  conflicts_with: string[];
};

export type Preview = {
  revision: string;
  items: PreviewItem[];
  is_custom: boolean;
};

export type Selection = {
  input: PreviewRequest;
  changedAt: number;
};

export type Confirmed = {
  program: Program;
  selection: Selection;
  preview: Preview;
};

const errorMessages: Record<string, string> = {
  invalid_request: "Не удалось обработать изменение маршрута. Попробуйте выбрать доклад или тему ещё раз.",
  unknown_topic: "Этой темы нет в открытой программе. Выберите другую тему.",
  unknown_entry: "Этого выступления нет в открытой программе. Выберите другую карточку.",
  not_selectable: "Это событие служит ориентиром в программе. Выберите выступление.",
  not_continuation: "Пропустить можно только продолжение мастер-класса.",
  stale_program: "Программа обновилась. Загрузите новую сетку.",
  program_unavailable: "Программа временно недоступна. Попробуйте ещё раз.",
};

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(errorMessages[code] ?? "Сервис временно недоступен. Попробуйте ещё раз.");
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, typeof body?.code === "string" ? body.code : "");
  }
  return response.json();
}

export function getProgram() {
  return api<Program>("/api/program");
}

export async function getPreview(program: Program, input: PreviewRequest): Promise<Preview> {
  const result = await api<Preview>("/api/trajectory/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const entryIds = new Set(program.entries.map((entry) => entry.id));
  if (result.revision !== program.revision || result.items.some((item) => !entryIds.has(item.entry_id))) {
    throw new ApiError(409, "stale_program");
  }
  return result;
}

const cacheKey = "ad23-selection-v1";
const selectionLifetime = 20 * 60 * 1000;

export function readSelection(program: Program): Selection | null {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const choice = JSON.parse(raw) as Selection | null;
    const now = Date.now();
    if (
      choice?.input?.revision === program.revision &&
      Number.isFinite(choice.changedAt) &&
      choice.changedAt <= now &&
      now - choice.changedAt < selectionLifetime &&
      Array.isArray(choice.input.topic_ids) &&
      Array.isArray(choice.input.actions)
    ) {
      return choice;
    }
    sessionStorage.removeItem(cacheKey);
  } catch {
    // The rendered route remains available when storage is disabled.
  }
  return null;
}

export function storeSelection(selection: Selection | null) {
  try {
    if (selection) sessionStorage.setItem(cacheKey, JSON.stringify(selection));
    else sessionStorage.removeItem(cacheKey);
  } catch {
    // The confirmed and pending choices already live in page memory.
  }
}

export function dateLabel(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("ru-RU", { ...options, timeZone: "Europe/Moscow" })
    .format(new Date(day + "T12:00:00+03:00"));
}
