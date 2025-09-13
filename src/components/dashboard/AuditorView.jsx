'use client';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';

const AuditorView = ({ stats }) => {
  const ActionCard = ({ title, description, icon, variant, href, buttonText }) => (
    <Col md={6} lg={4}>
      <Card className="border-0 shadow-sm h-100 hover-lift">
        <Card.Body className="text-center p-4 d-flex flex-column">
          <div className={`text-${variant} mb-3`}>
            <i className={`bi bi-${icon} fs-1`}></i>
          </div>
          <Card.Title className="h5 mb-3">{title}</Card.Title>
          <Card.Text className="text-muted small flex-grow-1">
            {description}
          </Card.Text>
          <Link href={href} passHref>
            <Button variant={variant} className="mt-auto">
              {buttonText}
            </Button>
          </Link>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold mb-0">Audit & Oversight</h2>
        <Badge bg="light" text="dark" className="fs-6">
          System Integrity
        </Badge>
      </div>

      <Row className="g-3">
        <ActionCard
          title="Audit Results"
          description="Access real-time and finalized results to ensure transparency and fairness"
          icon="clipboard-data-fill"
          variant="primary"
          href="/elections"
          buttonText="View Results"
        />
        <ActionCard
          title="Verify Votes"
          description="Cryptographically verify individual votes to confirm correct recording"
          icon="shield-check"
          variant="success"
          href="/verify-vote"
          buttonText="Verify Votes"
        />
        <ActionCard
          title="Monitor Activity"
          description="Review registered voters and detect anomalies in participation"
          icon="person-lines-fill"
          variant="info"
          href="/elections"
          buttonText="Check Voters"
        />
      </Row>

      {/* Quick Stats for Auditor */}
      {stats && (
        <>
          <hr className="my-5" />
          <h3 className="h5 fw-bold mb-4">Election Statistics</h3>
          <Row className="g-3">
            <Col md={3}>
              <Card className="border-0 bg-light">
                <Card.Body className="text-center p-3">
                  <h4 className="fw-bold text-primary mb-1">{stats.active || 0}</h4>
                  <small className="text-muted">Active Elections</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 bg-light">
                <Card.Body className="text-center p-3">
                  <h4 className="fw-bold text-secondary mb-1">{stats.ended || 0}</h4>
                  <small className="text-muted">Completed Elections</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 bg-light">
                <Card.Body className="text-center p-3">
                  <h4 className="fw-bold text-warning mb-1">{stats.upcoming || 0}</h4>
                  <small className="text-muted">Upcoming Elections</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 bg-light">
                <Card.Body className="text-center p-3">
                  <h4 className="fw-bold text-dark mb-1">{stats.total || 0}</h4>
                  <small className="text-muted">Total Elections</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default AuditorView;