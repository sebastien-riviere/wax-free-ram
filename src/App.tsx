import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from '@/components/wallet/WalletProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Faucet from '@/pages/Faucet'
import Burn from '@/pages/Burn'
import Farming from '@/pages/Farming'
import Market from '@/pages/Market'
import Leaderboard from '@/pages/Leaderboard'
import Stats from '@/pages/Stats'
import Vote from '@/pages/Vote'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="faucet" element={<Faucet />} />
            <Route path="burn" element={<Burn />} />
            <Route path="farming" element={<Farming />} />
            <Route path="market" element={<Market />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="stats" element={<Stats />} />
            <Route path="vote" element={<Vote />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  )
}
