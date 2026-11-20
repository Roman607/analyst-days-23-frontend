import { dateLabel, type Confirmed } from "@/lib/trajectory";

const WIDTH = 800;
const PADDING = 36;
const TITLE_FONT = "bold 29px Arial, sans-serif";

function wrapTitle(context: CanvasRenderingContext2D, title: string) {
  const maxWidth = WIDTH - PADDING * 2 - 40;
  context.font = TITLE_FONT;
  const lines: string[] = [];
  let line = "";
  for (const word of title.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);
    line = "";
    for (const character of word) {
      if (context.measureText(line + character).width > maxWidth) {
        lines.push(line);
        line = "";
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function downloadRoute({ program, preview }: Confirmed) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");

  const entries = new Map(program.entries.map((entry) => [entry.id, entry]));
  const rooms = new Map(program.rooms.map((room) => [room.id, room.name]));
  const byDay = new Map(program.days.map((day) => [day, {
    label: dateLabel(day, { day: "numeric", month: "long", year: "numeric" }),
    rows: [] as { meta: string; title: string[]; alternative: boolean; height: number }[],
  }]));

  for (const item of preview.items) {
    const entry = entries.get(item.entry_id)!;
    const title = wrapTitle(context, entry.title);
    const interval = `${entry.starts_at}–${entry.ends_at}`;
    const room = entry.room_id && (rooms.get(entry.room_id) ?? entry.room_id);
    const alternative = item.state === "alternative";
    byDay.get(entry.day)?.rows.push({
      meta: [interval, room, alternative && "Вариант"].filter(Boolean).join("  ·  "),
      title,
      alternative,
      height: 60 + title.length * 36,
    });
  }

  const height = 156 + PADDING + [...byDay.values()].reduce(
    (total, { rows }) => total + 74 + (rows.length ? rows.reduce((sum, row) => sum + row.height + 10, 0) : 56), 0,
  );
  // Stay within mobile canvas limits even when every talk is included.
  const scale = Math.min(1, Math.sqrt(15_000_000 / (WIDTH * height)), 16_384 / height);
  canvas.width = Math.floor(WIDTH * scale);
  canvas.height = Math.floor(height * scale);
  context.scale(scale, scale);
  context.fillStyle = "#f7f4ec";
  context.fillRect(0, 0, WIDTH, height);

  function text(value: string, x: number, y: number, font: string, color: string) {
    context!.font = font;
    context!.fillStyle = color;
    context!.fillText(value, x, y);
  }

  text("Analyst Days / 23", PADDING, 54, "bold 24px Arial, sans-serif", "#a43f28");
  text("Моя траектория", PADDING, 113, "bold 52px Arial, sans-serif", "#2f2436");
  let y = 156;
  for (const { label, rows } of byDay.values()) {
    text(`${label} · МСК`, PADDING, y + 33, "bold 26px Arial, sans-serif", "#2f2436");
    y += 53;
    if (!rows.length) {
      text("Доклады пока не выбраны", PADDING, y + 25, "26px Arial, sans-serif", "#615967");
      y += 56;
    }
    for (const row of rows) {
      context.fillStyle = row.alternative ? "#f7e4d1" : "#e9edd8";
      context.beginPath();
      context.roundRect(PADDING, y, WIDTH - PADDING * 2, row.height, 12);
      context.fill();
      const x = PADDING + 20;
      text(row.meta, x, y + 34, "bold 23px Arial, sans-serif", row.alternative ? "#8c3d27" : "#455625");
      row.title.forEach((line, index) => text(line, x, y + 72 + index * 36, TITLE_FONT, "#2f2436"));
      y += row.height + 10;
    }
    y += 21;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((file) => file ? resolve(file) : reject(new Error("PNG unavailable")), "image/png");
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "analyst-days-23-track.png";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
