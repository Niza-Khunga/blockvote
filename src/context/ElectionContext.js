'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useVotingContext } from './VotingContext';

const ElectionContext = createContext();

export const ElectionProvider = ({ children }) => {
  const { votingContract, account, isConnected } = useVotingContext();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createElection = useCallback(async (electionData) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);
      
      const tx = await votingContract.createElection(
        electionData.title,
        electionData.description,
        electionData.candidates,
        BigInt(electionData.startTimestamp),
        BigInt(electionData.endTimestamp),
        electionData.merkleRoot || ethers.ZeroHash,
        { gasLimit: 1500000 }
      );

      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } catch (error) {
      console.error('Error creating election:', error);
      let errorMessage = error.reason || error.message || 'Failed to create election.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [votingContract, account, isConnected]);

  const updateElection = useCallback(async (electionId, electionData) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await votingContract.updateElection(
        electionId,
        electionData.title,
        electionData.description,
        electionData.candidates,
        BigInt(electionData.startTimestamp),
        BigInt(electionData.endTimestamp),
        { gasLimit: 1500000 }
      );

      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } catch (error) {
      console.error('Error updating election:', error);
      let errorMessage = error.reason || error.message || 'Failed to update election.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [votingContract, account, isConnected]);

  const getElections = useCallback(async () => {
    if (!votingContract) return [];

    try {
      setLoading(true);
      const count = await votingContract.getElectionCount();
      const electionsList = [];

      for (let i = 1; i <= count; i++) {
        try {
          const details = await votingContract.getElectionDetails(i);
          // We only add non-cancelled elections to the main list
          if (Number(details.status) !== 3) {
            electionsList.push({
              id: i,
              title: details.title,
              description: details.description,
              candidates: details.candidates,
              startDate: new Date(Number(details.startDate) * 1000),
              endDate: new Date(Number(details.endDate) * 1000),
              status: Number(details.status),
              rawStatus: Number(details.status),
              isFinalized: details.isFinalized,
              totalVotes: Number(details.totalVotes)
            });
          }
        } catch (error) {
          console.warn(`Error fetching election ${i}:`, error);
        }
      }

      setElections(electionsList);
      return electionsList;
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError(error.reason || 'Failed to fetch elections');
      return [];
    } finally {
      setLoading(false);
    }
  }, [votingContract]);

  const cancelElection = useCallback(async (electionId) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      const tx = await votingContract.cancelElection(electionId, { gasLimit: 500000 });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } catch (error) {
      console.error('Error cancelling election:', error);
      let errorMessage = error.reason || error.message || 'Failed to cancel election.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [votingContract, account, isConnected]);

  const finalizeElection = useCallback(async (electionId) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      const tx = await votingContract.finalizeElection(electionId, { gasLimit: 500000 });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } catch (error) {
      console.error('Error finalizing election:', error);
      let errorMessage = error.reason || error.message || 'Failed to finalize election.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [votingContract, account, isConnected]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    elections,
    loading,
    error,
    createElection,
    updateElection,
    getElections,
    cancelElection,
    finalizeElection,
    refreshElections: getElections,
    clearError
  }), [
    elections,
    loading,
    error,
    createElection,
    updateElection,
    getElections,
    cancelElection,
    finalizeElection,
    clearError
  ]);

  return (
    <ElectionContext.Provider value={contextValue}>
      {children}
    </ElectionContext.Provider>
  );
};

export const useElectionContext = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElectionContext must be used within an ElectionProvider');
  }
  return context;
};