import Papa from 'papaparse';

export const DISEASES = [
  { id: 'parkinsons', name: 'Parkinson\'s Disease' },
  { id: 'breast_cancer', name: 'Breast Cancer' },
  { id: 'hepatitis_c', name: 'Hepatitis C' },
  { id: 'heart_disease', name: 'Heart Disease' },
  { id: 'mammographic_mass', name: 'Mammographic Mass' },
  { id: 'thyroid_disease', name: 'Thyroid Disease' },
  { id: 'indian_liver', name: 'Indian Liver Patient' },
  { id: 'chronic_kidney', name: 'Chronic Kidney Disease' },
  { id: 'wilsons_disease', name: 'Wilson\'s Disease' },
  { id: 'als', name: 'ALS' },
  { id: 'acute_nephritis', name: 'Acute Nephritis' },
  { id: 'heart_failure', name: 'Heart Failure' },
];

/**
 * Fetch and parse a CSV file.
 * @param {string} url - The URL to fetch (relative to public)
 * @returns {Promise<Array>} Parsed CSV data
 */
export const fetchCSV = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Could not fetch ${url}`);
      return [];
    }
    const text = await response.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  } catch (err) {
    console.error(`Error loading CSV at ${url}:`, err);
    return [];
  }
};

/**
 * Get benchmark summary across all diseases.
 */
export const getBenchmarkSummary = async () => {
  return await fetchCSV('/results/data/benchmark_results_summary.csv');
};

/**
 * Get summary data for a specific disease.
 * @param {string} diseaseId 
 */
export const getDiseaseSummary = async (diseaseId) => {
  return await fetchCSV(`/results/data/summary_${diseaseId}.csv`);
};
