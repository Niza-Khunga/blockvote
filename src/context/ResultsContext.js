'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useVotingContext } from './VotingContext';

const ResultsContext = createContext();

export const ResultsProvider = ({ children }) => {
  const { resultsContract, isConnected } = useVotingContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getElectionResults = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await resultsContract.getElectionResults(electionId);
      return {
        candidates: result.candidates,
        voteCounts: result.voteCounts.map(v => Number(v)),
        totalVotes: Number(result.totalVotes),
        totalVoters: Number(result.totalVoters),
        votedCount: Number(result.votedCount),
        turnoutPercentage: Number(result.turnoutPercentage)
      };
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to get election results';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  const getRealTimeResults = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await resultsContract.getRealTimeResults(electionId);
      return {
        candidates: result.candidates,
        voteCounts: result.voteCounts.map(v => Number(v)),
        totalVotes: Number(result.totalVotes),
        totalVoters: Number(result.totalVoters),
        votedCount: Number(result.votedCount),
        turnoutPercentage: Number(result.turnoutPercentage)
      };
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to get real-time results';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  const getVoterStatistics = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      const stats = await resultsContract.getVoterStatistics(electionId);
      return {
        totalVoters: Number(stats.totalVoters),
        voted: Number(stats.voted),
        turnoutPercentage: Number(stats.turnoutPercentage)
      };
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to get voter statistics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  // NEW: Function to get the election winner with tie information
  const getElectionWinner = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      const winnerInfo = await resultsContract.getElectionWinner(electionId);
      
      return {
        winner: winnerInfo.winner || '',
        voteCount: Number(winnerInfo.voteCount),
        isTie: winnerInfo.isTie,
        tiedCandidates: winnerInfo.tiedCandidates || []
      };
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to get election winner';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  // NEW: Function to get complete election result
  const getCompleteElectionResult = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await resultsContract.getCompleteElectionResult(electionId);
      
      return {
        electionId: Number(result.electionId),
        title: result.title,
        candidates: result.candidates,
        voteCounts: result.voteCounts.map(v => Number(v)),
        totalVotes: Number(result.totalVotes),
        totalVoters: Number(result.totalVoters),
        votedCount: Number(result.votedCount),
        turnoutPercentage: Number(result.turnoutPercentage),
        status: Number(result.status),
        isFinalized: result.isFinalized,
        endDate: new Date(Number(result.endDate) * 1000)
      };
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to get complete election result';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  // NEW: Function to check if election is finalized
  const isElectionFinalized = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      return await resultsContract.isElectionFinalized(electionId);
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to check election status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  // NEW: Function to get election status
  const getElectionStatus = useCallback(async (electionId) => {
    if (!resultsContract || !isConnected) {
      throw new Error('Results contract not available');
    }

    try {
      setLoading(true);
      setError(null);

      const status = await resultsContract.getElectionStatus(electionId);
      return Number(status);
    } catch (error) {
      const errorMessage = error.reason || error.message || 'Failed to get election status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resultsContract, isConnected]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    loading,
    error,
    getElectionResults,
    getRealTimeResults,
    getVoterStatistics,
    getElectionWinner,
    getCompleteElectionResult,
    isElectionFinalized,
    getElectionStatus,
    clearError
  }), [
    loading,
    error,
    getElectionResults,
    getRealTimeResults,
    getVoterStatistics,
    getElectionWinner,
    getCompleteElectionResult,
    isElectionFinalized,
    getElectionStatus,
    clearError
  ]);

  return (
    <ResultsContext.Provider value={contextValue}>
      {children}
    </ResultsContext.Provider>
  );
};

export const useResultsContext = () => {
  const context = useContext(ResultsContext);
  if (!context) {
    throw new Error('useResultsContext must be used within a ResultsProvider');
  }
  return context;
};