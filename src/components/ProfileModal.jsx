'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useVotingContext } from '@/context/VotingContext';

const ProfileModal = ({ showModal, setShowModal }) => {
  const { account, getBalance, isConnected, networkError, connectWallet, provider } = useVotingContext();
  const [balance, setBalance] = useState('0 ETH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showModal) {
      fetchData();
    }
  }, [showModal, account, isConnected]);

  const fetchData = async () => {
    if (!isConnected || !account) {
      setError(networkError || 'Please connect your wallet to view profile details. Ensure MetaMask or a local node is connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the getBalance function from context
      const userBalance = await getBalance();
      const formattedBalance = Number(userBalance).toFixed(4) + ' ETH'; // More precise

      setBalance(formattedBalance);
    } catch (err) {
      setError(`Failed to load profile data: ${err.message}`);
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError(null);
      await connectWallet();
      // Refresh data after connecting
      await fetchData();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(`Failed to connect wallet: ${error.message}`);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setError(null);
  };

  if (!showModal) return null;

  return (
    <Modal
      show={showModal}
      onHide={handleClose}
      centered
      backdrop="static"
      size="lg"
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>User Profile</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading profile data...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
            {!isConnected && (
              <div className="mt-3">
                <Button variant="primary" onClick={handleConnectWallet}>
                  Connect Wallet
                </Button>
              </div>
            )}
          </Alert>
        ) : (
          <Container>
            <Row className="g-4">
              <Col xs={12}>
                <Card className="shadow-sm">
                  <Card.Body className="text-center">
                    <div className="mb-3">
                      <i className="bi bi-person-circle" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <Card.Title>Wallet Information</Card.Title>
                    
                    <div className="mb-3">
                      <strong>Account Address:</strong>
                      <div className="text-muted font-monospace small">
                        {account}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <strong>Balance:</strong>
                      <div className="text-success fs-5">
                        {balance}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <strong>Network Status:</strong>
                      <div className="text-success">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {provider && (
              <Row className="mt-3">
                <Col>
                  <Card className="bg-light">
                    <Card.Body className="p-3">
                      <small className="text-muted">
                        <strong>Provider:</strong> {provider.constructor.name}
                        <br />
                        <strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Container>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Close
        </Button>
        {isConnected && (
          <Button variant="outline-primary" onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileModal;