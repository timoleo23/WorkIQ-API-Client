interface Props {
  method: "GET" | "POST" | "PATCH" | "DELETE";
}

const colors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  POST: "bg-sky-100 text-sky-800 ring-sky-200",
  PATCH: "bg-amber-100 text-amber-800 ring-amber-200",
  DELETE: "bg-rose-100 text-rose-800 ring-rose-200"
};

export function MethodBadge({ method }: Props) {
  return (
    <span
      className={`inline-flex min-w-[3.25rem] justify-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${colors[method]}`}
    >
      {method}
    </span>
  );
}
