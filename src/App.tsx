import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Home from './pages/Home'
import Community from './pages/Community'
import Submit from './pages/Submit'
import Featured from './pages/Featured'
import Detailed from './pages/Detailed'
import Tags from './pages/Tags'
import About from './pages/About'
import Discover from './pages/Discover'
import Explore from './pages/Explore'
import News from './pages/News'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Admin from './pages/Admin'
import Category from './pages/Category'
import SoftwareDetail from './pages/SoftwareDetail'

function TagRedirect() {
  const { tag } = useParams()
  return <Navigate to={`/category/${tag}`} replace />
}

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
        <Route path="/about" element={<About />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/news" element={<News />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/category/:category" element={<Category />} />
        <Route path="/tags/:tag" element={<TagRedirect />} />
        <Route path="/software/:id" element={<SoftwareDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
