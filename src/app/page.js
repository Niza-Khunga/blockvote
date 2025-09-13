'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useVotingContext } from '@/context/VotingContext';
import { toast } from 'react-toastify';

export default function Home() {
  const { 
    votingContract, 
    account, 
    connectWallet, 
    isConnecting, 
    connectionError,
    isConnected 
  } = useVotingContext();
  
  const [electionCount, setElectionCount] = useState(0);
  const [activeElections, setActiveElections] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (votingContract && isConnected) {
        try {
          setLoading(true);
          const count = await votingContract.getElectionCount();
          const electionCountNum = Number(count);
          setElectionCount(electionCountNum);

          // Count active elections
          let activeCount = 0;
          for (let i = 1; i <= electionCountNum; i++) {
            try {
              const details = await votingContract.getElectionDetails(i);
              const election = {
                status: Number(details.status),
                startDate: new Date(Number(details.startDate) * 1000),
                endDate: new Date(Number(details.endDate) * 1000),
              };
              
              const now = new Date();
              if (election.status !== 3 && // Not canceled
                  now >= election.startDate && 
                  now <= election.endDate) {
                activeCount++;
              }
            } catch (err) {
              console.warn(`Error fetching election ${i}:`, err);
            }
          }
          setActiveElections(activeCount);
          setLoading(false);
        } catch (err) {
          setError('Failed to load election data. Please try again.');
          setLoading(false);
          console.error('Error fetching election data:', err);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchElectionData();
  }, [votingContract, isConnected]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      
      // Don't show toast for "already processing" errors to avoid spam
      if (!err.message.includes('already processing') && 
          !err.message.includes('Connection already in progress') &&
          !err.message.includes('MetaMask is busy')) {
        toast.error(`Failed to connect wallet: ${err.message}`);
      }
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-light text-center py-5">
        <Container>
          <div className="mb-4">
            <Badge bg="light" text="dark" className="fs-6 px-3 py-2 mb-3">
              🚀 Powered by Blockchain
            </Badge>
          </div>
          <h1 className="display-4 fw-bold mb-3">BlockVote</h1>
          <p className="lead mb-4 fs-5">
            Secure, transparent, and decentralized voting powered by blockchain technology.
            Experience the future of democratic participation.
          </p>
          
          <div className="mb-4">
            {account && (
              <Badge bg="success" className="fs-6 px-3 py-2">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
            )}
          </div>

          {/* Connection Error Alert */}
          {connectionError && (
            <Alert variant="warning" className="mb-3 mx-auto" style={{ maxWidth: '500px' }}>
              <small>{connectionError}</small>
            </Alert>
          )}

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            {!account ? (
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="btn-animated px-4"
              >
                {isConnecting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="lg" 
                as={Link} 
                href="/elections"
                className="btn-animated px-4"
              >
                View Elections
              </Button>
            )}
            <Button 
              variant="outline-light" 
              size="lg" 
              as={Link} 
              href="/how-it-works"
              className="btn-animated px-4"
            >
              How It Works
            </Button>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5 display-5 fw-bold">Why Choose BlockVote?</h2>
          <Row>
            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon mb-3 fs-1">🔒</div>
                  <Card.Title className="h5 fw-bold">Military-Grade Security</Card.Title>
                  <Card.Text className="text-muted">
                    Votes are cryptographically secured on an immutable blockchain, ensuring 
                    no tampering, fraud, or manipulation of results.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon mb-3 fs-1">👁️</div>
                  <Card.Title className="h5 fw-bold">Complete Transparency</Card.Title>
                  <Card.Text className="text-muted">
                    Every vote is publicly verifiable on the blockchain, fostering 
                    unprecedented trust and accountability in the electoral process.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon mb-3 fs-1">⚡</div>
                  <Card.Title className="h5 fw-bold">Instant Results</Card.Title>
                  <Card.Text className="text-muted">
                    Real-time vote counting and immediate result availability once 
                    elections conclude, eliminating waiting periods.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon mb-3 fs-1">🌐</div>
                  <Card.Title className="h5 fw-bold">Global Accessibility</Card.Title>
                  <Card.Text className="text-muted">
                    Vote securely from any device, anywhere in the world, with our 
                    responsive and user-friendly platform.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 bg-gradient-primary text-light">
        <Container className="text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Make Your Voice Heard?</h2>
          <p className="lead mb-4 fs-5">
            Join thousands of users who trust BlockVote for secure, transparent, 
            and accessible democratic participation.
          </p>
        </Container>
      </section>
    </div>
  );
}