import { useSidebarContext } from './context/SidebarContext'
import { Header } from './components/Header/Header'
import { Sidebar } from './components/Sidebar/Sidebar'

function App() {
  const { isOpen } = useSidebarContext()

  return (
    <div className="app">
      <Header />
      <Sidebar />
      <main
        className={`app-main ${isOpen ? 'app-main--sidebar-open' : ''}`}
        id="main-content"
      >
        <h1>Agentis Hub Dashboard</h1>
        <p>Multi-agent workflow management dashboard</p>
      </main>
    </div>
  )
}

export default App
