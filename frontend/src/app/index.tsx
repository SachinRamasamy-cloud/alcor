import { PreferenceEffects } from '../features/preferences'
import { Component, Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { AuthProvider } from '../shared/auth'
import { FeedbackProvider } from '../shared/feedback'
import { ApiError } from '../shared/api/client'
import { ErrorState, Loading } from '../shared/ui'
import { Layout } from '../widgets/layout'

const Home = lazy(() => import('../pages/public').then(m => ({ default: m.HomePage })))
const Catalogue = lazy(() => import('../pages/public').then(m => ({ default: m.CataloguePage })))
const Details = lazy(() => import('../pages/public').then(m => ({ default: m.DetailsPage })))
const Personal = lazy(() => import('../pages/account').then(m => ({ default: m.LibraryPage })))
const Callback = lazy(() => import('../pages/account').then(m => ({ default: m.AuthCallbackPage })))
const Collections = lazy(() => import('../pages/collections').then(m => ({default:m.CollectionsPage})))
const History = lazy(() => import('../pages/reports').then(m=>({default:m.HistoryPage})))
const Statistics = lazy(() => import('../pages/reports').then(m=>({default:m.StatisticsPage})))
const Settings = lazy(() => import('../pages/settings').then(m=>({default:m.SettingsPage})))
const Profile = lazy(() => import('../pages/settings').then(m=>({default:m.ProfilePage})))
const Info = lazy(() => import('../pages/public').then(m => ({ default: m.InfoPage })))
const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: (count, error) => count < 1 && (!(error instanceof ApiError) || error.status >= 500) } } })
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <ErrorState /> : this.props.children }
}
export function App() {
  return <Boundary><QueryClientProvider client={queryClient}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="user"><BrowserRouter><FeedbackProvider><AuthProvider><PreferenceEffects><Suspense fallback={<Loading />}><Routes><Route element={<Layout />}>
    <Route index element={<Home />} />{['anime', 'manga', 'search', 'discover'].map(path => <Route key={path} path={path} element={<Catalogue />} />)}
    <Route path="anime/:id" element={<Details />} /><Route path="manga/:id" element={<Details />} />
    <Route path="auth/callback" element={<Callback />} /><Route path="settings" element={<Settings />} /><Route path="profile" element={<Profile />} /><Route path="history" element={<History />} /><Route path="statistics" element={<Statistics />} /><Route path="collections" element={<Collections />} /><Route path="collections/:id" element={<Collections />} /><Route path="library" element={<Personal />} /><Route path="wishlist" element={<Personal />} /><Route path="*" element={<Info />} />
  </Route></Routes></Suspense></PreferenceEffects></AuthProvider></FeedbackProvider></BrowserRouter></MotionConfig></LazyMotion></QueryClientProvider></Boundary>
}
