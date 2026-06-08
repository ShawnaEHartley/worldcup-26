import { GoalLineCanvas } from './components/GoalLineCanvas'

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>World Cup Shot Explorer</h1>
      </header>
      <div className="canvas-wrapper">
        <GoalLineCanvas />
      </div>
    </main>
  )
}

export default App
