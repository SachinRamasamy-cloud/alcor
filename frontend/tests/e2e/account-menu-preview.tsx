// Explicit presentation fixture: no authentication, private reads or logout call.
import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {BrowserRouter,useLocation} from 'react-router-dom'
import {AccountMenu} from '../../src/widgets/account-menu'
import '../../src/styles.css'
function Preview(){const [signedOut,setSignedOut]=useState(false),location=useLocation();return <><header className="site-header"><div className="shell header-inner"><a className="wordmark" href="/">ALCOR</a><div className="header-actions"><AccountMenu name="Sachin Ramasamy" onSignOut={async()=>setSignedOut(true)}/></div></div></header><main className="shell page-body"><h1>Account navigation fixture</h1><p data-testid="route">{location.pathname}{location.search}</p>{signedOut&&<p role="status">Sign out requested</p>}</main></>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Preview/></BrowserRouter>)
