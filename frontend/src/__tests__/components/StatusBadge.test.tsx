/**
 * StatusBadge コンポーネントのテスト。
 *
 * テスト設計方針（t_wada ベストプラクティス）:
 * - ふるまいをテストする: ユーザーが見るラベルと色クラスを検証する
 * - 実装の詳細（内部状態・ロジック）には依存しない
 * - テスト名は日本語で仕様として読めるようにする
 * - 1 テスト 1 アサーション（原則）
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import {
  StatusBadge,
  PROJECT_STATUS_MAP,
  TASK_STATUS_MAP,
  MEMBER_STATUS_MAP,
} from '../../components/common/StatusBadge'

// ---------------------------------------------------------------------------
// プロジェクトステータス
// ---------------------------------------------------------------------------

describe('StatusBadge / プロジェクトステータス', () => {
  it('planning のとき「計画中」と表示される', () => {
    render(<StatusBadge status="planning" statusMap={PROJECT_STATUS_MAP} />)

    expect(screen.getByText('計画中')).toBeInTheDocument()
  })

  it('active のとき「進行中」と表示される', () => {
    render(<StatusBadge status="active" statusMap={PROJECT_STATUS_MAP} />)

    expect(screen.getByText('進行中')).toBeInTheDocument()
  })

  it('completed のとき「完了」と表示される', () => {
    render(<StatusBadge status="completed" statusMap={PROJECT_STATUS_MAP} />)

    expect(screen.getByText('完了')).toBeInTheDocument()
  })

  it('on_hold のとき「保留」と表示される', () => {
    render(<StatusBadge status="on_hold" statusMap={PROJECT_STATUS_MAP} />)

    expect(screen.getByText('保留')).toBeInTheDocument()
  })

  it('active のバッジは green の背景クラスを持つ', () => {
    render(<StatusBadge status="active" statusMap={PROJECT_STATUS_MAP} />)

    const badge = screen.getByText('進行中')
    expect(badge).toHaveClass('bg-green-100')
  })

  it('planning のバッジは blue の背景クラスを持つ', () => {
    render(<StatusBadge status="planning" statusMap={PROJECT_STATUS_MAP} />)

    const badge = screen.getByText('計画中')
    expect(badge).toHaveClass('bg-blue-100')
  })

  it('on_hold のバッジは yellow の背景クラスを持つ', () => {
    render(<StatusBadge status="on_hold" statusMap={PROJECT_STATUS_MAP} />)

    const badge = screen.getByText('保留')
    expect(badge).toHaveClass('bg-yellow-100')
  })
})

// ---------------------------------------------------------------------------
// タスクステータス
// ---------------------------------------------------------------------------

describe('StatusBadge / タスクステータス', () => {
  it('not_started のとき「未着手」と表示される', () => {
    render(<StatusBadge status="not_started" statusMap={TASK_STATUS_MAP} />)

    expect(screen.getByText('未着手')).toBeInTheDocument()
  })

  it('in_progress のとき「進行中」と表示される', () => {
    render(<StatusBadge status="in_progress" statusMap={TASK_STATUS_MAP} />)

    expect(screen.getByText('進行中')).toBeInTheDocument()
  })

  it('completed のとき「完了」と表示される', () => {
    render(<StatusBadge status="completed" statusMap={TASK_STATUS_MAP} />)

    expect(screen.getByText('完了')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// メンバーステータス
// ---------------------------------------------------------------------------

describe('StatusBadge / メンバーステータス', () => {
  it('true のとき「アクティブ」と表示される', () => {
    render(<StatusBadge status="true" statusMap={MEMBER_STATUS_MAP} />)

    expect(screen.getByText('アクティブ')).toBeInTheDocument()
  })

  it('false のとき「無効」と表示される', () => {
    render(<StatusBadge status="false" statusMap={MEMBER_STATUS_MAP} />)

    expect(screen.getByText('無効')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// フォールバック動作
// ---------------------------------------------------------------------------

describe('StatusBadge / 未知のステータス', () => {
  it('マップに存在しないステータスはキーをそのまま表示する', () => {
    render(<StatusBadge status="unknown_status" statusMap={PROJECT_STATUS_MAP} />)

    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })

  it('マップに存在しないステータスは gray の背景クラスで表示する', () => {
    render(<StatusBadge status="unknown_status" statusMap={PROJECT_STATUS_MAP} />)

    const badge = screen.getByText('unknown_status')
    expect(badge).toHaveClass('bg-gray-100')
  })
})
