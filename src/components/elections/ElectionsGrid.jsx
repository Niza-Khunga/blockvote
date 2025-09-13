import { Row, Col } from 'react-bootstrap';
import ElectionCard from './ElectionCard';

const ElectionsGrid = ({ elections, votingInProgress, onVote, account }) => {
  return (
    <Row className="g-4">
      {elections.map((election) => (
        <Col key={election.id} lg={6} xl={4}>
          <ElectionCard
            election={election}
            votingInProgress={votingInProgress}
            onVote={onVote}
            account={account}
          />
        </Col>
      ))}
    </Row>
  );
};

export default ElectionsGrid;