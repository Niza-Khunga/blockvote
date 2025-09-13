'use client';
import { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import CreateElection from '@/components/CreateElection';
import ManageElections from '@/components/ManageElections';
import ManageUsers from '@/components/ManageUsers';
import ManageVoters from '@/components/ManageVoters';

const AdminView = ({ stats }) => {
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showManageElections, setShowManageElections] = useState(false);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showManageVoters, setShowManageVoters] = useState(false);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Col md={6} lg={3}>
      <Card className="border-0 shadow-sm h-100">
        <Card.Body className="text-center p-4">
          <div className={`text-${color} mb-3`}>
            <i className={`bi bi-${icon} fs-1`}></i>
          </div>
          <h2 className="fw-bold text-dark mb-1">{value}</h2>
          <Card.Text className="text-muted small mb-0">{title}</Card.Text>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </Card.Body>
      </Card>
    </Col>
  );

  const ActionCard = ({ title, description, icon, variant, onClick }) => (
    <Col md={6} lg={3}>
      <Card className="border-0 shadow-sm h-100 hover-lift">
        <Card.Body className="text-center p-4 d-flex flex-column">
          <div className={`text-${variant} mb-3`}>
            <i className={`bi bi-${icon} fs-1`}></i>
          </div>
          <Card.Title className="h5 mb-3">{title}</Card.Title>
          <Card.Text className="text-muted small flex-grow-1">
            {description}
          </Card.Text>
          <Button 
            variant={variant} 
            onClick={onClick}
            className="mt-auto"
          >
            {title.split(' ')[0]}
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <>
      <Container className="py-4">
        {/* Statistics */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h4 fw-bold mb-0">System Overview</h2>
          <Badge bg="light" text="dark" className="fs-6">
            Real-time Stats
          </Badge>
        </div>
        
        <Row className="g-3 mb-5">
          <StatCard 
            title="Active Elections" 
            value={stats?.active || 0} 
            icon="broadcast" 
            color="success"
          />
          <StatCard 
            title="Ended Elections" 
            value={stats?.ended || 0} 
            icon="calendar-check" 
            color="secondary"
          />
          <StatCard 
            title="Upcoming" 
            value={stats?.upcoming || 0} 
            icon="clock-history" 
            color="warning"
          />
          <StatCard 
            title="Total Elections" 
            value={stats?.total || 0} 
            icon="collection" 
            color="primary"
            subtitle="All time"
          />
        </Row>

        {/* Admin Controls */}
        <h2 className="h4 fw-bold mb-4">Administration Panel</h2>
        <Row className="g-3">
          <ActionCard
            title="Create Election"
            description="Launch a new election with custom candidates and timelines"
            icon="plus-circle-fill"
            variant="primary"
            onClick={() => setShowCreateElection(true)}
          />
          <ActionCard
            title="Manage Elections"
            description="Start, end, or cancel existing elections on the platform"
            icon="gear-fill"
            variant="success"
            onClick={() => setShowManageElections(true)}
          />
          <ActionCard
            title="Voter Management"
            description="Oversee voter eligibility and registration for elections"
            icon="person-check-fill"
            variant="info"
            onClick={() => setShowManageVoters(true)}
          />
          <ActionCard
            title="User Roles"
            description="Assign and revoke Admin and Auditor roles across the system"
            icon="person-gear"
            variant="warning"
            onClick={() => setShowManageUsers(true)}
          />
        </Row>
      </Container>

      {/* Modals */}
      <CreateElection showModal={showCreateElection} setShowModal={setShowCreateElection} />
      <ManageElections showModal={showManageElections} setShowModal={setShowManageElections} />
      <ManageUsers showModal={showManageUsers} setShowModal={setShowManageUsers} />
      <ManageVoters showModal={showManageVoters} setShowModal={setShowManageVoters} />
    </>
  );
};

export default AdminView;