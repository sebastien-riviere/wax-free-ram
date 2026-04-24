import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Droplets,
  Flame,
  Sprout,
  ShoppingBag,
  Trophy,
  BarChart2,
  Vote,
  User,
} from 'lucide-react'
import { TopBar } from '@/components/wallet/TopBar'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/faucet', icon: <Droplets size={18} />, label: 'Faucet' },
  { to: '/burn', icon: <Flame size={18} />, label: 'Burn' },
  { to: '/farming', icon: <Sprout size={18} />, label: 'Farming' },
  { to: '/market', icon: <ShoppingBag size={18} />, label: 'Market' },
  { to: '/leaderboard', icon: <Trophy size={18} />, label: 'Leaderboard' },
  { to: '/stats', icon: <BarChart2 size={18} />, label: 'Stats' },
  { to: '/vote', icon: <Vote size={18} />, label: 'Vote', disabled: true },
  { to: '/profile', icon: <User size={18} />, label: 'Profile' },
]

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 14px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        color: item.disabled ? '#4b5563' : isActive ? '#a78bfa' : '#94a3b8',
        background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
        borderLeft: isActive ? '2px solid #7c3aed' : '2px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        marginLeft: '6px',
        marginRight: '6px',
        pointerEvents: item.disabled ? 'none' : 'auto',
        opacity: item.disabled ? 0.5 : 1,
      })}
      onMouseEnter={e => {
        const el = e.currentTarget
        if (!el.getAttribute('aria-current') && !item.disabled) {
          el.style.background = 'rgba(255, 255, 255, 0.05)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        if (!el.getAttribute('aria-current')) {
          el.style.background = 'transparent'
        }
      }}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.disabled && (
        <span style={{ fontSize: '9px', color: '#f97316', background: 'rgba(249,115,22,0.15)', padding: '1px 5px', borderRadius: 4, marginLeft: 'auto' }}>
          SOON
        </span>
      )}
    </NavLink>
  )
}

function MobileBottomLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      title={item.label}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '10px 0',
        color: isActive ? '#a78bfa' : '#64748b',
        textDecoration: 'none',
        transition: 'color 0.15s ease',
      })}
    >
      {item.icon}
    </NavLink>
  )
}

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <TopBar />

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          bottom: 0,
          width: '224px',
          background: '#12121a',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          flexDirection: 'column',
          zIndex: 40,
          overflowY: 'auto',
        }}
      >
        {/* Sidebar logo */}
        <div
          style={{
            padding: '20px 20px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ZOTVERSE
          </span>
        </div>

        {/* Nav links */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '12px 0',
            flex: 1,
          }}
        >
          {navItems.map(item => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main
        style={{
          paddingTop: '64px',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
        className="md:pl-56"
      >
        <div style={{ padding: '24px', paddingBottom: '80px' }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="flex md:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#12121a',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 40,
          height: '56px',
        }}
      >
        {navItems.map(item => (
          <MobileBottomLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  )
}
