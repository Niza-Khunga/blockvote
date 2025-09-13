'use client';
import { Container, Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import Link from 'next/link';

const VoterView = ({ stats }) => {
  const participationRate = stats.registered > 0 
    ? Math.round((stats.participated / stats.registered) * 100) 
    : 0;

  const StatCard = ({ title, value, icon, color }) => (
    <Col md={4}>
      <Card className="border-0 shadow-sm h-100">
        <Card.Body className="text-center p-4">
          <div className={`text-${color} mb-3`}>
            <i className={`bi bi-${icon} fs-1`}></i>
          </div>
          <h3 className="fw-bold text-dark mb-1">{value}</h3>
          <Card.Text className="text-muted small">{title}</Card.Text>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container className="py-4">
      {/* Statistics */}
      <h2 className="h4 fw-bold mb-4">My Voting Activity</h2>
      <Row className="g-3 mb-5">
        <StatCard 
          title="Participated" 
          value={stats?.participated ?? 0} 
          icon="check-circle-fill" 
          color="success"
        />
        <StatCard 
          title="Registered" 
          value={stats?.registered ?? 0} 
          icon="person-check-fill" 
          color="primary"
        />
        <StatCard 
          title="Active" 
          value={stats?.active ?? 0} 
          icon="broadcast" 
          color="warning"
        />
      </Row>

      {/* Participation Progress */}
      {stats.registered > 0 && (
        <Card className="border-0 bg-light mb-5">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Participation Rate</h6>
              <span className="text-primary fw-bold">{participationRate}%</span>
            </div>
            <ProgressBar 
              now={participationRate} 
              variant="primary" 
              className="mb-2"
              style={{ height: '8px' }}
            />
            <small className="text-muted">
              {stats.participated} out of {stats.registered} elections voted
            </small>
          </Card.Body>
        </Card>
      )}

      {/* Action Cards */}
      <h2 className="h4 fw-bold mb-4">Voting Actions</h2>
      <Row className="g-3">
        <Col md={6}>
          <Card className="border-0 bg-primary text-white h-100 hover-lift">
            <Card.Body className="p-4 text-center d-flex flex-column">
              <div className="mb-3">
                <i className="bi bi-box-arrow-in-right fs-1"></i>
              </div>
              <Card.Title as="h5" className="mb-3">Participate in Elections</Card.Title>
              <Card.Text className="mb-4 opacity-75">
                Browse active elections, register, and cast your secure vote on the blockchain
              </Card.Text>
              <Link href="/elections" passHref>
                <Button variant="light" size="lg" className="fw-bold">
                  View Elections
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="border-0 border h-100 hover-lift">
            <Card.Body className="p-4 text-center d-flex flex-column">
              <div className="text-success mb-3">
                <i className="bi bi-shield-check fs-1"></i>
              </div>
              <Card.Title as="h5" className="mb-3">Verify Your Votes</Card.Title>
              <Card.Text className="mb-4 text-muted">
                Confirm your votes were recorded correctly on the blockchain with cryptographic proof
              </Card.Text>
              <Link href="/verify-vote" passHref>
                <Button variant="success" className="fw-bold">
                  Verify Votes
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VoterView;