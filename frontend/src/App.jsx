import React, { useState, useEffect } from 'react';
import { FileUp, LogIn, LogOut, UserPlus, FileDown, RefreshCw, Eye, CloudCog } from 'lucide-react';
import axios from 'axios'
import XMLViewer from 'react-xml-viewer'
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [xmlContent, setXmlContent] = useState('');
  const [xmlPreview, setXmlPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Handle Login / Registration
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        fetchConversions();
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout');
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
      setConversions([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Upload PDF
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/file/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        fetchConversions();
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  // Convert PDF to XML
  const handleConvert = async (conversionId) => {
    setIsConverting(true);
    try {
      await fetch(`http://localhost:8000/file/convert/${conversionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      fetchConversions();
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setIsConverting(false);
    }
  };

  // Fetch all conversions
  const fetchConversions = async () => {
    try {
      const response = await fetch('http://localhost:8000/file', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setConversions(data);
    } catch (error) {
      console.error('Fetch conversions error:', error);
    }
  };

  // Preview XML
  const handlePreviewXml = async (conversionId) => {
    try {
      const response = await fetch(`http://localhost:8000/file/${conversionId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      const url = data.xmlUrl;
      if(url){
        const response = await fetch(url);
        const xmlText = await response.text();

        // Parse the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        // Serialize the XML back to string
        const xmlString = new XMLSerializer().serializeToString(xmlDoc);
        console.log(xmlString)
        setXmlContent(xmlString);
      }
      if (data.xmlData) {
        
        setXmlPreview(data.xmlData);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching XML preview:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchConversions();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">PDF to XML Converter</h1>
        {isAuthenticated && (
          <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md">
            <LogOut size={20} />
            Logout
          </button>
        )}
      </nav>

      {/* Auth Section */}
      {/* Auth Section */}
{!isAuthenticated ? (
  <div className="flex items-center justify-center min-h-screen">
    <form onSubmit={handleAuth} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{authMode === 'login' ? 'Login' : 'Register'}</h2>
      {authMode === 'register' && (
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mb-2 p-2 border rounded w-full"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="mb-2 p-2 border rounded w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="mb-4 p-2 border rounded w-full"
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
        {authMode === 'login' ? 'Login' : 'Register'}
      </button>

      {/* Toggle Button */}
      <p className="mt-2 text-sm">
        {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="text-blue-500 underline"
        >
          {authMode === 'login' ? 'Register' : 'Login'}
        </button>
      </p>
    </form>
  </div>
      ) : (
        <div className="max-w-3xl mx-auto p-6">
          {/* File Upload */}
          <div className="bg-white p-4 rounded shadow-md mb-4">
            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
            <button onClick={handleFileUpload} disabled={!selectedFile} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* Conversion List */}
          <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-xl font-bold mb-2">Your Conversions</h2>
            <XMLViewer xml={xmlContent} />
            {conversions.map((conversion) => (
              <div key={conversion._id} className="p-4 border-b flex justify-between">
                <span>{conversion.pdfName}</span>
                <div className="flex gap-2">
                  {!conversion.xmlUrl ? (
                    <button onClick={() => handleConvert(conversion._id)} className="bg-green-500 text-white px-4 py-2 rounded">
                      Convert
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handlePreviewXml(conversion._id)} className="bg-gray-500 text-white px-4 py-2 rounded">
                        <Eye size={18} /> Preview
                      </button>
                      <a href={conversion.xmlUrl} className="bg-blue-500 text-white px-4 py-2 rounded">
                        <FileDown size={18} /> Download
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
