export function AuthShell({ children, side = "right" }) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-linear-to-br from-sky-400 via-emerald-400 to-lime-400 p-2">
      <div
        className={`flex w-full overflow-hidden rounded-lg ${
          side === "left" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="relative hidden flex-1 items-center justify-center lg:flex">
          <div className="relative h-40 w-3/5">
            <span className="absolute top-0 left-12 size-60 rounded-2xl bg-white/80 animate-pulse" />
            <span className="absolute top-36 -left-20 size-16 rounded-full bg-white/50" />
            <span className="absolute -top-56 -right-40 h-16 w-20 rounded-2xl bg-white/40" />
            <span className="absolute -top-28 -right-40 size-32 rounded-full bg-white/60" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-black text-white">
          <div className="flex w-full max-w-sm flex-col items-center px-6 py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
