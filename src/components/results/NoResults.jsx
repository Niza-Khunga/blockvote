'use client';
import { Button } from 'react-bootstrap';
import Link from 'next/link';

const NoResults = () => {
  return (
    <div className="text-center py-5">
      <div className="text-muted mb-3">
        <i className="bi bi-archive" style={{ fontSize: '4rem' }}></i>
      </div>
      <h4>No Finalized Elections Found</h4>
      <p className="text-muted">
        There are no elections with finalized results available at the moment.
      </p>
      <Link href="/elections" passHref>
        <Button variant="primary">View Active Elections</Button>
      </Link>
    </div>
  );
};

export default NoResults;