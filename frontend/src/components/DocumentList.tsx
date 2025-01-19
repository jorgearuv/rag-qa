import React from 'react'
import { FileText, Trash2 } from 'lucide-react'

import { cn } from '../lib/utils'

interface Document {
  id: number
  title: string
  uploaded_at: string
}

interface DocumentListProps {
  documents: Document[]
  selectedDocument: Document | null
  onSelect: (document: Document | null) => void
  onDelete: (documentId: number) => void
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocument,
  onSelect,
  onDelete,
}) => {
  if (!documents.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No documents uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {documents
        .sort(
          (a, b) =>
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime(),
        )
        .map(doc => (
          <div
            key={doc.id}
            className={cn(
              'group flex items-center gap-2 p-2 hover:bg-gray-100/80 rounded-lg transition-all',
              selectedDocument?.id === doc.id &&
                'bg-blue-50 hover:bg-blue-50/80 ring-1 ring-blue-500/20',
            )}
          >
            <button
              className="flex-1 flex items-center gap-2 min-w-0"
              onClick={() => onSelect(doc)}
            >
              <FileText
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  selectedDocument?.id === doc.id
                    ? 'text-blue-500'
                    : 'text-gray-500',
                )}
              />
              <div className="flex flex-col items-start text-sm min-w-0">
                <span
                  className={cn(
                    'font-medium truncate w-full',
                    selectedDocument?.id === doc.id && 'text-blue-700',
                  )}
                >
                  {doc.title}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            </button>
            <button
              onClick={() => onDelete(doc.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-all"
              title="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  )
}

export default DocumentList
