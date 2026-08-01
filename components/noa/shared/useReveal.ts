'use client'

import { useEffect, useRef } from 'react'

interface AnimatableElement extends HTMLElement {
  _intervalId?: NodeJS.Timeout;
}

function animateCount(el: HTMLElement) {
  const targetVal = el.dataset.val || el.textContent || ''
  const num = parseFloat(targetVal.replace(/[^\d.]/g, ''))
  if (isNaN(num) || num === 0) return

  const element = el as AnimatableElement
  if (element._intervalId) {
    clearInterval(element._intervalId)
  }

  const suffix = targetVal.replace(/[\d.]/g, '')
  const dur = 1200, steps = 40
  let i = 0
  element._intervalId = setInterval(() => {
    i++
    const v = Math.round((num / steps) * i * 10) / 10
    el.textContent = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + suffix
    if (i >= steps) {
      el.textContent = targetVal
      clearInterval(element._intervalId)
      delete element._intervalId
    }
  }, dur / steps)
}

/**
 * Révélation au scroll (IntersectionObserver) + animation des compteurs `.count`.
 * Reprend le pattern de ProfileView d'ATHLETE CV.
 */
export function useReveal(deps: unknown[] = []) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const revealEl = (el: Element) => {
      el.classList.add('in')
      el.querySelectorAll<HTMLElement>('.count').forEach(animateCount)
    }
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  revealEl(e.target)
                  io!.unobserve(e.target)
                }
              })
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
          )
        : null
    root.querySelectorAll<HTMLElement>('.reveal').forEach((el) => (io ? io.observe(el) : revealEl(el)))
    return () => {
      if (io) io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return rootRef
}
