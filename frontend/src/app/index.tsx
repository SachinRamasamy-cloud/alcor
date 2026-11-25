import { PreferenceEffects } from '../features/preferences'
import { BackendProvider } from '../shared/api/backend'
import { Component, lazy, type ReactNode } from 'react'
import { BrowserRouter,Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { AuthProvider,useAuth } from '../shared/auth'
import { FeedbackProvider } from '../shared/feedback'
import {createAppQueryClient} from '../shared/api/query-client'
import { ErrorState } from '../shared/ui'
import { Layout } from '../widgets/layout'
import {FlyToTargetProvider} from '../shared/motion'

const Home = lazy(() => import('../pages/public').then(m => ({ default: m.HomePage })))
const Catalogue = lazy(() => import('../pages/public').then(m => ({ default: m.CataloguePage })))
const Browse = lazy(()=>import('../pages/browse').then(m=>({default:m.BrowsePage})))
const Details = lazy(() => import('../pages/public').then(m => ({ default: m.DetailsPage })))
const Personal = lazy(() => import('../pages/account').then(m => ({ default: m.LibraryPage })))
const Favorites = lazy(()=>import('../pages/favorites').then(m=>({default:m.FavoritesPage})))
const Recommendations = lazy(()=>import('../pages/recommendations').then(m=>({default:m.RecommendationsPage})))
const Callback = lazy(() => import('../pages/account').then(m => ({ default: m.AuthCallbackPage })))
const Complete = lazy(() => import('../pages/account').then(m => ({ default: m.AuthCompletePage })))
const Password = lazy(() => import('../pages/account').then(m => ({ default: m.PasswordPage })))
const Setup = lazy(() => import('../pages/setup').then(m => ({ default: m.SetupPage })))
const Dashboard = lazy(() => import('../pages/dashboard').then(m => ({ default: m.DashboardPage })))
const Collections = lazy(() => import('../pages/collections').then(m => ({default:m.CollectionsPage})))
const History = lazy(() => import('../pages/reports').then(m=>({default:m.HistoryPage})))
const Statistics = lazy(() => import('../pages/reports').then(m=>({default:m.StatisticsPage})))
const Settings = lazy(() => import('../pages/settings').then(m=>({default:m.SettingsPage})))
const Profile = lazy(() => import('../pages/settings').then(m=>({default:m.ProfilePage})))
const Info = lazy(() => import('../pages/public').then(m => ({ default: m.InfoPage })))
const queryClient = createAppQueryClient()
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <ErrorState /> : this.props.children }
}
function Index(){return <Home/>}
function AccountMotion({children}:{children:ReactNode}){const{userId}=useAuth();return <FlyToTargetProvider scopeKey={userId??'guest'}>{children}</FlyToTargetProvider>}
export function App() {
  return <Boundary><QueryClientProvider client={queryClient}><LazyMotion features={domAnimation}><MotionConfig reducedMotion="user"><BrowserRouter><FeedbackProvider><BackendProvider><AuthProvider><PreferenceEffects><AccountMotion><Routes><Route element={<Layout />}>
    <Route index element={<Index />} /><Route path="dashboard" element={<Dashboard/>}/>{['anime','manga'].map(path=><Route key={path} path={path} element={<Browse/>}/>)}{['search', 'discover'].map(path => <Route key={path} path={path} element={<Catalogue />} />)}
    <Route path="anime/:id" element={<Details />} /><Route path="manga/:id" element={<Details />} />
    <Route path="auth/complete" element={<Complete/>}/><Route path="auth/password" element={<Password/>}/>
    <Route path="setup" element={<Setup/>}/>
    <Route path="favorites" element={<Favorites/>}/>
    <Route path="recommendations" element={<Recommendations/>}/>
    <Route path="auth/callback" element={<Callback />} /><Route path="settings" element={<Settings />} /><Route path="profile" element={<Profile />} /><Route path="history" element={<History />} /><Route path="statistics" element={<Statistics />} /><Route path="collections" element={<Collections />} /><Route path="collections/:id" element={<Collections />} /><Route path="library" element={<Personal />} /><Route path="wishlist" element={<Personal />} /><Route path="*" element={<Info />} />
  </Route></Routes></AccountMotion></PreferenceEffects></AuthProvider></BackendProvider></FeedbackProvider></BrowserRouter></MotionConfig></LazyMotion></QueryClientProvider></Boundary>
}
