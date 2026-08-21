'use client'

import { useState } from 'react'
import './client.css'

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" className="client-press-start" onClick={() => setCount(c => c + 1)}>
      count is
      {' '}
      {count}
    </button>
  )
}
