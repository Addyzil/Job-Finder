import React, { useState, useCallback, useEffect } from 'react';
import { Filters, MarketReport } from './types';
import { fetchMarketReport } from './services/geminiService';
import { exportMarketReportToCsv } from './utils/csvExporter';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import MarketReportDisplay from './components/MarketReportDisplay';
import GraphDisplay from './components/GraphDisplay';

type LoadingAction = 'analyze' | null;

const App: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    qualification: 'All Degrees',
    sector: 'All Sectors',
    location: 'All Tiers',
    jobRole: 'All Roles',
  });
  const [marketReport, setMarketReport] = useState<MarketReport | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    const handleDownload = () => {
      if (marketReport && marketReport.tierAnalyses.length > 0) {
        exportMarketReportToCsv(marketReport.tierAnalyses);
      }
    };

    window.addEventListener('downloadCsv', handleDownload);

    return () => {
      window.removeEventListener('downloadCsv', handleDownload);
    };
  }, [marketReport]);

  const handleFilterChange = useCallback((filterName: keyof Filters, value: string) => {
    setFilters(prevFilters => {
        const newFilters = { ...prevFilters, [filterName]: value };
        return newFilters;
    });
  }, []);

  const resetState = () => {
    setError(null);
    setHasSearched(true);
    setMarketReport(null);
  }

  const handleAnalyzeMarket = useCallback(async () => {
    setLoadingAction('analyze');
    resetState();
    
    try {
      const report = await fetchMarketReport(filters);
      setMarketReport(report);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoadingAction(null);
    }
  }, [filters]);
  
  const isLoading = loadingAction !== null;
  const noResults = hasSearched && !isLoading && !error && (!marketReport || marketReport.tierAnalyses.length === 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onAnalyzeMarket={handleAnalyzeMarket}
          isLoading={isLoading}
          isDataAvailable={(marketReport?.tierAnalyses.length ?? 0) > 0}
        />
        <div className="mt-8">
          {isLoading ? (
            <LoadingSpinner text="Analyzing Live Job Market..." subtext="AI is gathering real-time data from multiple sources. This might take a moment." />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : marketReport ? (
            <div className="space-y-8">
              <GraphDisplay report={marketReport} />
              <MarketReportDisplay report={marketReport} />
            </div>
          ) : noResults ? (
             <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-700">No Results Found</h2>
                <p className="mt-2 text-gray-500">
                  The AI could not find a significant number of results for the selected filters. Please try a different combination.
                </p>
              </div>
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-700">Welcome to the Job Dashboard</h2>
                <p className="mt-2 text-gray-500">
                  Use the filters above to generate a strategic analysis of the job market by city tier.
                </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;