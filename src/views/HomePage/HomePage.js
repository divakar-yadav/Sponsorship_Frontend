import React, { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import './HomePage.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function HomePage() {
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
  const [milwaukeeCompanies, setMilwaukeeCompanies] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Clear prediction when model changes
  useEffect(() => {
    setPrediction(null);
  }, [selectedModel]);

  const funMessages = [
    'Crunching logistic curves...',
    'Compiling sponsorship vibes...',
    'Polishing your predictions...',
    'Connecting to funding universe...',
    'Loading models and coffee ☕...',
  ];
const modelTypeMap = {
  'logistic': 'Logistic',
  'random_forest': 'RandomForest',
  'xgboost': 'XGBoost'
};
  useEffect(() => {
    const msg = funMessages[Math.floor(Math.random() * funMessages.length)];
    setFunMessage(msg);

  // Mock data for demonstration
  const mockChartData = {
    logistic: {
      metrics: {
        accuracy: 0.7,
        precision: 0.75,
        recall: 0.15,
        f1_score: 0.3,
        auc: 0.8,
        confusionMatrix: {
          truePositive: 17,
          falsePositive: 14,
          falseNegative: 5,
          trueNegative: 37
        },
        rocCurve: [
          [0, 0], [0.1, 0.3], [0.2, 0.5], [0.3, 0.6], [0.4, 0.7], 
          [0.5, 0.75], [0.6, 0.8], [0.7, 0.85], [0.8, 0.9], [0.9, 0.95], [1, 1]
        ]
      },
      info: {
        modelId: '20250724122846_7aa0efa9',
        createdAt: '2025-07-24T12:28:46',
        datasetId: 'acf19642-d460-4c9d-9ac3-4f66cf1b5022',
        filename: 'final_nmdsi_enriched_all_1.csv',
        doneBy: 'System'
      }
    },
    randomforest: {
      metrics: {
        accuracy: 0.75,
        precision: 0.8,
        recall: 0.6,
        f1_score: 0.7,
        auc: 0.85,
        confusionMatrix: {
          truePositive: 20,
          falsePositive: 10,
          falseNegative: 8,
          trueNegative: 35
        },
        rocCurve: [
          [0, 0], [0.1, 0.4], [0.2, 0.6], [0.3, 0.7], [0.4, 0.8], 
          [0.5, 0.85], [0.6, 0.9], [0.7, 0.92], [0.8, 0.95], [0.9, 0.98], [1, 1]
        ]
      },
      info: {
        modelId: '20250724123000_abc123',
        createdAt: '2025-07-24T12:30:00',
        datasetId: 'acf19642-d460-4c9d-9ac3-4f66cf1b5022',
        filename: 'final_nmdsi_enriched_all_1.csv',
        doneBy: 'System'
      }
    },
    xgboost: {
      metrics: {
        accuracy: 0.8,
        precision: 0.85,
        recall: 0.7,
        f1_score: 0.77,
        auc: 0.9,
        confusionMatrix: {
          truePositive: 22,
          falsePositive: 8,
          falseNegative: 6,
          trueNegative: 37
        },
        rocCurve: [
          [0, 0], [0.1, 0.5], [0.2, 0.7], [0.3, 0.8], [0.4, 0.85], 
          [0.5, 0.9], [0.6, 0.93], [0.7, 0.95], [0.8, 0.97], [0.9, 0.99], [1, 1]
        ]
      },
      info: {
        modelId: '20250724123100_def456',
        createdAt: '2025-07-24T12:31:00',
        datasetId: 'acf19642-d460-4c9d-9ac3-4f66cf1b5022',
        filename: 'final_nmdsi_enriched_all_1.csv',
        doneBy: 'System'
      }
    }
  };

  Promise.all([
    fetch(`${BASE_URL}/api/companies`).then(res => res.json()).catch(() => ({ companies: [] })),
    fetch(`${BASE_URL}/api/current-model-performance`).then(res => res.json()).catch(() => ({ status: "error" }))
  ])
    .then(([companiesData, modelData]) => {
      // setCompanyData(companiesData.companies || []);
      
      if (modelData.status === "success" && modelData.models) {
        const processedData = {};
        
        // Process each model's data
        Object.entries(modelData.models).forEach(([modelName, modelData]) => {
          if (modelName !== 'timestamp') {
            processedData[modelName.toLowerCase()] = {
              metrics: {
                accuracy: modelData.metrics.accuracy,
                precision: modelData.metrics.precision,
                recall: modelData.metrics.recall,
                f1_score: modelData.metrics.f1_score,
                auc: modelData.metrics.auc,
                confusionMatrix: modelData.metrics.confusion_matrix,
                rocCurve: modelData.metrics.roc_curve.fpr.map((fpr, idx) => [
                  fpr,
                  modelData.metrics.roc_curve.tpr[idx]
                ])
              },
              info: {
                modelId: modelData.model_id,
                createdAt: modelData.created_at,
                datasetId: modelData.dataset_id,
                filename: modelData.filename,
                doneBy: modelData.done_by
              }
            };
          }
        });
        
        setChartData(processedData);
      } else {
        // Use mock data if API fails
        console.log("Using mock data for dashboard");
        setChartData(mockChartData);
      }
    })
    .catch(err => {
      console.error("Initial data load failed, using mock data", err);
      setChartData(mockChartData);
    })
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

  // Live search for companies
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company') {
      setFormData(prev => ({ ...prev, company: value }));
      if (value.trim().length === 0) {
        // Show Milwaukee companies when input is empty
        setSuggestions(milwaukeeCompanies);
        setShowDropdown(true);
        setIsSearchLoading(false);
        return;
      }
      
      setIsSearchLoading(true);
      fetch(`${BASE_URL}/api/search-companies?q=${encodeURIComponent(value)}`)
        .then(res => res.json())
        .then(data => {
          const searchResults = data.companies || [];
          
          // Prioritize Milwaukee companies in search results
          const milwaukeeResults = searchResults.filter(company => 
            company.City && company.City.toLowerCase() === 'milwaukee'
          );
          const otherResults = searchResults.filter(company => 
            !company.City || company.City.toLowerCase() !== 'milwaukee'
          );
          
          // Combine with Milwaukee companies first
          const prioritizedResults = [...milwaukeeResults, ...otherResults];
          
          setSuggestions(prioritizedResults);
          setShowDropdown(true);
          setIsSearchLoading(false);
        })
        .catch(() => {
          setSuggestions([]);
          setShowDropdown(false);
          setIsSearchLoading(false);
        });
    }
  };

  // Fetch Milwaukee companies
  const fetchMilwaukeeCompanies = async () => {
    setIsSearchLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/filter-companies?field=City&value=Milwaukee`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Parse the correct response structure
        if (data.companies && Array.isArray(data.companies)) {
          setMilwaukeeCompanies(data.companies);
          console.log('Milwaukee companies fetched:', data.total_results, 'companies');
        } else {
          console.error('Invalid response format for Milwaukee companies');
          setMilwaukeeCompanies([]);
        }
      } else {
        console.error('Failed to fetch Milwaukee companies');
        setMilwaukeeCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching Milwaukee companies:', error);
      setMilwaukeeCompanies([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleFocus = async () => {
    // Show loading immediately on first click
    setIsSearchLoading(true);
    setShowDropdown(true);
    
    // Always fetch Milwaukee companies when input is focused
    let milwaukeeData = [];
    try {
      const response = await fetch(`${BASE_URL}/api/filter-companies?field=City&value=Milwaukee`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.companies && Array.isArray(data.companies)) {
          milwaukeeData = data.companies;
          setMilwaukeeCompanies(data.companies);
          console.log('Milwaukee companies fetched:', data.total_results, 'companies');
        }
      }
    } catch (error) {
      console.error('Error fetching Milwaukee companies:', error);
    }
    
    if (formData.company.trim().length > 0) {
      // If there's text, search for companies
      fetch(`${BASE_URL}/api/search-companies?q=${encodeURIComponent(formData.company)}`)
        .then(res => res.json())
        .then(data => {
          const searchResults = data.companies || [];
          
          // Prioritize Milwaukee companies in search results
          const milwaukeeResults = searchResults.filter(company => 
            company.City && company.City.toLowerCase() === 'milwaukee'
          );
          const otherResults = searchResults.filter(company => 
            !company.City || company.City.toLowerCase() !== 'milwaukee'
          );
          
          // Combine with Milwaukee companies first
          const prioritizedResults = [...milwaukeeResults, ...otherResults];
          
          setSuggestions(prioritizedResults);
          setIsSearchLoading(false);
        })
        .catch(() => {
          setSuggestions([]);
          setShowDropdown(false);
          setIsSearchLoading(false);
        });
    } else {
      // Show Milwaukee companies by default when input is empty
      setSuggestions(milwaukeeData);
      setIsSearchLoading(false);
    }
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
    if (!selectedModel) {
      toast.error('Please select a model type before predicting.');
      return;
    }
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

    // Convert model type to match API format
    const modelTypeMap = {
      'logistic': 'Logistic',
      'randomforest': 'RandomForest', 
      'xgboost': 'XGBoost'
    };
    const modelType = modelTypeMap[selectedModel] || 'Logistic';

    fetch(`${BASE_URL}/api/predict?model_type=${modelType}`, {
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
        toast.error('Prediction failed. Please try again.');
        setLoading(false);
      });
  };


  // Shared Values Chart Options
  const getSharedValuesChartOptions = (sharedValues = null) => {
    // Default colors for pie chart segments
    const colors = ['#FFD700', '#4A90E2', '#FF6B6B', '#2E5BBA', '#00d4aa', '#9370DB', '#FFA500', '#20B2AA'];
    
    let chartData;
    
    if (sharedValues && Array.isArray(sharedValues) && sharedValues.length > 0) {
      // Use actual shared values from API
      const percentage = 100 / sharedValues.length;
      chartData = sharedValues.map((value, index) => ({
        name: value,
        y: percentage,
        color: colors[index % colors.length],
        sliced: false
      }));
    } else {
      // Fallback to default values
      chartData = [
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
      ];
    }

    return {
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
        data: chartData
      }],
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      }
    };
  };

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
    doc.text(`${companyName}`, 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128); // Gray color
    doc.text('Energy Efficient Products underpinned by honesty, integrity, and ethics', 20, 32);
    
    // Company Overview Section
    doc.setFontSize(14);
    doc.setTextColor(74, 144, 226);
    doc.text('Company Overview', 20, 45);
    
    // Create a simple metrics table with visual indicators
    const revenue = popupCompany['annual_revenue'] ? parseFloat(popupCompany['annual_revenue']) : 0;
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
      ['Profit Margins', `${profitMargin}%`, '📈'],
      ['Market Share', `${marketShare}%`, '🎯'],
      ['Industry Ranking', popupCompany['Industry Ranking'] ? `#${popupCompany['Industry Ranking']}` : 'N/A', '🏆'],
      ['Distance from UWM', popupCompany['Distance'] ? `${popupCompany['Distance']} miles` : 'N/A', '📍'],
      ['City', popupCompany['City'] || 'N/A', '🏙️'],
      ['Stock Symbol', popupCompany['Stock Symbol'] || 'N/A', '📈'],
      ['Employee Count', popupCompany['employee_count'] ? popupCompany['employee_count'].toLocaleString() : 'N/A', '👥']
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
    { value: 'randomforest', label: 'Random Forest', deployed: '2024-05-28' },
    { value: 'xgboost', label: 'XG Boost', deployed: '2024-05-15' },
  ];



  // Chart options for hardcoded tabs
  const getBarOptions = (modelData) => ({
    chart: { 
      type: 'bar',
      backgroundColor: '#2d2d2d',
      style: { fontFamily: 'Segoe UI, sans-serif' }
    },
    credits: { enabled: false },
    events: {
      load: function() {
        this.reflow();
      }
    },
    title: { text: 'Precision, Recall, F1, Accuracy', style: { color: '#e0e0e0' } },
    xAxis: { categories: ['Metrics'], labels: { style: { color: '#e0e0e0' } }, lineColor: '#555', tickColor: '#555' },
    yAxis: { min: 0, max: 1, title: { text: 'Score', style: { color: '#e0e0e0' } }, labels: { style: { color: '#e0e0e0' } }, gridLineColor: '#555' },
    legend: { itemStyle: { color: '#e0e0e0' }, itemHoverStyle: { color: '#4a90e2' } },
    plotOptions: { 
      bar: { 
        borderColor: '#555',
        dataLabels: {
          enabled: true,
          format: '{y:.2f}'
        }
      } 
    },
    series: [
      { name: 'Precision', data: [modelData.metrics.precision || 0.55], color: '#87CEEB' },
      { name: 'Recall', data: [modelData.metrics.recall || 0.78], color: '#9370DB' },
      { name: 'F1 Score', data: [modelData.metrics.f1_score || 0.6], color: '#90EE90' },
      { name: 'Accuracy', data: [modelData.metrics.accuracy || 0.7], color: '#FFA500' }
    ],
    credits: { enabled: false }
  });
  const getRocOptions = (modelData) => ({
    chart: { 
      backgroundColor: '#2d2d2d', 
      style: { fontFamily: 'Segoe UI, sans-serif' }
    },
    credits: { enabled: false },
    events: {
      load: function() {
        this.reflow();
      }
    },
    title: { text: 'ROC Curve', style: { color: '#e0e0e0' } },
    xAxis: { 
      title: { text: 'False Positive Rate', style: { color: '#e0e0e0' } }, 
      labels: { style: { color: '#e0e0e0' } }, 
      lineColor: '#555', 
      tickColor: '#555',
      min: 0,
      max: 1
    },
    yAxis: { 
      title: { text: 'True Positive Rate', style: { color: '#e0e0e0' } }, 
      labels: { style: { color: '#e0e0e0' } }, 
      gridLineColor: '#555',
      min: 0,
      max: 1.25
    },
    legend: { itemStyle: { color: '#e0e0e0' }, itemHoverStyle: { color: '#4a90e2' } },
    plotOptions: { 
      line: { 
        color: '#4a90e2',
        lineWidth: 2
      } 
    },
    series: [{
      name: 'ROC',
      data: modelData.metrics.rocCurve || [
        [0, 0], [0.1, 0.3], [0.2, 0.5], [0.3, 0.6], [0.4, 0.7], 
        [0.5, 0.75], [0.6, 0.8], [0.7, 0.85], [0.8, 0.9], [0.9, 0.95], [1, 1]
      ],
      type: 'line'
    }],
    credits: { enabled: false }
  });
  const getConfusionMatrixOptions = (modelData) => ({
    chart: { 
      type: 'column', 
      backgroundColor: '#2d2d2d', 
      style: { fontFamily: 'Segoe UI, sans-serif' }
    },
    credits: { enabled: false },
    events: {
      load: function() {
        this.reflow();
      }
    },
    title: { text: 'Confusion Matrix', style: { color: '#e0e0e0' } },
    credits: { enabled: false },
    xAxis: { categories: ['Predicted Positive', 'Predicted Negative'], labels: { style: { color: '#e0e0e0' } }, lineColor: '#555', tickColor: '#555' },
    yAxis: { min: 0, max: 40, title: { text: 'Count', style: { color: '#e0e0e0' } }, labels: { style: { color: '#e0e0e0' } }, gridLineColor: '#555' },
    legend: { itemStyle: { color: '#e0e0e0' }, itemHoverStyle: { color: '#4a90e2' } },
    plotOptions: { 
      column: { 
        borderColor: '#555',
        grouping: true,
        groupPadding: 0.1,
        pointPadding: 0.05
      } 
    },
    series: [
      {
        name: 'Actual Positive',
        data: [
          modelData.metrics.confusionMatrix.truePositive || 17,
          modelData.metrics.confusionMatrix.falseNegative || 5
        ],
        color: '#87CEEB'
      },
      {
        name: 'Actual Negative',
        data: [
          modelData.metrics.confusionMatrix.falsePositive || 14,
          modelData.metrics.confusionMatrix.trueNegative || 37
        ],
        color: '#9370DB'
      }
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
            <li><strong>First, select a model type</strong> from the dropdown above (e.g., Logistic, Random Forest, XG Boost). The prediction will use the latest deployed version of the selected model.</li>
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
          
          {/* Model Type Dropdown - Moved to top */}
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
                    onMouseDown={e => { 
                      e.preventDefault(); 
                      setSelectedModel(opt.value); 
                      setShowModelDropdown(false);
                      setPrediction(null); // Clear prediction immediately when model changes
                    }}
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
          
          {/* Company Selection - Moved below model selection */}
          <div className="autocomplete-container" ref={dropdownRef} style={{ marginTop: 28, position: 'relative' }}>
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              onFocus={handleFocus}
              placeholder={isSearchLoading ? "Searching..." : "Select Company"}
              autoComplete="off"
              style={{ 
                paddingRight: isSearchLoading ? '40px' : '12px',
                color: isSearchLoading ? '#888' : 'inherit'
              }}
            />
            {isSearchLoading && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #4a90e2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
            {showDropdown && (
              <>
                {isSearchLoading ? (
                  <ul className="autocomplete-list">
                    <li style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'12px',color:'#888'}}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #4a90e2',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '8px'
                      }}></div>
                      Loading companies...
                    </li>
                  </ul>
                ) : suggestions.length > 0 ? (
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
                ) : (
                  <ul className="autocomplete-list">
                    <li style={{padding:'12px',color:'#888',textAlign:'center'}}>
                      No companies found
                    </li>
                  </ul>
                )}
              </>
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
              <div className="popup-header-top">
                <h2>{popupCompany['Company Name']}</h2>
                <button className="close-popup-btn" onClick={() => setPopupCompany(null)}>×</button>
              </div>
              <div className="company-tagline">{popupCompany['Tagline'] || 'Energy Efficient Products underpinned by honesty, integrity, and ethics'}</div>
            </div>
            
            <div className="popup-content">
              {/* Company Overview Section */}
              <div className="popup-section">
                <h3>Company Overview</h3>
                <div className="overview-grid">
                  <div className="overview-item">
                    <span className="label">Revenue:</span>
                    <span className="value">
                      {(() => {
                        // Smart number formatting function
                        const formatNumberSmart = (value) => {
                          if (value >= 1_000_000_000) {
                            return (value / 1_000_000_000).toFixed(2) + "B";
                          } else if (value >= 1_000_000) {
                            return (value / 1_000_000).toFixed(2) + "M";
                          } else if (value >= 1_000) {
                            return (value / 1_000).toFixed(2) + "K";
                          } else {
                            return value.toString(); // Show raw number for < 1000
                          }
                        };

                        // Try to get revenue from different possible fields
                        let revenue = null;
                        let source = '';
                        
                        // First try annual_revenue (actual revenue amount)
                        if (popupCompany['annual_revenue']) {
                          revenue = parseFloat(popupCompany['annual_revenue']);
                          source = 'annual_revenue';
                        }
                        // If not available, try Annual Revenue in Log and convert it
                        else if (popupCompany['Annual Revenue in Log']) {
                          const logRevenue = parseFloat(popupCompany['Annual Revenue in Log']);
                          if (!isNaN(logRevenue)) {
                            // Convert from log to actual revenue (e^logRevenue)
                            revenue = Math.exp(logRevenue);
                            source = 'Annual Revenue in Log';
                          }
                        }
                        // Also check for 'Annual Revenue' field (without 'in Log')
                        else if (popupCompany['Annual Revenue']) {
                          revenue = parseFloat(popupCompany['Annual Revenue']);
                          source = 'Annual Revenue';
                        }
                        
                        // Debug: Log the values to understand what we're getting
                        console.log('Revenue Debug:', {
                          company: popupCompany['Company Name'],
                          annual_revenue: popupCompany['annual_revenue'],
                          annualRevenueLog: popupCompany['Annual Revenue in Log'],
                          annualRevenue: popupCompany['Annual Revenue'],
                          calculatedRevenue: revenue,
                          source: source
                        });
                        
                        if (revenue && !isNaN(revenue)) {
                          // If revenue is less than 1000, it's likely already in billions
                          if (revenue < 1000 && revenue > 0) {
                            return `$${revenue.toFixed(2)}B`;
                          } else {
                            // Use the smart formatting for larger numbers
                            return `$${formatNumberSmart(revenue)}`;
                          }
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Profit Margins:</span>
                    <span className="value">
                      {(() => {
                        const profitMargin = parseFloat(popupCompany['Profit Margins']);
                        if (profitMargin && !isNaN(profitMargin)) {
                          // If profit margin is less than 1, it's likely in decimal form
                          if (profitMargin < 1 && profitMargin > 0) {
                            return `${(profitMargin * 100).toFixed(1)}%`;
                          } else {
                            // Already in percentage form
                            return `${profitMargin.toFixed(1)}%`;
                          }
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Market Share:</span>
                    <span className="value">
                      {popupCompany['Market Share'] ? 
                        `${popupCompany['Market Share']}%` : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Industry Ranking:</span>
                    <span className="value">
                      {popupCompany['Industry Ranking'] ? `#${popupCompany['Industry Ranking']}` : 'N/A'}
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Distance from UWM:</span>
                    <span className="value">
                      {popupCompany['Distance'] ? `${popupCompany['Distance']} miles` : 'N/A'}
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">City:</span>
                    <span className="value">
                      {popupCompany['City'] || 'N/A'}
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Stock Symbol:</span>
                    <span className="value">
                      {(() => {
                        const stockSymbol = popupCompany['Stock Symbol'];
                        
                        // Check if stock symbol exists and is not NAN
                        if (stockSymbol && stockSymbol !== 'NAN' && stockSymbol !== 'nan' && stockSymbol.trim() !== '') {
                          return (
                            <div className="stock-symbol-container">
                              <span className="stock-symbol">{stockSymbol}</span>
                              <a 
                                href={`https://finance.yahoo.com/quote/${stockSymbol}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="stock-link yahoo"
                              >
                                📈 View Stock History
                              </a>
                            </div>
                          );
                        } else {
                          return stockSymbol || 'N/A';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Employee Count:</span>
                    <span className="value">
                      {popupCompany['employee_count'] ? popupCompany['employee_count'].toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Past Higher Education Giving */}
              <div className="popup-section">
                <h3>Past Higher Education Sponsorship</h3>
                <div className="giving-history-container">
                  {(() => {
                    const givingData = popupCompany['past_higher_ed_giving'];
                    
                    if (givingData && typeof givingData === 'string' && givingData.trim() !== '') {
                      // Split by semicolon and filter out empty entries
                      const givingItems = givingData.split(';').filter(item => item.trim() !== '');
                      
                      if (givingItems.length > 0) {
                        return givingItems.map((giving, index) => (
                          <div key={index} className="giving-item">
                            <div className="giving-icon">🎓</div>
                            <div className="giving-content">
                              <h4>Institution {index + 1}</h4>
                              <p>{giving.trim()}</p>
                            </div>
                          </div>
                        ));
                      }
                    }
                    
                    // Fallback when no data or invalid data
                    return (
                      <div className="giving-item">
                        <div className="giving-icon">🎓</div>
                        <div className="giving-content">
                          <h4>No Previous Giving Data</h4>
                          <p>No historical higher education funding data available for this company.</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Company Details */}
              <div className="popup-section">
                <h3>Company Details</h3>
                <div className="company-details-container">
                  <div className="detail-card">
                    <div className="detail-icon">🏷️</div>
                    <div className="detail-content">
                      <h4>Tagline</h4>
                      <p>{popupCompany['Tagline'] || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">🎯</div>
                    <div className="detail-content">
                      <h4>Mission Statement</h4>
                      <p>{popupCompany['mission_statement'] || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">🏢</div>
                    <div className="detail-content">
                      <h4>Headquarters</h4>
                      <p>{popupCompany['headquarters_location'] || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">👤</div>
                    <div className="detail-content">
                      <h4>Key Contact</h4>
                      <p>
                        {popupCompany['Known Point of Contact'] || 
                         (popupCompany['key_contacts'] ? 
                           (Array.isArray(popupCompany['key_contacts']) ? 
                             popupCompany['key_contacts'].join('; ') : 
                             popupCompany['key_contacts']
                           ) : 'N/A'
                         )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Predicted Shared Values */}
              <div className="popup-section">
                <h3>Predicted Shared Values</h3>
                <div className="shared-values-container">
                  <div className="chart-container">
                    <HighchartsReact highcharts={Highcharts} options={getSharedValuesChartOptions(popupCompany['predicted_shared_values'])} />
                  </div>
                  <div className="shared-values-grid">
                    {popupCompany['predicted_shared_values'] ? 
                      (Array.isArray(popupCompany['predicted_shared_values']) ? 
                        popupCompany['predicted_shared_values'].map((value, index) => (
                          <div key={index} className="value-item">
                            <div className="value-icon">🎯</div>
                            <div className="value-content">
                              <h4>{value}</h4>
                              <p>Aligned with company's strategic priorities and values.</p>
                            </div>
                          </div>
                        ))
                        : 
                        popupCompany['predicted_shared_values'].split(';').map((value, index) => (
                          <div key={index} className="value-item">
                            <div className="value-icon">🎯</div>
                            <div className="value-content">
                              <h4>{value.trim()}</h4>
                              <p>Aligned with company's strategic priorities and values.</p>
                            </div>
                          </div>
                        ))
                      )
                    : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Early-Stage Areas of Focus */}
              <div className="popup-section">
                <h3>Early-Stage Areas of Focus</h3>
                <div className="focus-list">
                  {popupCompany['early_stage_focus'] ? 
                    (Array.isArray(popupCompany['early_stage_focus']) ? 
                      popupCompany['early_stage_focus'].map((focus, index) => (
                        <div key={index} className="focus-item">
                          <span className="focus-number">{(index + 1).toString().padStart(2, '0')}</span>
                          <span className="focus-text">{focus}</span>
                        </div>
                      ))
                      :
                      popupCompany['early_stage_focus'].split(';').map((focus, index) => (
                        <div key={index} className="focus-item">
                          <span className="focus-number">{(index + 1).toString().padStart(2, '0')}</span>
                          <span className="focus-text">{focus.trim()}</span>
                        </div>
                      ))
                    )
                  : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* Assumptions & Dependencies */}
              <div className="popup-section">
                <h3>Assumptions & Dependencies</h3>
                <div className="assumptions-grid">
                  <div className="assumptions-column">
                    <h4>Assumptions</h4>
                    <ul>
                      {popupCompany['assumptions'] ? 
                        (Array.isArray(popupCompany['assumptions']) ? 
                          popupCompany['assumptions'].map((assumption, index) => (
                            <li key={index}>{assumption}</li>
                          ))
                          :
                          popupCompany['assumptions'].split(';').map((assumption, index) => (
                            <li key={index}>{assumption.trim()}</li>
                          ))
                        )
                      : (
                        <>
                          <li>Past Higher Education (HE) investments</li>
                          <li>Financial Capacity</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div className="dependencies-column">
                    <h4>Dependencies</h4>
                    <ul>
                      {popupCompany['dependencies'] ? 
                        (Array.isArray(popupCompany['dependencies']) ? 
                          popupCompany['dependencies'].map((dependency, index) => (
                            <li key={index}>{dependency}</li>
                          ))
                          :
                          popupCompany['dependencies'].split(';').map((dependency, index) => (
                            <li key={index}>{dependency.trim()}</li>
                          ))
                        )
                      : (
                        <>
                          <li>Funding Priorities</li>
                          <li>Engagement Level Interest</li>
                          <li>Increased capacity in AI (etc) via partnership</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Project Ideation */}
              <div className="popup-section">
                <h3>Project Ideation</h3>
                <div className="project-ideation">
                  <p>{popupCompany['project_ideation'] || 'Develop projects aligned towards AI-based and data science for optimizing manufacturing, product performance analysis and water purification. How might we partner to accelerate their ESG work and connection with other local non-profits?'}</p>
                </div>
              </div>

              {/* Aligned Existing NMDSI COE Projects */}
              <div className="popup-section">
                <h3>Aligned Existing NMDSI COE Projects</h3>
                <div className="coe-projects-container">
                  {popupCompany['existing_coe_projects'] ? 
                    (Array.isArray(popupCompany['existing_coe_projects']) ? 
                      popupCompany['existing_coe_projects'].map((project, index) => (
                        <div key={index} className="coe-project-card">
                          <div className="project-icon">🔬</div>
                          <div className="project-content">
                            <h4>Project {index + 1}</h4>
                            <p>{project}</p>
                          </div>
                        </div>
                      ))
                      :
                      popupCompany['existing_coe_projects'].split(';').map((project, index) => (
                        <div key={index} className="coe-project-card">
                          <div className="project-icon">🔬</div>
                          <div className="project-content">
                            <h4>Project {index + 1}</h4>
                            <p>{project.trim()}</p>
                          </div>
                        </div>
                      ))
                    )
                  : (
                    <>
                      <div className="coe-project-card">
                        <div className="project-icon">🔬</div>
                        <div className="project-content">
                          <h4>Project 1</h4>
                          <p>How AI Technologies are Reshaping and Challenging Traditional Business Practices in MKE</p>
                        </div>
                      </div>
                      <div className="coe-project-card">
                        <div className="project-icon">🔬</div>
                        <div className="project-content">
                          <h4>Project 2</h4>
                          <p>Ethical AI: Challenges and Opportunities</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Key Focus Areas */}
              <div className="popup-section">
                <h3>Key Focus Areas</h3>
                <div className="focus-areas">
                  {popupCompany['key_focus_areas'] ? 
                    (Array.isArray(popupCompany['key_focus_areas']) ? 
                      popupCompany['key_focus_areas'].map((area, index) => (
                        <span key={index} className="focus-tag">{area}</span>
                      ))
                      :
                      popupCompany['key_focus_areas'].split(';').map((area, index) => (
                        <span key={index} className="focus-tag">{area.trim()}</span>
                      ))
                    )
                  : (
                    <>
                      <span className="focus-tag">Sustainable manufacturing</span>
                      <span className="focus-tag">Water purification and technology</span>
                      <span className="focus-tag">Sustainability</span>
                    </>
                  )}
                </div>
              </div>
            </div>


          </div>
        </div>
      )}

      {chartData && (
        <div className="dashboard-container">
          {/* Model Tabs */}
          <div className="model-tabs">
            <button
              className={`tab-button ${activeModelTab === 'logistic' ? 'active' : ''}`}
              onClick={() => setActiveModelTab('logistic')}
            >
              Logistic Regression
            </button>
            <button
              className={`tab-button ${activeModelTab === 'randomforest' ? 'active' : ''}`}
              onClick={() => setActiveModelTab('randomforest')}
            >
              Random Forest
            </button>
            <button
              className={`tab-button ${activeModelTab === 'xgboost' ? 'active' : ''}`}
              onClick={() => setActiveModelTab('xgboost')}
            >
              XGBoost
            </button>
          </div>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Top-Left: Model Basic Info */}
            <div className="dashboard-panel model-info-panel">
              <div className="panel-header">
                <div className="info-box">
                  <div className="info-icon">ℹ️</div>
                  <div className="info-text">
                    This section gives you details about the currently active model, including when it was last trained and the dataset it used.
                  </div>
                </div>
                <h2>Model Basic Info</h2>
              </div>
              
              {chartData[activeModelTab] && (
                <div className="model-info-grid">
                  <div className="info-card">
                    <div className="info-card-icon">🤖</div>
                    <div className="info-card-content">
                      <div className="info-card-title">MODEL NAME</div>
                      <div className="info-card-value">
                        {activeModelTab === 'logistic' ? 'Logistic Regression' : 
                         activeModelTab === 'randomforest' ? 'Random Forest' : 
                         activeModelTab === 'xgboost' ? 'XGBoost' : 'Unknown Model'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon status-active">●</div>
                    <div className="info-card-content">
                      <div className="info-card-title">STATUS</div>
                      <div className="info-card-value">Active</div>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon">🆔</div>
                    <div className="info-card-content">
                      <div className="info-card-title">MODEL ID</div>
                      <div className="info-card-value">{chartData[activeModelTab].info.modelId || '20250724085210_8ef2537d'}</div>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon">🕐</div>
                    <div className="info-card-content">
                      <div className="info-card-title">LAST UPDATED</div>
                      <div className="info-card-value">
                        {chartData[activeModelTab].info.createdAt 
                          ? new Date(chartData[activeModelTab].info.createdAt).toLocaleString()
                          : '7/24/2025, 8:52:10 AM'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon">📊</div>
                    <div className="info-card-content">
                      <div className="info-card-title">DATASET ID</div>
                      <div className="info-card-value">{chartData[activeModelTab].info.datasetId || 'acf19642-d460-4c9d-9ac3-4f66cf1b5022'}</div>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon">📁</div>
                    <div className="info-card-content">
                      <div className="info-card-title">DATASET</div>
                      <div className="info-card-value">{chartData[activeModelTab].info.filename || 'final_nmdsi_enriched_all_1.csv'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right: Precision, Recall, F1, Accuracy */}
            <div className="dashboard-panel chart-panel">
              <div className="panel-header">
                <div className="info-box">
                  <div className="info-icon">📊</div>
                  <div className="info-text">
                    These metrics show how well the model performs: Precision, Recall, F1 Score, and Accuracy.
                  </div>
                </div>
                <h2>Precision, Recall, F1, Accuracy</h2>
              </div>
              
              {chartData[activeModelTab] && (
                <div className="chart-container">
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getBarOptions(chartData[activeModelTab])}
                  />
                </div>
              )}
            </div>

            {/* Bottom-Left: ROC Curve */}
            <div className="dashboard-panel chart-panel">
              <div className="panel-header">
                <div className="info-box">
                  <div className="info-icon">✅</div>
                  <div className="info-text">
                    The ROC curve shows performance trade-offs. The closer the curve is to top-left, the better.
                  </div>
                </div>
                <h2>ROC Curve</h2>
              </div>
              
              {chartData[activeModelTab] && (
                <div className="chart-container">
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getRocOptions(chartData[activeModelTab])}
                  />
                </div>
              )}
            </div>

            {/* Bottom-Right: Confusion Matrix */}
            <div className="dashboard-panel chart-panel">
              <div className="panel-header">
                <div className="info-box">
                  <div className="info-icon">🔲</div>
                  <div className="info-text">
                    Confusion matrix visualization of actual vs predicted sponsorships.
                  </div>
                </div>
                <h2>Confusion Matrix</h2>
              </div>
              
              {chartData[activeModelTab] && (
                <div className="chart-container">
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getConfusionMatrixOptions(chartData[activeModelTab])}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
