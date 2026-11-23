import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

describe('App', () => {
  it('renders the placeholder route', async () => {
    render(<App initialEntries={['/']} />)
    expect(await screen.findByRole('heading', { name: 'Astoren Wallet' })).toBeTruthy()
  })
})
