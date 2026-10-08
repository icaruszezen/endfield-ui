/* 虚构的站点名录：组合框和调度台示例页共用。编号放在 keywords 里，可以按它检索 */

const zones = [
  { key: "n", label: "北区", count: 8 },
  { key: "s", label: "南岸", count: 6 },
  { key: "e", label: "东线", count: 5 },
  { key: "w", label: "西坡", count: 5 },
] as const;

const numerals = ["一", "二", "三", "四", "五", "六", "七", "八"];

export const stationGroups = zones.map((zone) => ({
  label: zone.label,
  items: Array.from({ length: zone.count }, (_, index) => {
    const code = `${zone.key.toUpperCase()}-${String(index + 1).padStart(2, "0")}`;
    return {
      value: `${zone.key}${index + 1}`,
      label: `${zone.label}${numerals[index]}号站`,
      keywords: [code],
      // 每个区的最后一个站停用了
      disabled: index === zone.count - 1 && zone.key !== "n",
    };
  }),
}));

export const stations = stationGroups.flatMap((group) => group.items);

export const stationLabel = (value: string) =>
  stations.find((station) => station.value === value)?.label ?? value;
