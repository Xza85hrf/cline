import React, { useState } from 'react';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { SearchInput } from 'components/common/SearchInput';
import MarkdownBlock from '../common/MarkdownBlock';
import './DocumentationView.css';
import { ExtensionState } from '../../shared/ExtensionMessage';

interface DocumentationItem {
  title: string;
  content: string;
  category: string;
}

export const DocumentationView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentationItem | null>(null);
  const context = useExtensionState();
  const state = context as unknown as ExtensionState;

  const documentation: DocumentationItem[] = [
    {
      title: 'Introduction to DeepSeek',
      content: state.documentation?.introduction || '',
      category: 'Getting Started'
    },
    {
      title: 'API Reference',
      content: state.documentation?.apiReference || '',
      category: 'API'
    },
    {
      title: 'Error Codes',
      content: state.documentation?.errorCodes || '',
      category: 'Troubleshooting'
    },
    {
      title: 'Rate Limits',
      content: state.documentation?.rateLimits || '',
      category: 'API'
    },
    {
      title: 'Models & Pricing',
      content: state.documentation?.modelsPricing || '',
      category: 'Reference'
    }
  ];

  const filteredDocs = documentation.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="documentation-view">
      <div className="documentation-search">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search documentation..."
        />
      </div>

      <div className="documentation-content">
        <div className="documentation-list">
          {filteredDocs.map((doc, index) => (
            <div
              key={index}
              className={`documentation-item ${selectedDoc === doc ? 'active' : ''}`}
              onClick={() => setSelectedDoc(doc)}
            >
              <h3>{doc.title}</h3>
              <span className="documentation-category">{doc.category}</span>
            </div>
          ))}
        </div>

        <div className="documentation-detail">
          {selectedDoc ? (
            <MarkdownBlock markdown={selectedDoc.content} />
          ) : (
            <div className="documentation-placeholder">
              Select a documentation item to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
