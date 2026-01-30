// src/views/TrainingData/TrainingData.js
import React, { useState, useRef, useEffect } from 'react';
import './TrainingData.css';
import Papa from 'papaparse';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// const BASE_URL = 'http://127.0.0.1:5000';
const REQUIRED_COLUMNS = [
  'School Name',
  'Kind of business associated',
  'Company Name',
  'Sponsored',
  'Annual Revenue',
  'Profit Margins',
  'Market Valuation',
  'Market Share',
  'Industry Ranking',
  'Distance',
  'University Student Size',
  'University Ranking',
  'Annual Revenue in Log',
  'Market Valuation in Log',
  'SIC code'
];

const exampleDataset = [
  {
    'School Name': 'University of Wisconsin-Milwaukee',
    'Kind of business associated': 'Technology',
    'Company Name': 'Microsoft Corporation',
    'Sponsored': '1',
    'Annual Revenue': '184000000000',
    'Profit Margins': '0.38',
    'Market Valuation': '2100000000000',
    'Market Share': '0.25',
    'Industry Ranking': '1',
    'Distance': '5.1',
    'University Student Size': '24000',
    'University Ranking': '80',
    'Annual Revenue in Log': '26.93787',
    'Market Valuation in Log': '27.63102',
    'SIC code': '7372'
  },
  {
    'School Name': 'University of Illinois Urbana-Champaign',
    'Kind of business associated': 'Retail',
    'Company Name': 'Walmart Inc.',
    'Sponsored': '0',
    'Annual Revenue': '572000000000',
    'Profit Margins': '0.02',
    'Market Valuation': '410000000000',
    'Market Share': '0.34',
    'Industry Ranking': '4',
    'Distance': '3.2',
    'University Student Size': '33000',
    'University Ranking': '50',
    'Annual Revenue in Log': '27.27121',
    'Market Valuation in Log': '26.73659',
    'SIC code': '5411'
  },
  {
    'School Name': 'University of Michigan',
    'Kind of business associated': 'Automobile',
    'Company Name': 'Ford Motor Company',
    'Sponsored': '1',
    'Annual Revenue': '160000000000',
    'Profit Margins': '0.04',
    'Market Valuation': '60000000000',
    'Market Share': '0.19',
    'Industry Ranking': '7',
    'Distance': '1.8',
    'University Student Size': '46000',
    'University Ranking': '25',
    'Annual Revenue in Log': '26.80239',
    'Market Valuation in Log': '24.69900',
    'SIC code': '3711'
  }
];

const TrainingData = ({ user }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [page, setPage] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef(null);
  const rowsPerPage = 5;
const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/list-training-data`)
      .then((res) => res.json())
      .then((data) => setDatasets((data.datasets || []).reverse()))
      .catch(() => toast.error('❌ Failed to load training datasets'));
  }, []);
useEffect(() => {
  setLoading(true);
  const timeout = setTimeout(() => setLoading(false), 2000);
  return () => clearTimeout(timeout);
}, []);
  const validateCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: function (results) {
          const actualHeaders = results.meta.fields;
          const missing = REQUIRED_COLUMNS.filter(col => !actualHeaders.includes(col));
          if (missing.length === 0) resolve(true);
          else reject(`Missing columns: ${missing.join(', ')}`);
        },
        error: (err) => reject(err.message)
      });
    });
  };

  const handleReplace = async () => {
    if (!csvFile) {
      toast.error('❌ No file selected');
      return;
    }

    setIsValidating(true);
    toast.info('🔍 Validating your CSV...');
    await new Promise((res) => setTimeout(res, 2000));

    try {
      await validateCSV(csvFile);

      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('done_by', user?.name || 'Unknown');

      const response = await fetch(`${BASE_URL}/api/upload-data`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`✅ Upload complete: ${result.status}`);
        setCsvFile(null);
        const data = await fetch(`${BASE_URL}/api/list-training-data`).then((res) => res.json());
        setDatasets((data.datasets || []).reverse());
      } else {
        toast.error(`❌ Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`❌ Validation failed: ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      setCsvFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = (downloadUrl) => {
    if (downloadUrl) {
      // Convert HTTP to HTTPS if needed (for mixed content issues)
      let url = downloadUrl;
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }
      // Open download URL in new window/tab
      window.open(url, '_blank');
    } else {
      toast.error('❌ Download URL not available');
    }
  };

  const paginatedData = datasets.slice((page - 1) * rowsPerPage, page * rowsPerPage);
return (
  <div className="training-dataset-container">
    <ToastContainer />
    {loading ? (
      <div className="loader-section">
        <div className="spinner"></div>
        <p>🌀 Hold tight, loading some data magic...</p>
      </div>
    ) : (
      <>
            <div className="training-upload-wrapper">
      <ToastContainer />
      <div className='training-data-header'>
      <h2> Sample Training Data Format</h2>
      <table className="dataset-table">
        <thead>
          <tr>{REQUIRED_COLUMNS.map((col, i) => <th key={i}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {exampleDataset.map((row, idx) => (
            <tr key={idx}>
              {REQUIRED_COLUMNS.map((col, i) => <td key={i}>{row[col]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      </div>


      <h2 style={{ marginTop: '2rem' }}> Upload Your Own Training Dataset</h2>
      <p>Drag & drop CSV files or click to browse</p>

      <div className={`upload-box ${isValidating ? 'disabled' : ''}`}
           onClick={() => !isValidating && fileInputRef.current.click()}
           onDragOver={(e) => e.preventDefault()}
           onDrop={handleDrop}>
        <div className="upload-icon-emoji">📁</div>
        <p className="drop-title">Drop files here</p>
        <p className="supported-formats">Supported: CSV (Max 5MB)</p>
        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }}
               onChange={(e) => setCsvFile(e.target.files[0])} />
      </div>

      {csvFile && (
        <div className="selected-file">
          <strong>📄 Selected File:</strong> {csvFile.name}
        </div>
      )}

      <button className="upload-btn" onClick={handleReplace} disabled={isValidating}>
        {isValidating ? 'Validating...' : 'Upload'}
      </button>
      <div className='upload-status'>
              <h2 style={{ marginTop: '2rem' }}>Recently Uploaded Datasets</h2>
      <table className="dataset-table">
        <thead>
          <tr>
            <th>Dataset Name</th>
            <th>Rows</th>
            <th>Uploaded At</th>
            <th>Uploaded By</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((ds, i) => (
            <tr key={i}>
              <td>{ds.filename}</td>
              <td>{ds.num_rows || '—'}</td>
              <td>{new Date(ds.uploaded_at).toLocaleString()}</td>
              <td>{ds.done_by || '—'}</td>
              <td><button onClick={() => handleDownload(ds.download_url)} disabled={!ds.download_url}>⬇️ Download</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {datasets.length > rowsPerPage && (
        <div className="pagination-controls">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(datasets.length / rowsPerPage)}</span>
          <button disabled={page === Math.ceil(datasets.length / rowsPerPage)} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
      </div>

    </div>
      </>
    )}
  </div>
);






  
};

export default TrainingData;
