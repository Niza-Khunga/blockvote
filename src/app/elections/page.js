'use client';
import { useState, useEffect, useCallback } from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { useVotingContext } from '@/context/VotingContext';
import { useVoteContext } from '@/context/VoteContext';
import { toast } from 'react-toastify';
import ElectionsHeader from '@/components/elections/ElectionsHeader';
import ElectionsSearch from '@/components/elections/ElectionsSearch';
import ElectionsGrid from '@/components/elections/ElectionsGrid';
import ElectionsStats from '@/components/elections/ElectionsStats';
import LoadingSpinner from '@/components/elections/LoadingSpinner';
import NoElections from '@/components/elections/NoElections';

export default function Elections() {
  const { votingContract, account, connectWallet, isConnecting, connectionError } = useVotingContext();
  const { vote } = useVoteContext();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [votingInProgress, setVotingInProgress] = useState(null);

  const fetchElections = useCallback(async (isRefresh = false) => {
    if (!votingContract) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const electionCount = await votingContract.getElectionCount();
      const count = Number(electionCount);
      
      if (count === 0) {
        setElections([]);
        setLoading(false);
        return;
      }
      const electionList = [];
      for (let i = 1; i <= count; i++) {
        try {
          const details = await votingContract.getElectionDetails(i);
          const election = {
            id: i,
            title: details.title || 'Untitled Election',
            description: details.description || '',
            status: Number(details.status), // Still useful for Canceled
            startDate: new Date(Number(details.startDate) * 1000),
            endDate: new Date(Number(details.endDate) * 1000),
            candidates: details.candidates || [],
            totalVotes: Number(details.totalVotes || 0),
            isFinalized: details.isFinalized || false
          };
          // We still want to exclude canceled elections from the main view
          if (election.status !== 3) {
            electionList.push(election);
          }
        } catch (err) {
          console.warn(`Error fetching election ${i}:`, err);
        }
      }
      setElections(electionList.reverse()); // Show newest first
      if (isRefresh) {
        toast.success('Elections refreshed!');
      }
    } catch (err) {
      console.error('Error fetching elections:', err);
      const errorMessage = `Failed to load elections: ${err.message || 'Unknown error'}`;
      setError(errorMessage);
      toast.error('Failed to load elections.');
    } finally {
      setLoading(false);
    }
  }, [votingContract]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const handleVote = async (electionId, candidateName) => {
    if (!account) {
      toast.error('Please connect your wallet to vote.');
      return;
    }

    setVotingInProgress(electionId);
    try {
      console.log(`Voting for ${candidateName} in election ${electionId}...`);
      
      // Check if election is active
      const election = elections.find(e => e.id === electionId);
      const statusInfo = getElectionStatus(election);
      
      if (statusInfo.text !== 'Active') {
        throw new Error(`Cannot vote in ${statusInfo.text.toLowerCase()} election`);
      }

      // Check if candidate exists
      if (!election.candidates.includes(candidateName)) {
        throw new Error('Candidate not found in this election');
      }

      // Call the vote function from context
      const tx = await vote(electionId, candidateName);
      console.log('Vote transaction:', tx);
      
      toast.success('Vote cast successfully!');
      
      // Refresh elections to update vote count
      await fetchElections(true);
      
    } catch (err) {
      console.error('Error voting:', err);
      let errorMessage = err.message || 'Failed to cast vote';
      
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setVotingInProgress(null);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      
      // Don't show toast for "already processing" errors to avoid spam
      if (!err.message.includes('already processing') && 
          !err.message.includes('Connection already in progress') &&
          !err.message.includes('MetaMask is busy')) {
        toast.error(`Failed to connect wallet: ${err.message}`);
      }
    }
  };

  // --- UPDATED LOGIC ---
  // This helper function now determines the status based on the current time.
  const getElectionStatus = (election) => {
    // Definitive states from the contract take priority
    if (election.status === 3) return { text: 'Canceled', variant: 'danger' };
    if (election.isFinalized) return { text: 'Finalized', variant: 'dark' };

    // Time-based states for the election lifecycle
    const now = new Date();
    if (now < election.startDate) return { text: 'Upcoming', variant: 'warning' };
    if (now >= election.startDate && now <= election.endDate) return { text: 'Active', variant: 'success' };
    if (now > election.endDate) return { text: 'Ended', variant: 'secondary' };

    return { text: 'Unknown', variant: 'light' }; // Fallback
  };

  // Helper function to check if user can vote in an election
  const canVoteInElection = (election) => {
    const status = getElectionStatus(election);
    return status.text === 'Active' && account;
  };

  const filteredElections = elections.filter(election => {
    const statusInfo = getElectionStatus(election);
    
    // The filter value is lowercase, e.g., 'active', 'upcoming'
    if (statusFilter !== 'all' && statusInfo.text.toLowerCase() !== statusFilter) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        election.title.toLowerCase().includes(searchLower) ||
        election.description.toLowerCase().includes(searchLower) ||
        election.candidates.some(candidate => 
          candidate.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return true;
  });

  return (
    <Container className="py-4">
      <ElectionsHeader 
        account={account} 
        onConnectWallet={handleConnectWallet}
        isConnecting={isConnecting}
        connectionError={connectionError}
      />
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Error</Alert.Heading>
          {error}
          <div className="mt-2">
            <Button variant="outline-primary" size="sm" onClick={() => fetchElections(true)}>
              Try Again
            </Button>
          </div>
        </Alert>
      )}

      <ElectionsSearch
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => fetchElections(true)}
      />

      {loading && <LoadingSpinner />}

      {!loading && filteredElections.length === 0 && (
        <NoElections 
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          onRefresh={() => fetchElections(true)}
        />
      )}

      {!loading && filteredElections.length > 0 && (
        <>
          <ElectionsGrid
            elections={filteredElections}
            votingInProgress={votingInProgress}
            onVote={handleVote}
            account={account}
            getElectionStatus={getElectionStatus}
            canVoteInElection={canVoteInElection}
          />
          <ElectionsStats 
            elections={elections} 
            getElectionStatus={getElectionStatus} 
          />
        </>
      )}
    </Container>
  );
}