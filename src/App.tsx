import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Community from './pages/Community'
import Submit from './pages/Submit'
import Featured from './pages/Featured'
import Detailed from './pages/Detailed'
import Tags from './pages/Tags'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/community" element={<Community />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/featured" element={<Featured />} />
        <Route path="/detailed" element={<Detailed />} />
      </Routes>
    </BrowserRouter>
  )
}
