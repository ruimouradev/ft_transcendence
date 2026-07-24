import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { HelloWorld } from './components'
import Home from './pages/Home'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Home></Home>
  )
}

export default App
