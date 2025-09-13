'use client';
import { Container, Badge, Button, Row, Col } from 'react-bootstrap';

const DashboardHeader = ({ role, account, onConnectWallet, networkError }) => {
  const roleInfo = {
    admin: {
      title: 'Admin Dashboard',
      description: 'Manage elections, users, and voter access with full administrative control.',
      badgeVariant: 'danger',
      badgeText: 'Admin Account',
      icon: '👑'
    },
    auditor: {
      title: 'Auditor Dashboard',
      description: 'Monitor election results and verify the integrity of the voting process.',
      badgeVariant: 'info',
      badgeText: 'Auditor Account',
      icon: '🔍'
    },
    voter: {
      title: 'My Dashboard',
      description: 'Participate in elections and track your voting activity.',
      badgeVariant: 'primary',
      badgeText: 'Voter Account',
      icon: '🗳️'
    },
  };

  const info = roleInfo[role] || roleInfo.voter;

  return (
    <section className="bg-gradient-primary text-white py-4">
      <Container>
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center mb-2">
              <span className="fs-1 me-3">{info.icon}</span>
              <div>
                <h1 className="h2 fw-bold mb-1">{info.title}</h1>
                <p className="mb-2 opacity-75">{info.description}</p>
              </div>
            </div>
          </Col>
          <Col md={4} className="text-md-end">
            {account ? (
              <div className="d-flex flex-column align-items-md-end">
                <Badge bg={info.badgeVariant} className="fs-6 mb-2 px-3 py-2">
                  {info.badgeText}
                </Badge>
                <div className="bg-dark bg-opacity-25 px-3 py-2 rounded">
                  <small className="text-light opacity-75">
                    {account.slice(0, 8)}...{account.slice(-6)}
                  </small>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-warning mb-2 small">
                  {networkError || 'Connect your wallet to access dashboard'}
                </p>
                <Button 
                  variant="outline-light" 
                  onClick={onConnectWallet}
                  size="sm"
                >
                  Connect Wallet
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default DashboardHeader;