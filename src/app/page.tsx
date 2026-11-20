import Link from "next/link";
import { Button } from "@/components/ui/button";

const sample = [
  { time: "16:30", room: "B", title: "Wiki в Git для ИИ-агента", speaker: "Вера Бонарева" },
  { time: "17:40", room: "C", title: "Системное управление", speaker: "Евгения Синицына" },
];
const rooms = ["A", "B", "C", "D"];

export default function Home() {
  return (
    <main className="page-width">
      <div className="hero">
        <div>
          <p className="eyebrow">Персональная траектория</p>
          <h1 className="hero-title">Два дня.<br /><em>Ваш маршрут.</em></h1>
          <p className="max-w-[31rem] text-lg leading-relaxed text-muted sm:text-xl">
            Выберите доклады по интересам, решите, в какой зал пойти, и сохраните маршрут на телефон.
          </p>
          <Button asChild className="mt-6 min-h-12 px-5 text-base sm:mt-8">
            <Link href="/program">Выбрать траекторию</Link>
          </Button>
        </div>
        <aside className="sample" aria-labelledby="sample-title">
          <p className="eyebrow text-[#d9c8d9]">Пример маршрута · 21 ноября</p>
          <h2 id="sample-title" className="mb-5 mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Суббота, два доклада</h2>
          <div className="sample-grid" aria-hidden="true">
            <span />
            {rooms.map((room) => <span key={room} className="text-center text-[#d9c8d9]">Зал {room}</span>)}
            {sample.map(({ time, room }) => (
              <div className="contents" key={time}>
                <span>{time}</span>
                {rooms.map((hall) => (
                  <span key={hall} className={hall === room ? "sample-tile sample-tile-active" : "sample-tile"}>
                    {hall === room && "✓"}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <ul className="mt-5">
            {sample.map(({ time, title, speaker, room }) => (
              <li className="grid grid-cols-[3.5rem_1fr] items-baseline gap-2 border-t border-[#66576a] py-3 last:pb-0" key={time}>
                <time className="font-mono text-sm text-[#e1ecb5]">{time}</time>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-[#d9c8d9]">{speaker} · Зал {room}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <div className="grid gap-6 border-t border-line py-7 md:grid-cols-3 md:gap-10">
        <div>
          <h2 className="text-lg font-semibold">Выберите темы</h2>
          <p className="mt-1 text-muted">Подборка охватывает оба дня. Доклад можно добавить и напрямую из сетки.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Определитесь с залом</h2>
          <p className="mt-1 text-muted">Оставьте параллельные доклады в маршруте или выберите между ними сразу.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Сохраните картинку</h2>
          <p className="mt-1 text-muted">Откройте скачанный PNG на телефоне, чтобы сверить время и зал.</p>
        </div>
      </div>
    </main>
  );
}
