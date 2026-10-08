/* 虚构的运输批次：表格的 story 和调度台示例页共用 */

export type ShipmentStatus = "运输中" | "已到站" | "待发车" | "已延误";

export type Shipment = {
  id: string;
  cargo: string;
  /** 站点的值，对应 stations.ts */
  station: string;
  count: number;
  weight: number;
  status: ShipmentStatus;
  /** 最近八次的载重，画走势用 */
  trend: readonly number[];
};

const cargos = [
  "合金锭",
  "高能燃料",
  "加固板材",
  "冷却液",
  "备用电池",
  "滤芯",
  "定位信标",
  "应急口粮",
];
const stationIds = ["n7", "s2", "e3", "w1", "n2", "s4", "n5", "e1"];
const statuses: ShipmentStatus[] = ["运输中", "已到站", "待发车", "已延误"];

export const shipments: Shipment[] = Array.from({ length: 16 }, (_, index) => {
  const count = 12 + ((index * 37) % 180);
  return {
    id: `TR-${String(2041 + index * 3).padStart(4, "0")}`,
    cargo: cargos[index % cargos.length]!,
    station: stationIds[(index * 3) % stationIds.length]!,
    count,
    weight: Math.round(count * (1.4 + (index % 4) * 0.35) * 10) / 10,
    status: statuses[(index + (index % 5 === 0 ? 3 : 0)) % statuses.length]!,
    trend: Array.from(
      { length: 8 },
      (_, step) => 40 + ((index * 13 + step * (7 + (index % 3) * 5)) % 55),
    ),
  };
});
