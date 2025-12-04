// tests/BookCatalog.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import BookCatalog from '../src/components/BookCatalog'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// Mock pentru axios – înlocuim apelurile reale HTTP
vi.mock('axios')

describe('BookCatalog – Functionalitati de baza', () => {
  // Produs de test comun
  const mockProduct = {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    price: 39.99,
    description: 'Test description',
    category: 'Test',
    imageUrl: 'test.jpg',
    stock: 25,
    specifications: { publisher: 'Test', pages: 100, year: 2023 }
  }

  // Răspuns de test pentru coș (folosit la fetchCartTotal)
  const mockCartResponse = {
    data: { success: true, cart: { totalItems: 0 } }
  }

  let consoleErrorMock

  beforeEach(() => {
    vi.clearAllMocks()

    // implicit, orice axios.get va returna mockCartResponse
    axios.get.mockResolvedValue(mockCartResponse)

    // oprim logurile de eroare în consolă în timpul testelor
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorMock.mockRestore()
  })

  // Helper ca să randăm componenta cu BrowserRouter
  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BookCatalog />
      </BrowserRouter>
    )

  it('încarcă și afișează produsele', async () => {
    // prima chemare de axios.get (pentru produse) -> lista de produse
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, products: [mockProduct] }
      })
      // a doua chemare (pentru /api/cart) -> mockCartResponse
      .mockResolvedValueOnce(mockCartResponse)

    renderComponent()

    // La început trebuie să apară mesajul de loading
    expect(screen.getByText('Se încarcă produsele...')).toBeInTheDocument()

    // După ce promisiunea se rezolvă, produsul trebuie să fie în pagină
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })
  })

  it('afișează interfața de căutare', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, products: [mockProduct] }
      })
      .mockResolvedValueOnce(mockCartResponse)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })

    // SearchFilterSort ar trebui să aibă acest placeholder
    expect(
      screen.getByPlaceholderText(/titlu, autor, descriere/i)
    ).toBeInTheDocument()
  })

  it('afișează mesaj pentru coș gol', async () => {
    // Niciun produs
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, products: [] }
      })
      .mockResolvedValueOnce(mockCartResponse)

    renderComponent()

    await waitFor(() => {
      expect(
        screen.getByText('Nu sunt produse disponibile')
      ).toBeInTheDocument()
    })
  })

  it('gestionează erori API', async () => {
    // Prima chemare (produse) -> eroare
    axios.get
      .mockRejectedValueOnce(new Error('API Error'))
      // a doua chemare (cart) – nu contează, dar o mock-uim totuși
      .mockResolvedValueOnce(mockCartResponse)

    renderComponent()

    await waitFor(() => {
      // mesajul de eroare setat în componentă
      expect(
        screen.getByText('Eroare la încărcarea produselor')
      ).toBeInTheDocument()
    })

    // Componenta ar trebui să fi logat eroarea
    expect(consoleErrorMock).toHaveBeenCalledWith(
      'Eroare la obținerea produselor!:',
      expect.any(Error)
    )
  })

  it('afișează loading inițial', async () => {
    // Controlăm momentul când se rezolvă promisiunea
    let resolvePromise
    const pending = new Promise((res) => {
      resolvePromise = res
    })

    axios.get
      .mockReturnValueOnce(pending) // /api/products
      .mockResolvedValueOnce(mockCartResponse) // /api/cart

    renderComponent()

    // În timp ce promisiunea e pending, trebuie să avem loading
    expect(screen.getByText('Se încarcă produsele...')).toBeInTheDocument()

    // Rezolvăm promisiunea manual
    resolvePromise({
      data: { success: true, products: [mockProduct] }
    })

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })
  })
})
