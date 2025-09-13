'use client';
import { Card, ListGroup, Button } from 'react-bootstrap';

const MyVotesList = ({ votes, onVerify, loadingVote }) => {
  if (!votes || votes.length === 0) {
    return (
      <Card className="mt-4 text-center shadow-sm">
        <Card.Body>
          <Card.Text className="text-muted">
            <i className="bi bi-info-circle me-2"></i>
            No past votes were found in this browser for your connected account.
            Votes you cast in the future will appear here automatically.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header>
        <Card.Title as="h5" className="mb-0">My Past Votes</Card.Title>
        <small className="text-muted">Votes cast from this browser</small>
      </Card.Header>
      <ListGroup variant="flush">
        {votes.map((vote, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="me-3">
              <strong>Election #{vote.electionId}</strong>
              <div className="text-muted small">
                Voted for: <strong>{vote.candidateName}</strong> on {new Date(vote.timestamp).toLocaleString()}
              </div>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onVerify(vote)}
              disabled={loadingVote === vote.transactionHash}
              className="mt-2 mt-md-0"
            >
              {loadingVote === vote.transactionHash ? 'Verifying...' : 'Verify'}
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

export default MyVotesList;