import type { Shipment } from "./shipments";

const crew = ["甲组", "乙组", "丙组"];

/* 虚构的装车明细：表格"行展开"的 story 和调度台示例页共用 */
export function ShipmentDetail({ row }: { row: Shipment }) {
  const crates = Math.ceil(row.count / 24);
  const facts = [
    ["装箱", `${crates} 箱，每箱至多 24 件`],
    ["押运", crew[row.count % crew.length]!],
    ["发车", row.date.replaceAll("-", ".")],
    [
      "备注",
      row.status === "已延误" ? "管廊北段限行，改走二号线" : "按计划执行",
    ],
  ] as const;

  return (
    <dl className="grid max-w-2xl grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-8 gap-y-3">
      {facts.map(([name, value]) => (
        <div key={name} className="min-w-0">
          <dt className="font-tech text-xs text-ink-secondary">{`// ${name}`}</dt>
          <dd className="font-medium wrap-anywhere">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
