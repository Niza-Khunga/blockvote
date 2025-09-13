'use client';
import { createContext, useContext, useState } from 'react';
import { useVotingContext } from './VotingContext';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const { votingContract, account, isConnected } = useVotingContext();
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  const assignRole = async (userAddress, role) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setAdminLoading(true);
      const tx = await votingContract.assignRole(userAddress, role, { gasLimit: 300000 });
      await tx.wait();
      return tx;
    } catch (error) {
      setAdminError(error.message);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  const removeAuditor = async (auditorAddress) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setAdminLoading(true);
      const tx = await votingContract.removeAuditor(auditorAddress, { gasLimit: 300000 });
      await tx.wait();
      return tx;
    } catch (error) {
      setAdminError(error.message);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  const setVoterEligibility = async (electionId, voterAddress, isEligible) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setAdminLoading(true);
      const tx = await votingContract.setVoterEligibility(
        electionId,
        voterAddress,
        isEligible,
        { gasLimit: 300000 }
      );
      await tx.wait();
      return tx;
    } catch (error) {
      setAdminError(error.message);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  const updateMerkleRoot = async (electionId, merkleRoot) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setAdminLoading(true);
      const tx = await votingContract.updateMerkleRoot(
        electionId,
        merkleRoot,
        { gasLimit: 300000 }
      );
      await tx.wait();
      return tx;
    } catch (error) {
      setAdminError(error.message);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  const adminRegisterVoter = async (electionId, voterAddress) => {
    if (!votingContract || !account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setAdminLoading(true);
      const tx = await votingContract.adminRegisterVoter(
        electionId,
        voterAddress,
        { gasLimit: 300000 }
      );
      await tx.wait();
      return tx;
    } catch (error) {
      setAdminError(error.message);
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        adminLoading,
        adminError,
        assignRole,
        removeAuditor,
        setVoterEligibility,
        updateMerkleRoot,
        adminRegisterVoter
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};