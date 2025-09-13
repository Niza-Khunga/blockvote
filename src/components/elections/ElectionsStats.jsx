import { Card, Row, Col } from 'react-bootstrap';

const ElectionsStats = ({ elections }) => {
  const getElectionStatus = (election) => {
    const now = new Date();
    const isActive = election.status === 1 && now >= election.startDate && now <= election.endDate;
    const isUpcoming = election.status === 0 && now < election.startDate;
    const isEnded = election.status === 2 || (election.status === 1 && now > election.endDate);

    if (isEnded) return 'Ended';
    if (isActive) return 'Active';
    if (isUpcoming) return 'Upcoming';
    return 'Unknown';
  };

  // Filter out cancelled elections from stats (status 3 is cancelled)
  const validElections = elections.filter(e => e.status !== 3);
  
  const activeCount = validElections.filter(e => getElectionStatus(e) === 'Active').length;
  const upcomingCount = validElections.filter(e => getElectionStatus(e) === 'Upcoming').length;
  const endedCount = validElections.filter(e => getElectionStatus(e) === 'Ended').length;

  return (
    <Row className="mt-5">
      <Col>
        <Card className="bg-light">
          <Card.Body className="text-center">
            <Row>
              <Col>
                <h4 className="mb-0">{validElections.length}</h4>
                <small>Total Elections</small>
              </Col>
              <Col>
                <h4 className="mb-0 text-success">{activeCount}</h4>
                <small>Active</small>
              </Col>
              <Col>
                <h4 className="mb-0 text-warning">{upcomingCount}</h4>
                <small>Upcoming</small>
              </Col>
              <Col>
                <h4 className="mb-0 text-secondary">{endedCount}</h4>
                <small>Ended</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ElectionsStats;