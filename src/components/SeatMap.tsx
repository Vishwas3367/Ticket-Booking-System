"use client";

export type SeatView = {
  id: string;
  row: number;
  col: number;
  label: string;
  category: string;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "MINE" | string;
};

export default function SeatMap({
  seats,
  rows,
  cols,
  selected,
  onToggle,
}: {
  seats: SeatView[];
  rows: number;
  cols: number;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const grid = new Map(seats.map((s) => [`${s.row}-${s.col}`, s]));

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4 rounded-full bg-gradient-to-b from-amber-200/40 to-transparent px-[8%] py-3 text-center text-xs tracking-[0.3em] text-amber-100/70">
        SCREEN / STAGE
      </div>
      <div
        className="mx-auto grid w-max gap-1.5 p-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.25rem, 2.75rem))` }}
      >
        {Array.from({ length: rows }, (_, ri) =>
          Array.from({ length: cols }, (_, ci) => {
            const seat = grid.get(`${ri + 1}-${ci + 1}`);
            if (!seat) return <div key={`${ri}-${ci}`} />;
            const isSelected = selected.includes(seat.id);
            const clickable = seat.status === "AVAILABLE" || seat.status === "MINE" || isSelected;
            const color =
              seat.status === "BOOKED"
                ? "bg-stone-700 text-stone-400 cursor-not-allowed"
                : seat.status === "HELD"
                  ? "bg-orange-900/80 text-orange-200 cursor-not-allowed"
                  : isSelected || seat.status === "MINE"
                    ? "bg-emerald-600 text-white"
                    : seat.category === "PREMIUM"
                      ? "bg-amber-600/90 text-amber-50 hover:bg-amber-500"
                      : "bg-teal-800 text-teal-50 hover:bg-teal-700";
            return (
              <button
                key={seat.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onToggle(seat.id)}
                title={`${seat.label} · ${seat.category} · ${seat.status}`}
                className={`flex h-11 min-h-[44px] w-full cursor-pointer items-center justify-center rounded-md text-[0.65rem] font-medium ${color} disabled:cursor-not-allowed`}
              >
                {seat.label}
              </button>
            );
          })
        )}
      </div>
      <ul className="mt-4 flex flex-wrap gap-4 text-xs text-amber-100/80">
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-amber-600" /> Premium</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-teal-800" /> Standard</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-600" /> Your hold</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-900" /> Held</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-stone-700" /> Booked</li>
      </ul>
    </div>
  );
}
