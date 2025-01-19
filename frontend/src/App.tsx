import { useState, useEffect } from 'react'
import { Menu, Loader2, X } from 'lucide-react'
import axios from 'axios'
import clsx from 'clsx'

import { API_URL } from './constants/config'
import ChatInterface from './components/ChatInterface'
import DocumentList from './components/DocumentList'

const DESKTOP_BREAKPOINT = 1024
const SELECTED_DOCUMENT_KEY = 'selectedDocumentId'

interface Document {
  id: number
  title: string
  uploaded_at: string
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/documents/`)
        const sortedDocuments = response.data.sort(
          (a: Document, b: Document) =>
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime(),
        )
        setDocuments(sortedDocuments)

        // Restore selected document if exists
        const savedDocId = localStorage.getItem(SELECTED_DOCUMENT_KEY)
        if (savedDocId) {
          const savedDoc = sortedDocuments.find(
            (doc: Document) => doc.id === parseInt(savedDocId),
          )
          if (savedDoc) {
            setSelectedDocument(savedDoc)
          }
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      }
    }

    fetchDocuments()
  }, [])

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)

    try {
      const response = await axios.post(`${API_URL}/api/documents/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const newDocument = response.data
      const updatedDocuments = [newDocument, ...documents]
      setDocuments(updatedDocuments)
      setSelectedDocument(newDocument)
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setUploadError(
        error.response?.data?.detail ||
          'Error uploading file. Please try again.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await axios.delete(`${API_URL}/api/documents/${documentId}/`)
      setDocuments(documents.filter(doc => doc.id !== documentId))
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null)
      }
    } catch (error: any) {
      console.error('Error deleting document:', error)
      setUploadError(
        error.response?.data?.detail ||
          'Error deleting document. Please try again.',
      )
    }
  }

  return (
    <div className="h-screen flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-white hover:bg-gray-100 border-2 border-gray-200 shadow-lg !outline-none !ring-0 [&:not(:focus-visible)]:outline-none [&:not(:focus-visible)]:ring-0 [&:not(:focus-visible)]:shadow-none active:outline-none active:ring-0"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          'w-72 bg-gray-50 border-r flex-shrink-0',
          'fixed inset-y-0 left-0 z-40 lg:static lg:translate-x-0',
          'transform transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Document Q&A</h2>
            <p className="text-sm text-gray-500">
              AI-powered Document Analysis
            </p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
                className="w-full justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Supported formats: PDF, TXT
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.txt"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                  e.target.value = ''
                }}
              />
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelect={doc => {
                  setSelectedDocument(doc)
                  // Save selection to localStorage
                  if (doc) {
                    localStorage.setItem(
                      SELECTED_DOCUMENT_KEY,
                      doc.id.toString(),
                    )
                  } else {
                    localStorage.removeItem(SELECTED_DOCUMENT_KEY)
                  }
                  // Close sidebar on mobile and tablet
                  if (window.innerWidth < DESKTOP_BREAKPOINT) {
                    setSidebarOpen(false)
                  }
                }}
                onDelete={handleDeleteDocument}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <main className="flex-1 relative h-full">
          <ChatInterface selectedDocument={selectedDocument} />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Error Modal */}
      {uploadError ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Upload Error
              </h3>
              <button
                onClick={() => setUploadError(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">{uploadError}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setUploadError(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
