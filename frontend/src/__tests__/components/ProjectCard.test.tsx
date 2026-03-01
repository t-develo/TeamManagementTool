/**
 * ProjectCard コンポーネントのテスト。
 *
 * プロジェクトカードの表示と編集ボタンの動作を検証する。
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ProjectCard } from "../../components/projects/ProjectCard";
import type { Project } from "../../types/project";

const mockProject: Project = {
  id: "proj-1",
  name: "テストプロジェクト",
  description: "テスト用プロジェクトの説明",
  budget: 500,
  status: "active",
  start_date: "2026-01-01",
  end_date: "2026-06-30",
  progress: 50,
  actual_cost: 200,
  tasks: [],
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

describe("ProjectCard", () => {
  it("プロジェクト名が表示される", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} />);
    expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
  });

  it("期間が表示される", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} />);
    expect(screen.getByText("2026-01-01 ~ 2026-06-30")).toBeInTheDocument();
  });

  it("onEdit を渡さない場合は編集ボタンが表示されない", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} />);
    expect(screen.queryByText("編集")).not.toBeInTheDocument();
  });

  it("onEdit を渡すと編集ボタンが表示される", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("編集")).toBeInTheDocument();
  });

  it("編集ボタンをクリックすると onEdit が呼ばれる", () => {
    const onEdit = vi.fn();
    render(<ProjectCard project={mockProject} onClick={vi.fn()} onEdit={onEdit} />);

    fireEvent.click(screen.getByText("編集"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(expect.any(Object), mockProject);
  });

  it("カードクリックで onClick が呼ばれる", () => {
    const onClick = vi.fn();
    render(<ProjectCard project={mockProject} onClick={onClick} />);

    // カード本体をクリック（ボタン以外の部分）
    fireEvent.click(screen.getByText("テストプロジェクト"));

    expect(onClick).toHaveBeenCalledWith(mockProject);
  });
});
