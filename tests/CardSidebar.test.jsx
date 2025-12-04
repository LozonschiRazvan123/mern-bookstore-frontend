// tests/CardSidebar.test.jsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CardSidebar from '../src/components/CardSidebar'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// Mock pentru axios
vi.mock('axios')

describe('CardSidebar – Functionalitati Cos Cumparaturi', () => {
  // Item de coș de test
  const mockCartItems = [
    {
      productId: 101,
      title: 'MongoDB: The Definitive Guide',
      author: 'Shannon Bradshaw',
      price: 39.99,
      quantity: 2,
      imageUrl: 'test-image.jpg'
    }
  ]

  const mockCart = {
    items: mockCartItems,
    total: 79.98,
    totalItems: 2
  }

  const mockOnClose = vi.fn()

  const mockCartResponse = {
    data: { success: true, cart: mockCart }
  }

  const mockEmptyCartResponse = {
    data: {
      success: true,
      cart: { items: [], total: 0, totalItems: 0 }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    global.alert = vi.fn()
  })

  // Helper pentru randare
  const renderComponent = (isOpen = true) =>
    render(
      <BrowserRouter>
        <CardSidebar isOpen={isOpen} onClose={mockOnClose} />
      </BrowserRouter>
    )

  // ───────────────────────── Teste ─────────────────────────

  it('nu ar trebui să fie vizibil când isOpen este false', () => {
    renderComponent(false)
    expect(
      screen.queryByText('Coșul de cumpărături')
    ).not.toBeInTheDocument()
  })

  it('ar trebui să afișeze coșul cu produse când este deschis', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(
        screen.getByText('Coșul de cumpărături')
      ).toBeInTheDocument()
      expect(
        screen.getByText('MongoDB: The Definitive Guide')
      ).toBeInTheDocument()
      expect(screen.getByText('de Shannon Bradshaw')).toBeInTheDocument()
    })
  })

  it('ar trebui să afișeze coșul gol corect', async () => {
    axios.get.mockResolvedValueOnce(mockEmptyCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(screen.getByText('Coșul tău este gol')).toBeInTheDocument()
      expect(
        screen.getByText('Adaugă produse din catalog')
      ).toBeInTheDocument()
    })
  })

  it('ar trebui să afișeze totalurile corecte', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(screen.getByText('Total produse: 2')).toBeInTheDocument()
      expect(screen.getByText(/79.98 RON/)).toBeInTheDocument()
    })
  })

  it('ar trebui să închidă sidebar-ul la click pe overlay', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(
        screen.getByText('Coșul de cumpărături')
      ).toBeInTheDocument()
    })

    const overlay = document.querySelector('.card-sidebar-overlay')
    fireEvent.click(overlay)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('ar trebui să închidă sidebar-ul la click pe butonul de închidere', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(
        screen.getByText('Coșul de cumpărături')
      ).toBeInTheDocument()
    })

    // Acum butonul are textul "x"
    const closeButton = screen.getByText('X')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('ar trebui să afișeze butonul de checkout cu prețul corect', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    const expectedPrice = (mockCart.total + 19.99).toFixed(2) // 99.97

    await waitFor(() => {
      expect(
        screen.getByText(`Finalizează comanda – ${expectedPrice} RON`)
      ).toBeInTheDocument()
    })
  })

  it('ar trebui să gestioneze checkout-ul cu succes fără erori', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    // Simulăm un răspuns OK de la /create-checkout-session
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        sessionUrl: 'https://checkout.stripe.com/session_123'
      })
    })

    // Simulare window.location
    const originalLocation = window.location
    delete window.location
    window.location = { href: '' }

    renderComponent(true)

    const expectedPrice = (mockCart.total + 19.99).toFixed(2)

    await waitFor(() => {
      expect(
        screen.getByText(`Finalizează comanda – ${expectedPrice} RON`)
      ).toBeInTheDocument()
    })

    const checkoutButton = screen.getByText(
      `Finalizează comanda – ${expectedPrice} RON`
    )
    fireEvent.click(checkoutButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Restaurăm location
    window.location = originalLocation
  })

  it('ar trebui să afișeze butoanele de ștergere pentru produse', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(
        screen.getByText('MongoDB: The Definitive Guide')
      ).toBeInTheDocument()
      expect(screen.getByText('Șterge')).toBeInTheDocument()
    })
  })

  it('ar trebui să afișeze informațiile complete ale produselor', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    await waitFor(() => {
      expect(
        screen.getByText('MongoDB: The Definitive Guide')
      ).toBeInTheDocument()
      expect(screen.getByText('de Shannon Bradshaw')).toBeInTheDocument()
      expect(screen.getByText('39.99 RON')).toBeInTheDocument()
      expect(screen.getByText('x 2')).toBeInTheDocument()
    })
  })

  it('ar trebui să afișeze butonul de checkout enabled inițial', async () => {
    axios.get.mockResolvedValueOnce(mockCartResponse)

    renderComponent(true)

    const expectedPrice = (mockCart.total + 19.99).toFixed(2)

    await waitFor(() => {
      const checkoutButton = screen.getByText(
        `Finalizează comanda – ${expectedPrice} RON`
      )
      expect(checkoutButton).not.toBeDisabled()
    })
  })
})
