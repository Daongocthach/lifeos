'use client'

import { useEffect } from 'react'

const rawValues = new WeakMap()
const moneyPattern = /(^|[-_\s])(amount|money|price|cost|income|expense)([-_\s]|$)/i

function isMoneyInput(el) {
  if (!(el instanceof HTMLInputElement)) return false
  const text = `${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`
  return moneyPattern.test(text) || /số tiền|so tien|tiền|tien/i.test(text)
}

function digits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function format(value) {
  const raw = digits(value)
  return raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : ''
}

function rawIndexFromCaret(value, caret) {
  return digits(value.slice(0, caret)).length
}

function caretFromRawIndex(formatted, index) {
  if (!index) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) seen += 1
    if (seen >= index) return i + 1
  }
  return formatted.length
}

export default function MoneyInputFormatter() {
  useEffect(() => {
    const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
    const patch = (el) => {
      if (!isMoneyInput(el) || el.dataset.moneyPatched === '1') return
      el.dataset.moneyPatched = '1'
      if (el.type === 'number') el.type = 'text'
      el.inputMode = 'numeric'
      const initial = digits(el.value)
      rawValues.set(el, initial)
      nativeValue.set.call(el, format(initial))

      const beforeInput = (event) => {
        if (!isMoneyInput(el)) return
        const type = event.inputType || ''
        const editable = type.startsWith('insert') || type.startsWith('delete')
        if (!editable) return
        if (type === 'insertText' && !event.data) return

        const actual = nativeValue.get.call(el)
        const start = el.selectionStart ?? actual.length
        const end = el.selectionEnd ?? start
        const raw = rawValues.get(el) ?? digits(actual)
        const rawStart = rawIndexFromCaret(actual, start)
        const rawEnd = rawIndexFromCaret(actual, end)
        let next = raw
        let nextCaret = rawStart

        if (type.startsWith('insert')) {
          const inserted = digits(event.data || '')
          next = raw.slice(0, rawStart) + inserted + raw.slice(rawEnd)
          nextCaret = rawStart + inserted.length
        } else if (type === 'deleteContentBackward') {
          if (rawStart !== rawEnd) {
            next = raw.slice(0, rawStart) + raw.slice(rawEnd)
            nextCaret = rawStart
          } else if (rawStart > 0) {
            next = raw.slice(0, rawStart - 1) + raw.slice(rawStart)
            nextCaret = rawStart - 1
          }
        } else if (type === 'deleteContentForward') {
          if (rawStart !== rawEnd) {
            next = raw.slice(0, rawStart) + raw.slice(rawEnd)
            nextCaret = rawStart
          } else {
            next = raw.slice(0, rawStart) + raw.slice(rawStart + 1)
            nextCaret = rawStart
          }
        } else return

        event.preventDefault()
        rawValues.set(el, next)
        const formatted = format(next)
        nativeValue.set.call(el, formatted)
        const caret = caretFromRawIndex(formatted, nextCaret)
        requestAnimationFrame(() => {
          try { el.setSelectionRange(caret, caret) } catch {}
        })
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }

      el.addEventListener('beforeinput', beforeInput)
    }

    const scan = () => document.querySelectorAll('input').forEach(patch)
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
