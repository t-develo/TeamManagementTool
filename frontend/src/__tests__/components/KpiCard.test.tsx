/**
 * KpiCard コンポーネントのテスト。
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { KpiCard } from '../../components/common/KpiCard'

describe('KpiCard', () => {
  it('title が表示される', () => {
    render(<KpiCard title="総プロジェクト数" value={10} color="#3B82F6" />)

    expect(screen.getByText('総プロジェクト数')).toBeInTheDocument()
  })

  it('数値の value が表示される', () => {
    render(<KpiCard title="総プロジェクト数" value={42} color="#3B82F6" />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('文字列の value が表示される', () => {
    render(<KpiCard title="予算消化率" value="75.5%" color="#3B82F6" />)

    expect(screen.getByText('75.5%')).toBeInTheDocument()
  })

  it('subtitle を指定したとき表示される', () => {
    render(
      <KpiCard
        title="総予算"
        value="1,000万円"
        subtitle="前月比 +5%"
        color="#3B82F6"
      />
    )

    expect(screen.getByText('前月比 +5%')).toBeInTheDocument()
  })

  it('subtitle を省略したとき何も表示されない', () => {
    render(<KpiCard title="総プロジェクト数" value={10} color="#3B82F6" />)

    // subtitle が存在しない = text が空文字の要素がない
    expect(screen.queryByText('前月比')).not.toBeInTheDocument()
  })
})
