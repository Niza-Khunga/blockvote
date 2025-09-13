'use client';
import { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import { useVotingContext } from './VotingContext';

const VoteContext = createContext();

export const VoteProvider = ({ children }) => {
  const { votingContract, account, isConnected, provider } = useVotingContext();
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState(null);

  const vote = async (electionId, candidateName) => {
    if (!votingContract || !account || !isConnected || !provider) {
      throw new Error('Wallet not connected or provider not available');
    }

    try {
      setVoting(true);
      setError(null);

      // Generate salt and encrypted vote as per your contract requirements
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const nonce = Math.floor(Math.random() * 1000000);
      
      // Create encrypted vote hash that matches your contract's expected format
      const encryptedVote = ethers.keccak256(
        ethers.toUtf8Bytes(`${electionId}-${candidateName}-${account}-${salt}-${nonce}-${Date.now()}`)
      );

      console.log('Casting vote with parameters:', {
        electionId,
        candidateName,
        encryptedVote,
        nonce
      });

      const tx = await votingContract.castVote(
        electionId,
        candidateName,
        encryptedVote,
        nonce,
        { gasLimit: 500000 }
      );

      console.log('Vote transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Vote transaction confirmed:', receipt);

      // Get previous block hash from the receipt's block
      const block = await provider.getBlock(receipt.blockNumber);
      const previousBlockHash = block.parentHash;

      // Create a vote details object to save
      const voteDetails = {
        electionId: Number(electionId),
        candidateName,
        encryptedVote,
        nonce,
        voterAddress: account,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        previousBlockHash,
        timestamp: new Date().toISOString(),
      };

      // Save the details to localStorage
      try {
        const existingVotes = JSON.parse(localStorage.getItem(`votes_${account}`)) || [];
        localStorage.setItem(`votes_${account}`, JSON.stringify([...existingVotes, voteDetails]));
        console.log('Vote details saved to local storage.');
      } catch (e) {
        console.error('Could not save vote details to local storage:', e);
      }
      
      // --- NEW CODE ENDS HERE ---

      return receipt;
    } catch (error) {
      console.error('Error casting vote:', error);
      
      let errorMessage = 'Failed to cast vote';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction gas';
      } else if (error.message?.includes('already voted')) {
        errorMessage = 'You have already voted in this election';
      } else if (error.message?.includes('not registered')) {
        errorMessage = 'You are not registered to vote in this election';
      } else if (error.message?.includes('not in voting period')) {
        errorMessage = 'This election is not currently active';
      } else if (error.message?.includes('Invalid candidate')) {
        errorMessage = 'Invalid candidate selected';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setVoting(false);
    }
  };

  const checkVoterRegistration = async (electionId) => {
    if (!votingContract || !account || !isConnected) {
      return false;
    }

    try {
      console.log('Checking voter registration for election:', electionId, 'account:', account);
      const isRegistered = await votingContract.isVoterRegistered(electionId, account);
      console.log('Voter registration status:', isRegistered);
      return isRegistered;
    } catch (error) {
      console.error('Error checking voter registration:', error);
      
      // Fallback: try alternative function names if available
      try {
        const isRegistered = await votingContract.isRegistered(electionId, account);
        console.log('Fallback registration check result:', isRegistered);
        return isRegistered;
      } catch (fallbackError) {
        console.error('Fallback registration check failed:', fallbackError);
        setError('Failed to check registration status');
        return false;
      }
    }
  };

  const checkHasVoted = async (electionId) => {
    if (!votingContract || !account || !isConnected) {
      return false;
    }

    try {
      console.log('Checking if voter has voted for election:', electionId, 'account:', account);
      const hasVoted = await votingContract.hasVoterVoted(electionId, account);
      console.log('Vote status:', hasVoted);
      return hasVoted;
    } catch (error) {
      console.error('Error checking vote status:', error);
      
      // Fallback: try alternative function names if available
      try {
        const hasVoted = await votingContract.hasVoted(electionId, account);
        console.log('Fallback vote check result:', hasVoted);
        return hasVoted;
      } catch (fallbackError) {
        console.error('Fallback vote check failed:', fallbackError);
        setError('Failed to check vote status');
        return false;
      }
    }
  };

  const registerVoter = async (electionId, merkleProof = []) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setVoting(true);
      setError(null);
      
      console.log('Registering voter for election:', electionId, 'with merkleProof:', merkleProof);
      
      const tx = await votingContract.registerVoter(
        electionId, 
        merkleProof, 
        { gasLimit: 300000 }
      );
      
      console.log('Registration transaction sent:', tx.hash);
      
      // Wait for transaction confirmation and return the receipt
      const receipt = await tx.wait();
      console.log('Registration transaction confirmed:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error registering voter:', error);
      
      let errorMessage = 'Failed to register voter';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction gas';
      } else if (error.message?.includes('already registered')) {
        errorMessage = 'You are already registered for this election';
      } else if (error.message?.includes('ended')) {
        errorMessage = 'This election has already ended';
      } else if (error.message?.includes('Invalid proof') || error.message?.includes('Merkle')) {
        errorMessage = 'Registration requires valid proof or admin approval';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setVoting(false);
    }
  };

  const setVoterIdentity = async (identity) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setVoting(true);
      setError(null);
      
      console.log('Setting voter identity:', identity);
      
      const tx = await votingContract.setVoterIdentity(identity, { gasLimit: 200000 });
      
      console.log('Identity transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Identity transaction confirmed:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error setting voter identity:', error);
      
      let errorMessage = 'Failed to set voter identity';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setVoting(false);
    }
  };

  const getVoterIdentity = async (voterAddress = account) => {
    if (!votingContract || !voterAddress) {
      return '';
    }

    try {
      const identity = await votingContract.voterIdentities(voterAddress);
      return identity;
    } catch (error) {
      console.error('Error getting voter identity:', error);
      return '';
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <VoteContext.Provider
      value={{
        // State
        voting,
        error,
        
        // Voting functions
        vote,
        checkVoterRegistration,
        checkHasVoted,
        registerVoter,
        setVoterIdentity,
        getVoterIdentity,
        
        // Utility functions
        clearError
      }}
    >
      {children}
    </VoteContext.Provider>
  );
};

export const useVoteContext = () => {
  const context = useContext(VoteContext);
  if (!context) {
    throw new Error('useVoteContext must be used within a VoteProvider');
  }
  return context;
};