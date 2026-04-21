import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AuthProvider wraps the whole app so any component can access auth state */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)