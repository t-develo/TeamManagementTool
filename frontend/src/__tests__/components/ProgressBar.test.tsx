/**
 * ProgressBar コンポーネントのテスト。
 *
 * クランプ（100% 超えを 100% に丸める）とラベル表示のふるまいを検証する。
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { ProgressBar } from '../../components/common/ProgressBar'

describe('ProgressBar / バーの幅', () => {
  it('value=50 のとき内側バーの width が 50% になる', () => {
    const { container } = render(<ProgressBar value={50} />)

    const bar = container.querySelector('[style]') as HTMLElement
    expect(bar.style.width).toBe('50%')
  })

  it('value が max を超えたとき width は 100% にクランプされる', () => {
    const { container } = render(<ProgressBar value={150} max={100} />)

    const bar = container.querySelector('[style]') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })

  it('value=0 のとき width が 0% になる', () => {
    const { container } = render(<ProgressBar value={0} />)

    const bar = container.querySelector('[style]') as HTMLElement
    expect(bar.style.width).toBe('0%')
  })

  it('max を明示したとき相対値で幅が計算される', () => {
    // value=25, max=50 → 50%
    const { container } = render(<ProgressBar value={25} max={50} />)

    const bar = container.querySelector('[style]') as HTMLElement
    expect(bar.style.width).toBe('50%')
  })
})

describe('ProgressBar / ラベル表示', () => {
  it('showLabel=true のときパーセント値が表示される', () => {
    render(<ProgressBar value={75} showLabel={true} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('showLabel=false（デフォルト）のときラベルは表示されない', () => {
    render(<ProgressBar value={75} />)

    expect(screen.queryByText('75%')).not.toBeInTheDocument()
  })

  it('100% 超えのとき showLabel は 100% と表示する', () => {
    render(<ProgressBar value={150} showLabel={true} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
