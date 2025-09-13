'use client';
import { useState, useEffect } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useVotingContext } from '@/context/VotingContext';
import { useElectionContext } from '@/context/ElectionContext';
import ResultsHeader from '@/components/results/ResultsHeader';
import ResultsGrid from '@/components/results/ResultsGrid';
import NoResults from '@/components/results/NoResults';

export default function Results() {
  const { isConnected } = useVotingContext();
  const { elections, getElections, loading, error } = useElectionContext();
  const [finalizedElections, setFinalizedElections] = useState([]);

  useEffect(() => {
    if (isConnected) {
      getElections();
    }
  }, [isConnected, getElections]);

  useEffect(() => {
    if (elections.length > 0) {
      // Filter for elections that are marked as finalized
      const finalized = elections.filter(e => e.isFinalized);
      setFinalizedElections(finalized);
    }
  }, [elections]);

  return (
    <Container className="py-4">
      <ResultsHeader />

      {error && (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Results</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading finalized elections...</p>
        </div>
      )}

      {!loading && !error && (
        finalizedElections.length > 0 ? (
          <ResultsGrid elections={finalizedElections} />
        ) : (
          <NoResults />
        )
      )}
    </Container>
  );
}