import React, { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [popupCompany, setPopupCompany] = useState(null);
  const [selectedModel, setSelectedModel] = useState(''); // Start with no selection
  const dropdownRef = useRef();
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef();
  const [activeModelTab, setActiveModelTab] = useState('logistic');

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

  // Close model dropdown on outside click
  useEffect(() => {
    const handleClickOutsideModel = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideModel);
    return () => document.removeEventListener('mousedown', handleClickOutsideModel);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company') {
      const filtered = companyData.filter(c =>
        c['Company Name'].toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowDropdown(true);
      setFormData(prev => ({ ...prev, company: value }));
    }
  };

  const handleFocus = () => {
    setSuggestions(companyData);
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

    fetch(`${BASE_URL}/api/predict`, {
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
    chart: { 
      type: 'column',
      backgroundColor: '#2d2d2d',
      style: {
        fontFamily: 'Segoe UI, sans-serif'
      }
    },
    title: { 
      text: 'Confusion Matrix',
      style: {
        color: '#e0e0e0'
      }
    },
    credits: { enabled: false },
    xAxis: { 
      categories: ['Predicted Positive', 'Predicted Negative'],
      labels: {
        style: {
          color: '#e0e0e0'
        }
      },
      lineColor: '#555',
      tickColor: '#555'
    },
    yAxis: { 
      min: 0, 
      title: { 
        text: 'Count',
        style: {
          color: '#e0e0e0'
        }
      },
      labels: {
        style: {
          color: '#e0e0e0'
        }
      },
      gridLineColor: '#555'
    },
    legend: {
      itemStyle: {
        color: '#e0e0e0'
      },
      itemHoverStyle: {
        color: '#4a90e2'
      }
    },
    plotOptions: {
      column: {
        borderColor: '#555'
      }
    },
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
    chart: {
      backgroundColor: '#2d2d2d',
      style: {
        fontFamily: 'Segoe UI, sans-serif'
      }
    },
    title: { 
      text: 'ROC Curve',
      style: {
        color: '#e0e0e0'
      }
    },
    xAxis: { 
      title: { 
        text: 'False Positive Rate',
        style: {
          color: '#e0e0e0'
        }
      },
      labels: {
        style: {
          color: '#e0e0e0'
        }
      },
      lineColor: '#555',
      tickColor: '#555'
    },
    yAxis: { 
      title: { 
        text: 'True Positive Rate',
        style: {
          color: '#e0e0e0'
        }
      },
      labels: {
        style: {
          color: '#e0e0e0'
        }
      },
      gridLineColor: '#555'
    },
    legend: {
      itemStyle: {
        color: '#e0e0e0'
      },
      itemHoverStyle: {
        color: '#4a90e2'
      }
    },
    plotOptions: {
      line: {
        color: '#4a90e2'
      }
    },
    series: [{
      name: 'ROC',
      data: chartData.rocCurve,
      type: 'line'
    }],
    credits: { enabled: false }
  };

  const barOptions = chartData && {
    chart: { 
      type: 'bar',
      backgroundColor: '#2d2d2d',
      style: {
        fontFamily: 'Segoe UI, sans-serif'
      }
    },
    title: { 
      text: 'Precision, Recall, F1, Accuracy',
      style: {
        color: '#e0e0e0'
      }
    },
    xAxis: { 
      categories: ['Metrics'],
      labels: {
        style: {
          color: '#e0e0e0'
        }
      },
      lineColor: '#555',
      tickColor: '#555'
    },
    yAxis: { 
      min: 0, 
      max: 1,
      title: {
        text: 'Score',
        style: {
          color: '#e0e0e0'
        }
      },
      labels: {
        style: {
          color: '#e0e0e0'
        }
      },
      gridLineColor: '#555'
    },
    legend: {
      itemStyle: {
        color: '#e0e0e0'
      },
      itemHoverStyle: {
        color: '#4a90e2'
      }
    },
    plotOptions: {
      bar: {
        borderColor: '#555'
      }
    },
    series: [
      { name: 'Precision', data: [chartData.precision] },
      { name: 'Recall', data: [chartData.recall] },
      { name: 'F1 Score', data: [chartData.f1_score] },
      { name: 'Accuracy', data: [chartData.accuracy] }
    ],
    credits: { enabled: false }
  };

  // Shared Values Chart Options
  const getSharedValuesChartOptions = () => ({
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 200,
      style: {
        fontFamily: 'Segoe UI, sans-serif'
      }
    },
    title: {
      text: '',
      style: {
        color: '#e0e0e0'
      }
    },
    credits: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>',
          style: {
            color: '#e0e0e0',
            fontSize: '11px',
            fontWeight: '500'
          }
        },
        point: {
          events: {
            mouseOver: function() {
              this.sliced = true;
            },
            mouseOut: function() {
              this.sliced = false;
            }
          }
        }
      }
    },
    series: [{
      name: 'Shared Values',
      colorByPoint: true,
      data: [
        {
          name: 'Advancing\nManufacturing',
          y: 25,
          color: '#FFD700',
          sliced: false
        },
        {
          name: 'Ethical and\nResponsible AI',
          y: 25,
          color: '#4A90E2',
          sliced: false
        },
        {
          name: 'Broader\nSocial Impact',
          y: 25,
          color: '#FF6B6B',
          sliced: false
        },
        {
          name: 'Collaboration\n& Innovation',
          y: 25,
          color: '#2E5BBA',
          sliced: false
        }
      ]
    }],
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    }
  });

  // PDF Export Function
  const exportToPDF = () => {
    if (!popupCompany) return;

    const doc = new jsPDF();
    const companyName = popupCompany['Company Name'];
    
    // PAGE 1
    // Set up fonts and colors
    doc.setFont('helvetica');
    doc.setFontSize(18);
    doc.setTextColor(74, 144, 226); // Blue color
    doc.text(`${companyName} Prospect Summary`, 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128); // Gray color
    doc.text('Energy Efficient Products underpinned by honesty, integrity, and ethics', 20, 32);
    
    // Company Overview Section
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Company Overview', 20, 45);
    
    // Create a simple metrics table with visual indicators
    const revenue = popupCompany['Annual Revenue'] ? parseFloat(popupCompany['Annual Revenue']) : 0;
    const marketVal = popupCompany['Market Valuation'] ? parseFloat(popupCompany['Market Valuation']) : 0;
    const profitMargin = popupCompany['Profit Margins'] ? parseFloat(popupCompany['Profit Margins']) : 0;
    const marketShare = popupCompany['Market Share'] ? parseFloat(popupCompany['Market Share']) : 0;
    
    // Format values properly
    const formatRevenue = (val) => {
      if (isNaN(val) || val === 0) return 'N/A';
      return val >= 1000000000 ? `$${(val / 1000000000).toFixed(1)}B` : 
             val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : 
             `$${val.toLocaleString()}`;
    };
    
    const formatPercentage = (val) => {
      if (isNaN(val) || val === 0) return 'N/A';
      return `${(val * 100).toFixed(1)}%`;
    };
    
    const overviewData = [
      ['Revenue', formatRevenue(revenue), '📊'],
      ['Market Valuation', formatRevenue(marketVal), '💰'],
      ['Profit Margins', formatPercentage(profitMargin), '📈'],
      ['Market Share', formatPercentage(marketShare), '🎯'],
      ['Industry Ranking', popupCompany['Industry Ranking'] ? `#${popupCompany['Industry Ranking']}` : 'N/A', '🏆'],
      ['Distance from UWM', popupCompany['Distance'] ? `${popupCompany['Distance']} miles` : 'N/A', '📍']
    ];
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value', '']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [74, 144, 226], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // Predicted Shared Values Section with Pie Chart
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Predicted Shared Values', 20, doc.lastAutoTable.finalY + 15);
    
    // Create a simple pie chart
    const pieX = 20;
    const pieY = doc.lastAutoTable.finalY + 25;
    const pieRadius = 25;
    const centerX = pieX + pieRadius;
    const centerY = pieY + pieRadius;
    
    // Draw pie chart segments
    const segments = [
      { name: 'Advancing Manufacturing', percentage: 35, color: [255, 215, 0] },
      { name: 'Ethical AI', percentage: 28, color: [74, 144, 226] },
      { name: 'Social Impact', percentage: 22, color: [255, 107, 107] },
      { name: 'Collaboration', percentage: 15, color: [46, 91, 186] }
    ];
    
    let currentAngle = 0;
    segments.forEach((segment, index) => {
      const angle = (segment.percentage / 100) * 360;
      const endAngle = currentAngle + angle;
      
      // Draw pie segment
      doc.setFillColor(...segment.color);
      doc.ellipse(centerX, centerY, pieRadius, pieRadius, 'F', currentAngle, endAngle);
      
      // Add labels
      const labelAngle = currentAngle + angle / 2;
      const labelRadius = pieRadius + 15;
      const labelX = centerX + Math.cos((labelAngle - 90) * Math.PI / 180) * labelRadius;
      const labelY = centerY + Math.sin((labelAngle - 90) * Math.PI / 180) * labelRadius;
      
      doc.setFontSize(8);
      doc.setTextColor(64, 64, 64);
      doc.text(segment.name, labelX, labelY);
      
      currentAngle = endAngle;
    });
    
    // Shared values descriptions
    const sharedValues = [
      ['Advancing Manufacturing', 'Leverage AI/Data Science to advance sustainable and optimized manufacturing practices.'],
      ['Ethical and Responsible AI', 'At every stage of the data journey, both organizations seek responsible data-driven-decision-making.'],
      ['Broader Social Impact', 'Approaches to ensure underserved populations have clean water.'],
      ['Collaboration & Innovation', 'Track record of engagement across sectors to push the boundaries for what is possible.']
    ];
    
    autoTable(doc, {
      startY: pieY + pieRadius * 2 + 15,
      body: sharedValues,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 20, right: 20 }
    });
    
    // Early-Stage Areas of Focus
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Early-Stage Areas of Focus', 20, doc.lastAutoTable.finalY + 12);
    
    const focusAreas = [
      '01 Culture of Creating Partnerships',
      '02 Increased Talent Ecosystem - Limited open roles',
      '03 Broader Community Impact',
      '04 Capstone Project Alignment (experiential learning and upskilling)',
      '05 Mutual interests In sponsored research'
    ];
    
    // Check if we need to go to page 2 for the focus areas
    const focusStartY = doc.lastAutoTable.finalY + 25;
    const estimatedHeight = focusAreas.length * 8 + 20; // 8pt per line + buffer
    
    if (focusStartY + estimatedHeight > 250) {
      // Add new page for focus areas
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(74, 144, 226);
      doc.text('Early-Stage Areas of Focus', 20, 25);
      
      focusAreas.forEach((area, index) => {
        doc.setFontSize(10);
        doc.setTextColor(64, 64, 64);
        doc.text(area, 20, 40 + (index * 8));
      });
    } else {
      // Continue on same page
      focusAreas.forEach((area, index) => {
        doc.setFontSize(10);
        doc.setTextColor(64, 64, 64);
        doc.text(area, 20, focusStartY + (index * 8));
      });
    }
    
    // PAGE 2 (or 3 if focus areas needed new page)
    doc.addPage();
    
    // Assumptions & Dependencies
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Assumptions & Dependencies', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(64, 64, 64);
    doc.text('Assumptions:', 20, 35);
    doc.text('• Past Higher Education (HE) investments', 25, 45);
    doc.text('• Financial Capacity', 25, 55);
    
    doc.text('Dependencies:', 20, 75);
    doc.text('• Funding Priorities', 25, 85);
    doc.text('• Engagement Level Interest', 25, 95);
    doc.text('• Increased capacity in AI (etc) via partnership', 25, 105);
    
    // Project Ideation
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Project Ideation', 20, 135);
    
    doc.setFontSize(10);
    doc.setTextColor(64, 64, 64);
    const ideationText = 'Develop projects aligned towards AI-based and data science for optimizing manufacturing, product performance analysis and water purification. How might we partner to accelerate their ESG work and connection with other local non-profits?';
    doc.text(ideationText, 20, 145, { maxWidth: 170 });
    
    // Key Focus Areas
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Key Focus Areas', 20, 180);
    
    doc.setFontSize(10);
    doc.setTextColor(64, 64, 64);
    doc.text('• Sustainable manufacturing', 20, 195);
    doc.text('• Water purification and technology', 20, 205);
    doc.text('• Sustainability', 20, 215);
    
    // Footer with download information
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Get user information (you can modify this based on your user state)
    const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Unknown User';
    
    // Add footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 250, 190, 250);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${currentDate}`, 20, 255);
    doc.text(`Downloaded by: ${userName}`, 20, 260);
    doc.text('NMDSI Prospect Summary System', 20, 265);
    
    // Save the PDF
    doc.save(`${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Prospect_Summary.pdf`);
  };

  const modelOptions = [
    { value: 'logistic', label: 'Logistic', deployed: '2024-06-01' },
    { value: 'random_forest', label: 'Random Forest', deployed: '2024-05-28' },
    { value: 'xt_boost', label: 'XG Boost', deployed: '2024-05-15' },
  ];

  // Hardcoded chart data for Random Forest
  const rfChartData = {
    accuracy: 0.83,
    auc: 0.89,
    precision: 0.81,
    recall: 0.77,
    f1_score: 0.79,
    confusionMatrix: {
      truePositive: 42,
      falsePositive: 8,
      trueNegative: 36,
      falseNegative: 14
    },
    rocCurve: [
      [0, 0], [0.1, 0.7], [0.2, 0.82], [0.3, 0.89], [1, 1]
    ]
  };
  // Hardcoded chart data for XG Boost
  const xtbChartData = {
    accuracy: 0.81,
    auc: 0.87,
    precision: 0.79,
    recall: 0.75,
    f1_score: 0.77,
    confusionMatrix: {
      truePositive: 39,
      falsePositive: 11,
      trueNegative: 33,
      falseNegative: 17
    },
    rocCurve: [
      [0, 0], [0.1, 0.65], [0.2, 0.78], [0.3, 0.85], [1, 1]
    ]
  };

  // Chart options for hardcoded tabs
  const getBarOptions = (data) => ({
    chart: { 
      type: 'bar',
      backgroundColor: '#2d2d2d',
      style: { fontFamily: 'Segoe UI, sans-serif' }
    },
    title: { text: 'Precision, Recall, F1, Accuracy', style: { color: '#e0e0e0' } },
    xAxis: { categories: ['Metrics'], labels: { style: { color: '#e0e0e0' } }, lineColor: '#555', tickColor: '#555' },
    yAxis: { min: 0, max: 1, title: { text: 'Score', style: { color: '#e0e0e0' } }, labels: { style: { color: '#e0e0e0' } }, gridLineColor: '#555' },
    legend: { itemStyle: { color: '#e0e0e0' }, itemHoverStyle: { color: '#4a90e2' } },
    plotOptions: { bar: { borderColor: '#555' } },
    series: [
      { name: 'Precision', data: [data.precision] },
      { name: 'Recall', data: [data.recall] },
      { name: 'F1 Score', data: [data.f1_score] },
      { name: 'Accuracy', data: [data.accuracy] }
    ],
    credits: { enabled: false }
  });
  const getRocOptions = (data) => ({
    chart: { backgroundColor: '#2d2d2d', style: { fontFamily: 'Segoe UI, sans-serif' } },
    title: { text: 'ROC Curve', style: { color: '#e0e0e0' } },
    xAxis: { title: { text: 'False Positive Rate', style: { color: '#e0e0e0' } }, labels: { style: { color: '#e0e0e0' } }, lineColor: '#555', tickColor: '#555' },
    yAxis: { title: { text: 'True Positive Rate', style: { color: '#e0e0e0' } }, labels: { style: { color: '#e0e0e0' } }, gridLineColor: '#555' },
    legend: { itemStyle: { color: '#e0e0e0' }, itemHoverStyle: { color: '#4a90e2' } },
    plotOptions: { line: { color: '#4a90e2' } },
    series: [{ name: 'ROC', data: data.rocCurve, type: 'line' }],
    credits: { enabled: false }
  });
  const getConfusionMatrixOptions = (data) => ({
    chart: { type: 'column', backgroundColor: '#2d2d2d', style: { fontFamily: 'Segoe UI, sans-serif' } },
    title: { text: 'Confusion Matrix', style: { color: '#e0e0e0' } },
    credits: { enabled: false },
    xAxis: { categories: ['Predicted Positive', 'Predicted Negative'], labels: { style: { color: '#e0e0e0' } }, lineColor: '#555', tickColor: '#555' },
    yAxis: { min: 0, title: { text: 'Count', style: { color: '#e0e0e0' } }, labels: { style: { color: '#e0e0e0' } }, gridLineColor: '#555' },
    legend: { itemStyle: { color: '#e0e0e0' }, itemHoverStyle: { color: '#4a90e2' } },
    plotOptions: { column: { borderColor: '#555' } },
    series: [
      { name: 'Actual Positive', data: [data.confusionMatrix.truePositive, data.confusionMatrix.falseNegative] },
      { name: 'Actual Negative', data: [data.confusionMatrix.falsePositive, data.confusionMatrix.trueNegative] }
    ]
  });

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
            <li><strong>Select a model type</strong> from the dropdown below (e.g., Logistic, Random Forest, XG Boost). The prediction will use the latest deployed version of the selected model.</li>
            <li>Then, <strong>select one or more companies</strong> from the input box below.</li>
            <li>Click <strong>Predict</strong> to analyze each company using your chosen model. You'll see:</li>
            <ul style={{ marginTop: '4px' }}>
              <li><code>Probability of Sponsorship</code> (score from the selected model)</li>
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
                    <li
                      key={i}
                      style={{display:'flex',justifyContent:'space-between',alignItems:'center', cursor:'pointer'}}
                      onClick={() => handleSuggestionClick(c)}
                    >
                      <span style={{flex:1}}>
                        {c['Company Name']} {isSelected && <span className="check-mark">✓</span>}
                      </span>
                      <button
                        className="view-btn"
                        style={{marginLeft:8,padding:'2px 10px',fontSize:12,borderRadius:5,border:'none',background:'#4a90e2',color:'#fff',cursor:'pointer'}}
                        onClick={e => {e.stopPropagation(); setPopupCompany(c);}}
                        type="button"
                      >
                        View
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* Model Type Dropdown */}
          <div className="autocomplete-container" ref={modelDropdownRef} style={{ marginTop: 28, position: 'relative' }}>
            <div
              className={`model-autocomplete-input${showModelDropdown ? ' open' : ''}`}
              tabIndex={0}
              onClick={() => setShowModelDropdown((open) => !open)}
              onBlur={() => setShowModelDropdown(false)}
              style={{ cursor: 'pointer', userSelect: 'none', minHeight: 38 }}
            >
              {selectedModel
                ? <>
                    {modelOptions.find(opt => opt.value === selectedModel)?.label}
                    <span style={{ color: '#b0b0b0', fontSize: '0.92em', marginLeft: 6 }}>
                      (latest deployed on {modelOptions.find(opt => opt.value === selectedModel)?.deployed})
                    </span>
                  </>
                : <span style={{ color: '#b0b0b0' }}>Select Model Type</span>}
              <span className="model-dropdown-arrow">▼</span>
            </div>
            {showModelDropdown && (
              <ul className="autocomplete-list model-autocomplete-list">
                {modelOptions.map((opt, i) => (
                  <li
                    key={opt.value}
                    className={selectedModel === opt.value ? 'selected' : ''}
                    onMouseDown={e => { e.preventDefault(); setSelectedModel(opt.value); setShowModelDropdown(false); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {opt.label}
                    <span style={{ color: '#b0b0b0', fontSize: '0.92em', marginLeft: 6 }}>
                      (latest deployed on {opt.deployed})
                    </span>
                    {selectedModel === opt.value && <span className="check-mark">✓</span>}
                  </li>
                ))}
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

      {/* Company Details Popup */}
      {popupCompany && (
        <div className="company-popup-overlay" onClick={() => setPopupCompany(null)}>
          <div className="company-popup-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h2>{popupCompany['Company Name']} Prospect Summary</h2>
              <div className="company-tagline">Energy Efficient Products underpinned by honesty, integrity, and ethics</div>
            </div>
            
            <div className="popup-content">
              {/* Company Overview Section */}
              <div className="popup-section">
                <h3>Company Overview</h3>
                <div className="overview-grid">
                  <div className="overview-item">
                    <span className="label">Revenue:</span>
                    <span className="value">${popupCompany['Annual Revenue']}</span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Market Valuation:</span>
                    <span className="value">${popupCompany['Market Valuation']}</span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Profit Margins:</span>
                    <span className="value">{(parseFloat(popupCompany['Profit Margins']) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Market Share:</span>
                    <span className="value">{(parseFloat(popupCompany['Market Share']) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Industry Ranking:</span>
                    <span className="value">#{popupCompany['Industry Ranking']}</span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Distance from UWM:</span>
                    <span className="value">{popupCompany['Distance']} miles</span>
                  </div>
                </div>
              </div>

              {/* Predicted Shared Values */}
              <div className="popup-section">
                <h3>Predicted Shared Values</h3>
                <div className="shared-values-container">
                  <div className="chart-container">
                    <HighchartsReact highcharts={Highcharts} options={getSharedValuesChartOptions()} />
                  </div>
                  <div className="shared-values-grid">
                    <div className="value-item">
                      <div className="value-icon">📊</div>
                      <div className="value-content">
                        <h4>Advancing Manufacturing</h4>
                        <p>Leverage AI/Data Science to advance sustainable and optimized manufacturing practices.</p>
                      </div>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">⚖️</div>
                      <div className="value-content">
                        <h4>Ethical and Responsible AI</h4>
                        <p>At every stage of the data journey, both organizations seek responsible data-driven-decision-making.</p>
                      </div>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">🌱</div>
                      <div className="value-content">
                        <h4>Broader Social Impact</h4>
                        <p>Approaches to ensure underserved populations have clean water.</p>
                      </div>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">🔬</div>
                      <div className="value-content">
                        <h4>Collaboration & Innovation</h4>
                        <p>Track record of engagement across sectors to push the boundaries for what is possible.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Early-Stage Areas of Focus */}
              <div className="popup-section">
                <h3>Early-Stage Areas of Focus</h3>
                <div className="focus-list">
                  <div className="focus-item">
                    <span className="focus-number">01</span>
                    <span className="focus-text">Culture of Creating Partnerships</span>
                  </div>
                  <div className="focus-item">
                    <span className="focus-number">02</span>
                    <span className="focus-text">Increased Talent Ecosystem - Limited open roles</span>
                  </div>
                  <div className="focus-item">
                    <span className="focus-number">03</span>
                    <span className="focus-text">Broader Community Impact</span>
                  </div>
                  <div className="focus-item">
                    <span className="focus-number">04</span>
                    <span className="focus-text">Capstone Project Alignment (experiential learning and upskilling)</span>
                  </div>
                  <div className="focus-item">
                    <span className="focus-number">05</span>
                    <span className="focus-text">Mutual interests In sponsored research</span>
                  </div>
                </div>
              </div>

              {/* Assumptions & Dependencies */}
              <div className="popup-section">
                <h3>Assumptions & Dependencies</h3>
                <div className="assumptions-grid">
                  <div className="assumptions-column">
                    <h4>Assumptions</h4>
                    <ul>
                      <li>Past Higher Education (HE) investments</li>
                      <li>Financial Capacity</li>
                    </ul>
                  </div>
                  <div className="dependencies-column">
                    <h4>Dependencies</h4>
                    <ul>
                      <li>Funding Priorities</li>
                      <li>Engagement Level Interest</li>
                      <li>Increased capacity in AI (etc) via partnership</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Project Ideation */}
              <div className="popup-section">
                <h3>Project Ideation</h3>
                <div className="project-ideation">
                  <p>Develop projects aligned towards AI-based and data science for optimizing manufacturing, product performance analysis and water purification. How might we partner to accelerate their ESG work and connection with other local non-profits?</p>
                </div>
              </div>

              {/* Aligned Existing NMDSI COE Projects */}
              <div className="popup-section">
                <h3>Aligned Existing NMDSI COE Projects (Samples)</h3>
                <div className="aligned-projects">
                  <div className="project-item">• How AI Technologies are Reshaping and Challenging Traditional Business Practices in MKE</div>
                  <div className="project-item">• Ethical AI: Challenges and Opportunities</div>
                </div>
              </div>

              {/* Key Focus Areas */}
              <div className="popup-section">
                <h3>Key Focus Areas</h3>
                <div className="focus-areas">
                  <span className="focus-tag">Sustainable manufacturing</span>
                  <span className="focus-tag">Water purification and technology</span>
                  <span className="focus-tag">Sustainability</span>
                </div>
              </div>
            </div>

            <div className="popup-buttons">
              <button className="export-pdf-btn" onClick={exportToPDF}>
                📄 Export PDF
              </button>
              <button className="close-popup-btn" onClick={() => setPopupCompany(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {chartData && (
        <div className="charts-section">
          <h2>Model Evaluation Metrics</h2>
          <div className="model-tabs">
            <button
              className={activeModelTab === 'logistic' ? 'active' : ''}
              onClick={() => setActiveModelTab('logistic')}
            >
              Logistic
            </button>
            <button
              className={activeModelTab === 'random_forest' ? 'active' : ''}
              onClick={() => setActiveModelTab('random_forest')}
            >
              Random Forest
            </button>
            <button
              className={activeModelTab === 'xt_boost' ? 'active' : ''}
              onClick={() => setActiveModelTab('xt_boost')}
            >
              XG Boost
            </button>
          </div>
          <div className='container-wrapper'>
            {/* Logistic tab: API-driven values; others: hardcoded */}
            {activeModelTab === 'logistic' && modelInfo && (
              <>
                <div className="model-info-section">
                  <p className="chart-instruction">
                    ℹ️ This section gives you details about the currently active model, including when it was last trained and the dataset it used.
                  </p>
                  <h3>Model Basic Info</h3>
                  <div className="model-info-grid">
                    <div className="info-item">
                      <div className="info-icon">🤖</div>
                      <div className="info-content">
                        <div className="info-label">Model Name</div>
                        <div className="info-value">{modelInfo.model_name}</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🟢</div>
                      <div className="info-content">
                        <div className="info-label">Status</div>
                        <div className="info-value status-active">Active</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🆔</div>
                      <div className="info-content">
                        <div className="info-label">Model ID</div>
                        <div className="info-value">{modelInfo.model_id}</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🕒</div>
                      <div className="info-content">
                        <div className="info-label">Last Updated</div>
                        <div className="info-value">{new Date(modelInfo.last_updated).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">📊</div>
                      <div className="info-content">
                        <div className="info-label">Dataset ID</div>
                        <div className="info-value">{modelInfo.dataset_id}</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">📁</div>
                      <div className="info-content">
                        <div className="info-label">Dataset</div>
                        <div className="info-value">{modelInfo.dataset_name}</div>
                      </div>
                    </div>
                  </div>
                </div>
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
              </>
            )}
            {activeModelTab === 'random_forest' && (
              <>
                <div className="model-info-section">
                  <p className="chart-instruction">
                    ℹ️ This section gives you details about the currently active model, including when it was last trained and the dataset it used.
                  </p>
                  <h3>Model Basic Info</h3>
                  <div className="model-info-grid">
                    <div className="info-item">
                      <div className="info-icon">🤖</div>
                      <div className="info-content">
                        <div className="info-label">Model Name</div>
                        <div className="info-value">Random Forest v2.1</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🟢</div>
                      <div className="info-content">
                        <div className="info-label">Status</div>
                        <div className="info-value status-active">Active</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🆔</div>
                      <div className="info-content">
                        <div className="info-label">Model ID</div>
                        <div className="info-value">rf-20240528</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🕒</div>
                      <div className="info-content">
                        <div className="info-label">Last Updated</div>
                        <div className="info-value">2024-05-28 14:00:00</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">📊</div>
                      <div className="info-content">
                        <div className="info-label">Dataset ID</div>
                        <div className="info-value">ds-20240528</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">📁</div>
                      <div className="info-content">
                        <div className="info-label">Dataset</div>
                        <div className="info-value">company_data_rf.csv</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chart-container">
                  <p className="chart-instruction">
                    📊 These metrics show how well the model performs: Precision, Recall, F1 Score, and Accuracy.
                  </p>
                  <HighchartsReact highcharts={Highcharts} options={getBarOptions(rfChartData)} />
                </div>
                <div className="chart-container-3">
                  <p className="chart-instruction">
                    📈 The ROC curve shows performance trade-offs. The closer the curve is to top-left, the better.
                  </p>
                  <HighchartsReact highcharts={Highcharts} options={getRocOptions(rfChartData)} />
                </div>
                <div className="chart-container">
                  <p className="chart-instruction">
                    🧮 Confusion matrix visualization of actual vs predicted sponsorships.
                  </p>
                  <HighchartsReact highcharts={Highcharts} options={getConfusionMatrixOptions(rfChartData)} />
                </div>
              </>
            )}
            {activeModelTab === 'xt_boost' && (
              <>
                <div className="model-info-section">
                  <p className="chart-instruction">
                    ℹ️ This section gives you details about the currently active model, including when it was last trained and the dataset it used.
                  </p>
                  <h3>Model Basic Info</h3>
                  <div className="model-info-grid">
                    <div className="info-item">
                      <div className="info-icon">🤖</div>
                      <div className="info-content">
                        <div className="info-label">Model Name</div>
                        <div className="info-value">XG Boost v1.7</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🟢</div>
                      <div className="info-content">
                        <div className="info-label">Status</div>
                        <div className="info-value status-active">Active</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🆔</div>
                      <div className="info-content">
                        <div className="info-label">Model ID</div>
                        <div className="info-value">xtb-20240515</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🕒</div>
                      <div className="info-content">
                        <div className="info-label">Last Updated</div>
                        <div className="info-value">2024-05-15 10:30:00</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">📊</div>
                      <div className="info-content">
                        <div className="info-label">Dataset ID</div>
                        <div className="info-value">ds-20240515</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">📁</div>
                      <div className="info-content">
                        <div className="info-label">Dataset</div>
                        <div className="info-value">company_data_xtb.csv</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chart-container">
                  <p className="chart-instruction">
                    📊 These metrics show how well the model performs: Precision, Recall, F1 Score, and Accuracy.
                  </p>
                  <HighchartsReact highcharts={Highcharts} options={getBarOptions(xtbChartData)} />
                </div>
                <div className="chart-container-3">
                  <p className="chart-instruction">
                    📈 The ROC curve shows performance trade-offs. The closer the curve is to top-left, the better.
                  </p>
                  <HighchartsReact highcharts={Highcharts} options={getRocOptions(xtbChartData)} />
                </div>
                <div className="chart-container">
                  <p className="chart-instruction">
                    🧮 Confusion matrix visualization of actual vs predicted sponsorships.
                  </p>
                  <HighchartsReact highcharts={Highcharts} options={getConfusionMatrixOptions(xtbChartData)} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
