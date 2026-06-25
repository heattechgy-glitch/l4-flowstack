import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import Projects from "@/pages/Projects";
import TaskBoard from "@/pages/TaskBoard";

function NavBar() {
  const location = useLocation();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
              <Zap className="w-6 h-6 text-sky-500" />
            </div>
            <span className="text-xl font-bold text-white">FlowStack</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === "/"
                  ? "bg-sky-500 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              Projects
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Projects />} />
            <Route path="/projects/:id" element={<TaskBoard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;