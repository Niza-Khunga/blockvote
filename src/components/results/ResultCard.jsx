'use client';
import { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { useResultsContext } from '@/context/ResultsContext';

const ResultCard = ({ election }) => {
  const { getElectionResults } = useResultsContext();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [winner, setWinner] = useState({ name: 'N/A', votes: 0, tie: false });

  useEffect(() => {
    const fetchResults = async () => {
      if (!election) return;
      setLoading(true);
      try {
        const results = await getElectionResults(election.id);
        setResultData(results);

        // Determine the winner
        let maxVotes = -1;
        let currentWinner = 'N/A';
        let isTie = false;

        results.candidates.forEach((candidate, index) => {
          const voteCount = results.voteCounts[index];
          if (voteCount > maxVotes) {
            maxVotes = voteCount;
            currentWinner = candidate;
            isTie = false;
          } else if (voteCount === maxVotes && maxVotes > 0) {
            isTie = true;
          }
        });

        setWinner({ name: currentWinner, votes: maxVotes, tie: isTie });

      } catch (err) {
        setError('Could not load detailed results for this election.');
        console.error(`Error fetching results for election ${election.id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [election, getElectionResults]);

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <Card.Title className="h6 mb-0">#{election.id}: {election.title}</Card.Title>
          <Badge bg="dark">Finalized</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : resultData && (
          <div>
            <div className="text-center mb-4">
              <h5 className="text-muted mb-1">{winner.tie ? 'Result is a Tie' : 'Winner'}</h5>
              <h3 className="fw-bold text-success mb-1">
                <i className="bi bi-trophy-fill me-2"></i>
                {winner.tie ? 'Multiple Candidates' : winner.name}
              </h3>
              <p className="mb-0">
                with <strong>{winner.votes}</strong> out of <strong>{resultData.totalVotes}</strong> votes
              </p>
            </div>
            
            <hr />
            
            <h6 className="mb-3">Vote Distribution:</h6>
            {resultData.candidates.map((candidate, index) => {
              const voteCount = resultData.voteCounts[index];
              const percentage = resultData.totalVotes > 0 ? ((voteCount / resultData.totalVotes) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>{candidate}</span>
                    <span className="fw-bold">{voteCount} ({percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${percentage}%` }}
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="text-muted small">
        Election ended on: {new Date(election.endDate).toLocaleDateString()}
      </Card.Footer>
    </Card>
  );
};

export default ResultCard;