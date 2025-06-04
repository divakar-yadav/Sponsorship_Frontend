import React, { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import './HomePage.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function HomePage() {
  const [companyData, setCompanyData] = useState([]);
  const [formData, setFormData] = useState({ university: '', company: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [funMessage, setFunMessage] = useState('');
  const dropdownRef = useRef();

  const funMessages = [
    'Crunching logistic curves...',
    'Compiling sponsorship vibes...',
    'Polishing your predictions...',
    'Connecting to funding universe...',
    'Loading models and coffee ☕...',
  ];

  useEffect(() => {
    const msg = funMessages[Math.floor(Math.random() * funMessages.length)];
    setFunMessage(msg);

    Promise.all([
      fetch(`${BASE_URL}/api/companies`)
        .then(res => res.json())
        .then(data => setCompanyData(data.companies || [])),
      fetch(`${BASE_URL}/api/current-model-performance`)
        .then(res => res.json())
        .then(data => {
          const rocData = data.metrics.roc_curve || [];
          setChartData({
            accuracy: data.metrics.accuracy,
            auc: data.metrics.auc,
            precision: data.metrics.precision,
            recall: data.metrics.recall,
            f1_score: data.metrics.f1_score,
            confusionMatrix: data.metrics.confusion_matrix,
            rocCurve: rocData.map(point => [point.fpr, point.tpr])
          });
          setModelInfo({
            model_name: data.model_blob_name,
            model_id: data.model_id,
            last_updated: data.created_at,
            dataset_id: data.dataset_id,
            dataset_name: data.filename
          });
        })
    ])
      .catch(err => console.error("Initial data load failed", err))
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company') {
      const filtered = companyData.filter(c =>
        c['Company Name'].toLowerCase().includes(value.toLowerCase())
      ).slice(0, 4);
      setSuggestions(filtered);
      setShowDropdown(true);
      setFormData(prev => ({ ...prev, company: value }));
    }
  };

  const handleFocus = () => {
    setSuggestions(companyData.slice(0, 4));
    setShowDropdown(true);
  };

  const handleSuggestionClick = (companyObj) => {
    if (!selectedCompanies.some(c => c['Company Name'] === companyObj['Company Name'])) {
      setSelectedCompanies(prev => [...prev, companyObj]);
    }
    setFormData({ company: '' });
    setShowDropdown(false);
  };

  const handleRemoveChip = (name) => {
    setSelectedCompanies(prev => prev.filter(c => c['Company Name'] !== name));
  };

  const handlePredict = () => {
    if (selectedCompanies.length === 0) return;
    setLoading(true);
    setPrediction(null);

    const payload = {
      companies: selectedCompanies.map(c => ({
        "Company Name": c["Company Name"],
        "Annual Revenue in Log": c["Annual Revenue in Log"],
        "Market Valuation in Log": c["Market Valuation in Log"],
        "Profit Margins": c["Profit Margins"],
        "Market Share": c["Market Share"],
        "Industry Ranking": c["Industry Ranking"],
        "Distance": c["Distance"],
        "University Student Size": 12000,
        "University Ranking": 50
      }))
    };

    fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        setPrediction(data.ranked_predictions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Prediction failed", err);
        setLoading(false);
      });
  };

  const confusionMatrixOptions = chartData && {
    chart: { type: 'column' },
    title: { text: 'Confusion Matrix' },
    credits: { enabled: false },
    xAxis: { categories: ['Predicted Positive', 'Predicted Negative'] },
    yAxis: { min: 0, title: { text: 'Count' } },
    series: [
      {
        name: 'Actual Positive',
        data: [
          chartData.confusionMatrix.truePositive,
          chartData.confusionMatrix.falseNegative
        ]
      },
      {
        name: 'Actual Negative',
        data: [
          chartData.confusionMatrix.falsePositive,
          chartData.confusionMatrix.trueNegative
        ]
      }
    ]
  };

  const rocOptions = chartData && {
    title: { text: 'ROC Curve' },
    xAxis: { title: { text: 'False Positive Rate' } },
    yAxis: { title: { text: 'True Positive Rate' } },
    series: [{
      name: 'ROC',
      data: chartData.rocCurve,
      type: 'line'
    }],
    credits: { enabled: false }
  };

  const barOptions = chartData && {
    chart: { type: 'bar' },
    title: { text: 'Precision, Recall, F1, Accuracy' },
    xAxis: { categories: ['Metrics'] },
    yAxis: { min: 0, max: 1 },
    series: [
      { name: 'Precision', data: [chartData.precision] },
      { name: 'Recall', data: [chartData.recall] },
      { name: 'F1 Score', data: [chartData.f1_score] },
      { name: 'Accuracy', data: [chartData.accuracy] }
    ],
    credits: { enabled: false }
  };

  return (
    <div className="homepage-container">
      {initialLoading && (
        <div className="overlay-loader">
          <div className="spinner"></div>
          <span className="loader-text">Please wait...</span>
          <span className="loader-fun">{funMessage}</span>
        </div>
      )}
      <div className="form-section">
        <h2>Company Sponsorship Prediction</h2>
        <div className="home-instruction">
          💡 <strong>How to use this predictor:</strong>
          <ul>
            <li>Start by selecting one or more companies from the input box below.</li>
            <li>Once selected, we’ll analyze each company using our trained model and show you:</li>
            <ul style={{ marginTop: '4px' }}>
              <li><code>Probability of Sponsorship</code> (logistic score)</li>
            </ul>
            <li>📈 <strong>The higher the probability</strong>, the more likely the company is to sponsor your research!</li>
          </ul>
        </div>
        <div className="form-fields">
          <input name="university" value="University of Wisconsin-Milwaukee" readOnly />
          <div className="autocomplete-container" ref={dropdownRef}>
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              onFocus={handleFocus}
              placeholder="Select Company"
              autoComplete="off"
            />
            {showDropdown && suggestions.length > 0 && (
              <ul className="autocomplete-list">
                {suggestions.map((c, i) => {
                  const isSelected = selectedCompanies.some(sel => sel['Company Name'] === c['Company Name']);
                  return (
                    <li key={i} onClick={() => handleSuggestionClick(c)}>
                      {c['Company Name']} {isSelected && <span className="check-mark">✓</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="chip-container">
            {selectedCompanies.map((c, idx) => (
              <span key={idx} className="chip">
                {c['Company Name']}
                <div className="chip-close" onClick={() => handleRemoveChip(c['Company Name'])}>×</div>
              </span>
            ))}
          </div>
          <button onClick={handlePredict}>Predict</button>
          {loading && <p>⏳ Predicting sponsorship probabilities...</p>}
          {!loading && prediction && prediction.length > 0 && (
            <div className="prediction-table">
              <h3>Prediction Results</h3>
              <table>
                <thead><tr><th>Company</th><th>Probability</th></tr></thead>
                <tbody>
                  {prediction.map((entry, i) => (
                    <tr key={i}>
                      <td>{entry.company}</td>
                      <td>{(entry.probability * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {chartData && (
        <div className="charts-section">
          <h2>Model Evaluation Metrics</h2>
          <div className='container-wrapper'>
            {modelInfo && (
              <div className="model-info-section">
                <h3>Model Basic Info</h3>
                <p className="chart-instruction">
                  ℹ️ This section gives you details about the currently active model, including when it was last trained and the dataset it used.
                </p>
                <p><strong>Model Name:</strong> {modelInfo.model_name}</p>
                <p><strong>Status:</strong> <span className="status-badge">🟢 Active</span></p>
                <p><strong>Model ID:</strong> {modelInfo.model_id}</p>
                <p><strong>Last Updated:</strong> {new Date(modelInfo.last_updated).toLocaleString()}</p>
                <p><strong>Dataset Id:</strong> {modelInfo.dataset_id}</p>
                <p><strong>Dataset:</strong> {modelInfo.dataset_name}</p>
              </div>
            )}
            <div className="chart-container">
              <p className="chart-instruction">
                📊 These metrics show how well the model performs: Precision, Recall, F1 Score, and Accuracy.
              </p>
              <HighchartsReact highcharts={Highcharts} options={barOptions} />
            </div>
            <div className="chart-container-3">
              <p className="chart-instruction">
                📈 The ROC curve shows performance trade-offs. The closer the curve is to top-left, the better.
              </p>
              <HighchartsReact highcharts={Highcharts} options={rocOptions} />
            </div>
            <div className="chart-container">
              <p className="chart-instruction">
                🧮 Confusion matrix visualization of actual vs predicted sponsorships.
              </p>
              <HighchartsReact highcharts={Highcharts} options={confusionMatrixOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
