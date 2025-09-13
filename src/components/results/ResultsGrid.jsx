import { Row, Col } from 'react-bootstrap';
import ResultCard from './ResultCard';

const ResultsGrid = ({ elections }) => {
  return (
    <Row className="g-4">
      {elections.map((election) => (
        <Col key={election.id} md={6} lg={4}>
          <ResultCard election={election} />
        </Col>
      ))}
    </Row>
  );
};

export default ResultsGrid;