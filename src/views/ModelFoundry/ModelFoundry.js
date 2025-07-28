import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './ModelFoundry.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const funMessages = [
  'Training our tiny robot brains...',
  'Fetching models from hyperspace...',
  'Aligning tensors and optimism...',
  'Loading data, sipping coffee...',
  'Herding neural nets into formation...',
];

// CustomDropdown: A custom dropdown with search, keyboard navigation, and single select
function CustomDropdown({ label, items, selected, onSelect, displayKey }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlighted, setHighlighted] = React.useState(0);
  const ref = React.useRef();

  // Filter items by search
  const filtered = items.filter(item => {
    const labelText = typeof displayKey(item) === 'string'
      ? displayKey(item)
      : (displayKey(item).props?.children?.[0]?.props?.children || '').toLowerCase();
    return labelText.toLowerCase().includes(search.toLowerCase());
  });

  // Handle outside click
  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted(h => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) {
        onSelect(filtered[highlighted]);
        setOpen(false);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      e.preventDefault();
    }
  }

  // Find selected label
  const selectedLabel = selected ? displayKey(selected) : 'Select...';

  return (
    <div className="custom-dropdown" ref={ref} tabIndex={0} onKeyDown={handleKeyDown} style={{ position: 'relative' }}>
      <div className="dropdown-label">{label}</div>
      <div
        className="dropdown-selected"
        onClick={() => setOpen(o => !o)}
        style={{
          border: open ? '1.5px solid #4a90e2' : '1px solid #555',
          background: 'linear-gradient(135deg, #404040 0%, #353535 100%)',
          borderRadius: 8,
          color: '#e0e0e0',
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{selectedLabel}</span>
        <span style={{ marginLeft: 10, fontSize: 14, color: '#aaa' }}>{open ? '\u25B2' : '\u25BC'}</span>
      </div>
      {open && (
        <div
          className="dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            background: 'linear-gradient(135deg, #2d2d2d 0%, #252525 100%)',
            border: '1.5px solid #4a90e2',
            borderRadius: 8,
            marginTop: 4,
            zIndex: 3000,
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          <input
            className="dropdown-search"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderBottom: '1px solid #555',
              background: '#404040',
              color: '#e0e0e0',
              fontSize: 14,
              outline: 'none',
              borderRadius: '8px 8px 0 0',
              boxSizing: 'border-box',
            }}
            autoFocus
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setHighlighted(0);
            }}
            placeholder="Search..."
            onKeyDown={e => e.stopPropagation()}
          />
          {filtered.length === 0 && (
            <div className="dropdown-item disabled" style={{ color: '#888', padding: '12px 16px' }}>
              No results
            </div>
          )}
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className={`dropdown-item${idx === highlighted ? ' highlighted' : ''}${selected === item ? ' selected' : ''}`}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                color:
                  selected === item
                    ? '#fff'
                    : idx === highlighted
                    ? '#fff'
                    : '#e0e0e0',
                background:
                  selected === item
                    ? '#4a90e2'
                    : idx === highlighted
                    ? '#333'
                    : 'transparent',
                fontWeight: selected === item ? 600 : 400,
                borderBottom: '1px solid #404040',
                transition: 'all 0.2s',
              }}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseDown={e => {
                e.preventDefault();
                onSelect(item);
                setOpen(false);
              }}
            >
              {displayKey(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const modelTypeMap = {
  'logistic': 'Logistic',
  'randomforest': 'RandomForest',
  'xgboost': 'XGBoost'
};

const ModelFoundry = ({ user }) => {
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(true);
  const [funMessage, setFunMessage] = useState('');
  const [activeModelTab, setActiveModelTab] = useState('logistic');

  // Fetch datasets once, fetch models on tab change
  useEffect(() => {
    const randomMsg = funMessages[Math.floor(Math.random() * funMessages.length)];
    setFunMessage(randomMsg);
    async function fetchDatasets() {
      try {
        const datasetRes = await fetch(`${BASE_URL}/api/list-training-data`);
        const datasetData = await datasetRes.json();
        const allDatasets = datasetData.datasets || [];
        setDatasets(allDatasets);
        const latestDataset = [...allDatasets].sort((a, b) =>
          new Date(b.uploaded_at) - new Date(a.uploaded_at)
        )[0];
        if (latestDataset) setSelectedDataset(latestDataset);
      } catch (err) {
        toast.error('Failed to load datasets.');
      }
    }
    fetchDatasets();
  }, []);

  // Fetch models when tab changes
  useEffect(() => {
    async function fetchModels() {
      setLoadingOverlay(true);
      try {
        const apiType = modelTypeMap[activeModelTab] || 'Logistic';
        const modelRes = await fetch(`${BASE_URL}/api/list-models?model_type=${apiType}`);
        const modelData = await modelRes.json();
        const allModels = modelData.models || [];
        setModels(allModels);
        const currentModel = allModels.find((m) => m.status === 'Current');
        if (currentModel) setSelectedModel(currentModel);
      } catch (err) {
        toast.error('Failed to load models.');
      } finally {
        setLoadingOverlay(false);
      }
    }
    fetchModels();
  }, [activeModelTab]);

  const handleTrain = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset before training.');
      return;
    }

    setIsTraining(true);
    setLoadingOverlay(true);
    setFunMessage('Crunching numbers like a caffeinated mathematician...');
    try {
      let trainEndpoint = '/api/train-model-logistic';
      if (activeModelTab === 'randomforest') trainEndpoint = '/api/train-model-random-forest';
      if (activeModelTab === 'xgboost') trainEndpoint = '/api/train-model-xgboost';
      const res = await fetch(`${BASE_URL}${trainEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: selectedDataset.dataset_id,
          done_by: user?.name || 'Unknown'
        }),
      });

      const data = await res.json();
      res.ok
        ? toast.success(`Training complete: ${data.message}`)
        : toast.error(`Training failed: ${data.error}`);
    } catch (err) {
      toast.error(`Training error: ${err.message}`);
    } finally {
      setIsTraining(false);
      setLoadingOverlay(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedModel) {
      toast.error('Please select a model to deploy.');
      return;
    }

    setIsDeploying(true);
    setLoadingOverlay(true);
    setFunMessage('Loading your model into the prediction rocket 🚀...');
    try {
      const res = await fetch(`${BASE_URL}/api/deploy-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: selectedModel.model_id,
          model_type: selectedModel.model_type,
          done_by: user?.name || 'Unknown'
        }),
      });

      const data = await res.json();
      res.ok
        ? toast.success(`Deployment success: ${data.message}`)
        : toast.error(`Deployment failed: ${data.error}`);
    } catch (err) {
      toast.error(`Deployment error: ${err.message}`);
    } finally {
      setIsDeploying(false);
      setLoadingOverlay(false);
    }
  };

  const recentTrained = [...models].slice(-4);
  const recentDeployed = [...models].slice(-4);

  return (
    <div className="model-foundry">
      <h2>Model Operations</h2>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="model-tabs">
        <button
          className={activeModelTab === 'logistic' ? 'active' : ''}
          onClick={() => setActiveModelTab('logistic')}
        >
          Logistic Regression
        </button>
        <button
          className={activeModelTab === 'randomforest' ? 'active' : ''}
          onClick={() => setActiveModelTab('randomforest')}
        >
          Random Forest
        </button>
        <button
          className={activeModelTab === 'xgboost' ? 'active' : ''}
          onClick={() => setActiveModelTab('xgboost')}
        >
          XGBoost
        </button>
      </div>
      <div style={{marginBottom: 32}}>
        {activeModelTab === 'logistic' && (
          <div style={{color:'#4a90e2',fontWeight:600,fontSize:'1.2em',padding:'24px 0'}}>Logistic Model Area</div>
        )}
        {activeModelTab === 'randomforest' && (
          <div style={{color:'#4a90e2',fontWeight:600,fontSize:'1.2em',padding:'24px 0'}}>Random Forest Model Area</div>
        )}
        {activeModelTab === 'xgboost' && (
          <div style={{color:'#4a90e2',fontWeight:600,fontSize:'1.2em',padding:'24px 0'}}>XG Boost Model Area</div>
        )}
      </div>

      {loadingOverlay && (
        <div className="overlay-loader">
          <div className="spinner"></div>
          <span className="loader-text">Please wait...</span>
          <span className="loader-fun">{funMessage}</span>
        </div>
      )}

      <div className="operation-section">
        <p className="instruction-text">
          📁 <strong>Choose your training dataset:</strong> Upload or select a dataset below.
        </p>
        <CustomDropdown
          label="Select Dataset"
          items={datasets}
          selected={selectedDataset}
          onSelect={setSelectedDataset}
          displayKey={(ds) => (
            <div>
              <div className="dropdown-title">{ds.filename}</div>
              <div className="dropdown-subtitle">
                {ds.num_rows} rows • Uploaded at {new Date(ds.uploaded_at).toLocaleString()}
              </div>
            </div>
          )}
        />
        <button
          onClick={handleTrain}
          className={`action-button ${isTraining ? 'loading' : ''}`}
          disabled={isTraining}
        >
          {isTraining ? 'Training...' : 'Train Model'}
        </button>
      </div>

      <div className="recent-models-section">
        <h4>Recently Trained Models</h4>
        <table className="recent-models-table">
          <thead><tr><th>Name</th><th>ID</th><th>Trained By</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            {recentTrained.map((m, i) => (
              <tr key={i}>
                <td>{m.model_blob_name}</td>
                <td>{m.model_id}</td>
                <td>{m.done_by || '—'}</td>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td><span className="status-success">Success</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="operation-section">
        <p className="instruction-text">
          🧠 <strong>Switch between trained models:</strong> Select and deploy any previously trained model.
        </p>
        <CustomDropdown
          label="Select Model"
          items={models}
          selected={selectedModel}
          onSelect={setSelectedModel}
          displayKey={(m) => (
            <div>
              <div className="dropdown-title">{m.model_blob_name}</div>
              <div className="dropdown-subtitle">
                Status: {m.status} • Trained on {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          )}
        />
        <button
          onClick={handleDeploy}
          className={`action-button ${isDeploying ? 'loading' : ''}`}
          disabled={isDeploying}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Model'}
        </button>
      </div>

      <div className="recent-models-section">
        <h4>Recently Deployed Models</h4>
        <table className="recent-models-table">
          <thead><tr><th>Name</th><th>ID</th><th>Deployed By</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            {recentDeployed.map((m, i) => (
              <tr key={i}>
                <td>{m.model_blob_name}</td>
                <td>{m.model_id}</td>
                <td>{m.done_by || '—'}</td>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td><span className="status-success">Deployed</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelFoundry;
