'use client'

import { useEffect } from 'react'

const PAGE_SIZE = 20

export default function TablePagination() {
  useEffect(() => {
    const states = new WeakMap()

    const getRows = (table) => Array.from(table.querySelectorAll('tbody tr'))

    const render = (table) => {
      const rows = getRows(table)
      const state = states.get(table) || { page: 1 }
      const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
      state.page = Math.min(state.page, pages)
      states.set(table, state)

      rows.forEach((row, index) => {
        row.style.display = index >= (state.page - 1) * PAGE_SIZE && index < state.page * PAGE_SIZE ? '' : 'none'
      })

      let nav = table.parentElement?.parentElement?.querySelector('.lifeos-pagination')
      if (!nav) {
        nav = document.createElement('div')
        nav.className = 'lifeos-pagination'
        table.parentElement?.parentElement?.appendChild(nav)
      }

      if (rows.length <= PAGE_SIZE) {
        nav.innerHTML = ''
        nav.style.display = 'none'
        return
      }

      nav.style.display = 'flex'
      nav.innerHTML = ''

      const info = document.createElement('span')
      const start = (state.page - 1) * PAGE_SIZE + 1
      const end = Math.min(state.page * PAGE_SIZE, rows.length)
      info.textContent = `${start}–${end} / ${rows.length}`

      const controls = document.createElement('div')
      controls.className = 'pagination-controls'

      const makeButton = (label, disabled, page) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = label
        button.disabled = disabled
        button.className = 'pagination-button'
        button.addEventListener('click', () => {
          state.page = page
          render(table)
        })
        return button
      }

      controls.appendChild(makeButton('‹', state.page === 1, state.page - 1))
      const windowStart = Math.max(1, Math.min(state.page - 2, pages - 4))
      const windowEnd = Math.min(pages, windowStart + 4)
      for (let page = windowStart; page <= windowEnd; page += 1) {
        const button = makeButton(String(page), false, page)
        if (page === state.page) button.classList.add('active')
        controls.appendChild(button)
      }
      controls.appendChild(makeButton('›', state.page === pages, state.page + 1))

      nav.append(info, controls)
    }

    const scan = () => {
      document.querySelectorAll('.transaction-table').forEach(render)
    }

    scan()
    const observer = new MutationObserver(() => requestAnimationFrame(scan))
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
