'use client';
import { useState } from 'react';
import { Navbar, Nav, Container, Button, Alert } from 'react-bootstrap';
import Link from 'next/link';
import ProfileModal from './ProfileModal';
import { useVotingContext } from '@/context/VotingContext';

const NavBar = () => {
  const { account, connectWallet } = useVotingContext();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const handleConnectWallet = async () => {
    try {
      setConnectionError(null);
      await connectWallet();
    } catch (err) {
      setConnectionError('Failed to connect wallet. Please ensure MetaMask is installed and try again.');
      console.error('Wallet connection error:', err);
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} href="/">
            BlockVote
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto">
              <Nav.Link as={Link} href="/">
                Home
              </Nav.Link>
              <Nav.Link as={Link} href="/how-it-works">
                How It Works
              </Nav.Link>
              <Nav.Link as={Link} href="/faq">
                FAQ
              </Nav.Link>
              <Nav.Link as={Link} href="/elections">
                Elections
              </Nav.Link>
              <Nav.Link as={Link} href="/verify-vote">
                Verify Vote
              </Nav.Link>
              <Nav.Link as={Link} href="/results">
                Results
              </Nav.Link>
              <Nav.Link as={Link} href="/dashboard">
                Dashboard
              </Nav.Link>
            </Nav>
            <Nav>
              {account ? (
                <Button
                  variant="light"
                  className="ms-2 profile-button"
                  onClick={() => setShowProfileModal(true)}
                >
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Button>
              ) : (
                <Button
                  variant="outline-light"
                  className="ms-2 btn-animated"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {connectionError && (
        <Alert variant="danger" dismissible onClose={() => setConnectionError(null)} className="mt-3">
          {connectionError}
        </Alert>
      )}
      <ProfileModal
        showModal={showProfileModal}
        setShowModal={setShowProfileModal}
      />
    </>
  );
};

export default NavBar;