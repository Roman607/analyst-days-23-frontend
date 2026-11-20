import { Check, Diamond } from "lucide-react";
import { Fragment } from "react";
import { dateLabel, type Action, type Confirmed, type Entry, type PreviewItem } from "@/lib/trajectory";

const fixedEntries = {
  break: "Перерыв",
  service: "Событие программы",
  hackathon: "Хакатон",
};

function Card({ entry, item, conflicts, dimmed, disabled, onAction }: {
  entry: Entry;
  item?: PreviewItem;
  conflicts: string[];
  dimmed: boolean;
  disabled: boolean;
  onAction: (action: Action) => void;
}) {
  const { kind } = entry;
  const fixed = kind === "break" || kind === "service" || kind === "hackathon";
  const state = item?.state ?? (dimmed && !fixed ? "dimmed" : "neutral");
  const content = (
    <>
      <span className="card-time">{entry.starts_at}–{entry.ends_at}</span>
      <strong className="card-title">{entry.title}</strong>
      {entry.speakers && <span className="card-speakers">{entry.speakers}</span>}
      {entry.previous_part_id && <span className="card-speakers">Продолжение мастер-класса</span>}
      {item?.state === "selected" && (
        <span className="card-status"><Check size={16} aria-hidden="true" />В маршруте</span>
      )}
      {item?.state === "alternative" && (
        <span className="card-status" title={conflicts.join("; ")}>
          <Diamond size={14} aria-hidden="true" />Выберите доклад
          {conflicts.length > 0 && <span className="sr-only">. Пересекается с {conflicts.join(", ")}</span>}
        </span>
      )}
    </>
  );

  if (fixed) {
    return (
      <div className="schedule-card orienting">
        {content}
        {entry.room_id && <span className="card-speakers">{fixedEntries[kind]}</span>}
      </div>
    );
  }

  return (
    <div>
      <button
        className="schedule-card selectable"
        type="button"
        disabled={disabled}
        data-state={state}
        aria-pressed={Boolean(item)}
        onClick={() => onAction({ op: "choose", entry_id: entry.id })}
      >
        {content}
      </button>
      {entry.previous_part_id && item && (
        <button className="skip-continuation" type="button" disabled={disabled} onClick={(event) => {
          (event.currentTarget.previousElementSibling as HTMLButtonElement).focus({ preventScroll: true });
          onAction({ op: "skip_continuation", entry_id: entry.id });
        }}>
          Пропустить продолжение
        </button>
      )}
    </div>
  );
}

export function Schedule({ snapshot, disabled, onAction }: {
  snapshot: Confirmed;
  disabled: boolean;
  onAction: (action: Action) => void;
}) {
  const { program, preview, selection } = snapshot;
  const items = new Map(preview.items.map((item) => [item.entry_id, item]));
  const titles = new Map(program.entries.map((entry) => [entry.id, entry.title]));
  const dimmed = Boolean(selection.input.topic_ids.length || items.size);
  const rooms = [...program.rooms].sort((a, b) => a.id.localeCompare(b.id));

  function card(entry: Entry) {
    const item = items.get(entry.id);
    return (
      <Card
        key={entry.id}
        entry={entry}
        item={item}
        conflicts={item?.conflicts_with.map((id) => titles.get(id) ?? "") ?? []}
        dimmed={dimmed}
        disabled={disabled}
        onAction={onAction}
      />
    );
  }

  return program.days.map((day) => {
    const label = dateLabel(day, { day: "numeric", month: "long" });
    const entries = program.entries.filter((entry) => entry.day === day);
    const byStart = Map.groupBy(entries, (entry) => entry.starts_at);
    return (
      <section className="day-section" key={day} id={`day-${day}`} aria-labelledby={`label-${day}`}>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" id={`label-${day}`}>{label}</h2>
          <span className="text-sm text-muted">{dateLabel(day, { weekday: "long" })}</span>
        </div>
        <div className="schedule-scroll" tabIndex={0} role="region" aria-label={`Расписание на ${label}`}>
          <table className="schedule-table" aria-label={label}>
            <thead>
              <tr>
                <th scope="col" className="sticky-time">МСК</th>
                {rooms.map((room) => <th scope="col" key={room.id}>{room.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...byStart.keys()].sort().map((start) => {
                const events = byStart.get(start)!;
                const common = events.filter((entry) => entry.room_id === null);
                const inRooms = Map.groupBy(events.filter((entry) => entry.room_id !== null), (entry) => entry.room_id);
                return (
                  <Fragment key={start}>
                    {common.length > 0 && (
                      <tr>
                        <th scope="row" className="sticky-time"><time>{start}</time></th>
                        <td colSpan={rooms.length}><div className="common-events">{common.map(card)}</div></td>
                      </tr>
                    )}
                    {inRooms.size > 0 && (
                      <tr>
                        <th scope="row" className="sticky-time"><time>{start}</time></th>
                        {rooms.map((room) => (
                          <td key={room.id} className={inRooms.has(room.id) ? "" : "room-empty"}>
                            <div className="grid gap-2">{inRooms.get(room.id)?.map(card)}</div>
                          </td>
                        ))}
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  });
}
