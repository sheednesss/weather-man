import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './lib/wagmi'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Markets } from './pages/Markets'
import { Market } from './pages/Market'
import { Portfolio } from './pages/Portfolio'
import { Profile } from './pages/Profile'
import { Feed } from './pages/Feed'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="markets" element={<Markets />} />
                <Route path="markets/:id" element={<Market />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="profile/:address" element={<Profile />} />
                <Route path="feed" element={<Feed />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
