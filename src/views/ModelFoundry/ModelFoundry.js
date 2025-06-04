import React, { useState, useEffect, useRef } from 'react';
import './ModelFoundry.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const funMessages = [
  'Training our tiny robot brains...',
  'Fetching models from hyperspace...',
  'Aligning tensors and optimism...',
  'Loading data, sipping coffee...',
  'Herding neural nets into formation...',
];

const Dropdown = ({ label, items, selected, onSelect, displayKey }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onSelect(item);
    setOpen(false);
    setSearchTerm('');
  };

  const filteredItems = items.filter((item) =>
    (item.filename || item.model_blob_name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div className="dropdown-label">{label}</div>
      <div className="dropdown-selected" onClick={() => setOpen(!open)}>
        {selected ? displayKey(selected) : 'Select...'}
        <span className="dropdown-arrow">&#9662;</span>
      </div>
      {open && (
        <div className="dropdown-menu">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredItems.map((item) => {
            const isCurrentModel = item.status === 'Current';
            const isLatestDataset =
              items.length > 0 &&
              item.uploaded_at &&
              item.uploaded_at ===
                [...items]
                  .filter((i) => i.uploaded_at)
                  .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))[0]
                  .uploaded_at;

            const highlightClass = isCurrentModel
              ? 'highlight-current'
              : isLatestDataset
              ? 'highlight-latest'
              : '';

            return (
              <div
                key={item.id || item.model_id || item.dataset_id}
                className={`dropdown-item ${highlightClass}`}
                onClick={() => handleSelect(item)}
              >
                {displayKey(item)}
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="dropdown-item disabled">No results found</div>
          )}
        </div>
      )}
    </div>
  );
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

  useEffect(() => {
    const randomMsg = funMessages[Math.floor(Math.random() * funMessages.length)];
    setFunMessage(randomMsg);

    async function fetchOptions() {
      try {
        const datasetRes = await fetch(`${BASE_URL}/api/list-training-data`);
        const modelRes = await fetch(`${BASE_URL}/api/list-models`);

        const datasetData = await datasetRes.json();
        const modelData = await modelRes.json();

        const allDatasets = datasetData.datasets || [];
        const allModels = modelData.models || [];

        setDatasets(allDatasets);
        setModels(allModels);

        const currentModel = allModels.find((m) => m.status === 'Current');
        if (currentModel) setSelectedModel(currentModel);

        const latestDataset = [...allDatasets].sort((a, b) =>
          new Date(b.uploaded_at) - new Date(a.uploaded_at)
        )[0];
        if (latestDataset) setSelectedDataset(latestDataset);
      } catch (err) {
        console.error('Error loading datasets/models:', err);
        toast.error('Failed to load data.');
      } finally {
        setLoadingOverlay(false);
      }
    }

    fetchOptions();
  }, []);

  const handleTrain = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset before training.');
      return;
    }

    setIsTraining(true);
    setLoadingOverlay(true);
    setFunMessage('Crunching numbers like a caffeinated mathematician...');
    try {
      const res = await fetch(`${BASE_URL}/api/train-model`, {
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
          model: selectedModel.model_id,
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
        <Dropdown
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
        <Dropdown
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
