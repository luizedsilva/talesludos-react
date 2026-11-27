import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Header from './components/Header'
import Home from './pages/Home'
import GameList from './pages/GameList'
import GameForm from './pages/GameForm'
import GameDetails from './pages/GameDetails'
import MapEditor from './pages/MapEditor'
import NotFound from './pages/NotFound'

export default function App() {
  // A página inicial (landing) tem layout próprio, sem o cabeçalho do editor.
  const { pathname } = useLocation()
  if (pathname === '/') {
    return <Home />
  }

  return (
    <>
      <Header />
      <main className="container-fluid px-3 pb-4">
        <Routes>
          <Route path="/jogos" element={<GameList />} />
          {/* id = "novo" para criar um jogo */}
          <Route path="/jogos/:id/dados" element={<GameForm />} />
          <Route path="/jogos/:id/mapa" element={<MapEditor />} />
          <Route path="/jogos/:id" element={<GameDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  )
}
