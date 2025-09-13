'use client';
import { Container } from 'react-bootstrap';

const ResultsHeader = () => {
  return (
    <div className="text-center mb-5">
      <h1 className="display-4 fw-bold text-primary">Election Results</h1>
      <p className="lead text-muted">
        Browse the finalized, on-chain results for all completed elections.
        Each result is permanent and publicly verifiable.
      </p>
    </div>
  );
};

export default ResultsHeader;