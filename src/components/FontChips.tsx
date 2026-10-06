export function FontChips({ values, empty = 'No categories yet' }: { values: string[]; empty?: string }) {
  return values.length
    ? <div className="flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-md border border-[#354156] bg-[#192233] px-2 py-1 text-[10px] font-medium text-[#d5deec]">{value}</span>)}</div>
    : <span className="text-[11px] text-[#93a1b5]">{empty}</span>;
}
