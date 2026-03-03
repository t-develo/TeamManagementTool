/**
 * GanttHeader コンポーネントのテスト。
 *
 * ガントチャートのヘッダーが日付単位(2段構成)で正しく描画されることを検証する。
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { GanttHeader } from "../../components/gantt/GanttHeader";

describe("GanttHeader", () => {
  it("月ラベルが上段に表示される", () => {
    render(<GanttHeader startDate="2026-01-28" endDate="2026-02-03" />);

    expect(screen.getByText("2026/1")).toBeInTheDocument();
    expect(screen.getByText("2026/2")).toBeInTheDocument();
  });

  it("同一月のみの場合は一つの月ラベルが表示される", () => {
    render(<GanttHeader startDate="2026-03-01" endDate="2026-03-10" />);

    expect(screen.getByText("2026/3")).toBeInTheDocument();
    expect(screen.queryByText("2026/4")).not.toBeInTheDocument();
  });

  it("下段に開始日の日番号が表示される", () => {
    render(<GanttHeader startDate="2026-01-28" endDate="2026-02-03" />);

    // 1月28日
    const day28Cells = screen.getAllByText("28");
    expect(day28Cells.length).toBeGreaterThan(0);
  });

  it("下段に月をまたぐ連続した日番号が表示される", () => {
    render(<GanttHeader startDate="2026-01-30" endDate="2026-02-02" />);

    // 1月: 30, 31 / 2月: 1, 2 が全て表示される
    expect(screen.getAllByText("30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("31").length).toBeGreaterThan(0);
    // 月をまたいで "1" が複数ある場合もあるため getAllByText を使用
    const dayOnes = screen.getAllByText("1");
    expect(dayOnes.length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("単日の場合でも正常に描画される", () => {
    render(<GanttHeader startDate="2026-06-15" endDate="2026-06-15" />);

    expect(screen.getByText("2026/6")).toBeInTheDocument();
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);
  });
});
