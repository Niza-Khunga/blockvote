'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useVoteContext } from '@/context/VoteContext';
import { useVotingContext } from '@/context/VotingContext';
import { toast } from 'react-toastify';

const VoterRegistration = ({ election, show, onClose, onRegistrationComplete }) => {
  const { registerVoter, checkVoterRegistration } = useVoteContext();
  const { account, votingContract } = useVotingContext();
  const [loading, setLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('pending');
  const [isChecking, setIsChecking] = useState(true);
  const [transactionHash, setTransactionHash] = useState('');

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!account || !votingContract) {
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);
        const alreadyRegistered = await checkVoterRegistration(election.id);
        
        if (alreadyRegistered) {
          setRegistrationStatus('registered');
        } else {
          setRegistrationStatus('pending');
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        // Fallback to direct contract call
        try {
          const alreadyRegistered = await votingContract.isVoterRegistered(election.id, account);
          if (alreadyRegistered) {
            setRegistrationStatus('registered');
          } else {
            setRegistrationStatus('pending');
          }
        } catch (fallbackError) {
          console.error('Fallback registration check failed:', fallbackError);
          setRegistrationStatus('pending');
        }
      } finally {
        setIsChecking(false);
      }
    };

    if (show) {
      checkRegistrationStatus();
      setTransactionHash(''); // Reset transaction hash when modal opens
    }
  }, [show, account, election.id, checkVoterRegistration, votingContract]);

  const handleRegister = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // First check if already registered
      const alreadyRegistered = await checkVoterRegistration(election.id);
      if (alreadyRegistered) {
        toast.success('You are already registered for this election!');
        setRegistrationStatus('registered');
        onRegistrationComplete('registered');
        return;
      }

      // The registerVoter function from the context already waits and returns the receipt.
      const receipt = await registerVoter(election.id, []);
      
      // Store transaction hash for display
      setTransactionHash(receipt.hash);
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      if (receipt.status === 1) {
        setRegistrationStatus('registered');
        toast.success('Registration successful! You can now vote.');
        onRegistrationComplete('registered');
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error) {
      console.error('Error registering:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Invalid proof') || 
          error.message?.includes('Merkle') ||
          error.message?.includes('proof')) {
        toast.error('Registration requires admin approval');
        setRegistrationStatus('requires_approval');
      } else if (error.message?.includes('already registered')) {
        toast.success('You are already registered for this election!');
        setRegistrationStatus('registered');
        onRegistrationComplete('registered');
      } else if (error.message?.includes('ended') || 
                error.message?.includes('not active') ||
                error.message?.includes('Election has ended')) {
        toast.error('This election has already ended');
        setRegistrationStatus('ended');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction was cancelled');
        setRegistrationStatus('pending');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction gas');
        setRegistrationStatus('pending');
      } else {
        toast.error(error.message || 'Failed to register. Please try again.');
        setRegistrationStatus('error');
      }
    } finally {
      setLoading(false);
      setTransactionHash(''); // Clear transaction hash after completion
    }
  };

  const handleClose = () => {
    setRegistrationStatus('pending');
    setLoading(false);
    setTransactionHash('');
    onClose();
  };

  const getStatusMessage = () => {
    switch (registrationStatus) {
      case 'requested':
        return (
          <Alert variant="info" className="small">
            <Badge bg="info" className="me-2">⏳</Badge>
            <strong>Registration Requested</strong>
            <br />
            Your registration has been submitted and is waiting for admin approval.
            You will be able to vote once approved.
          </Alert>
        );
      case 'requires_approval':
        return (
          <Alert variant="warning" className="small">
            <Badge bg="warning" className="me-2">⚠️</Badge>
            <strong>Admin Approval Required</strong>
            <br />
            This election requires manual approval from the administrator.
            Please wait for your registration to be approved or contact the election administrator.
          </Alert>
        );
      case 'registered':
        return (
          <Alert variant="success" className="small">
            <Badge bg="success" className="me-2">✅</Badge>
            <strong>Registration Successful</strong>
            <br />
            You are now registered for this election and can cast your vote.
          </Alert>
        );
      case 'ended':
        return (
          <Alert variant="danger" className="small">
            <Badge bg="danger" className="me-2">❌</Badge>
            <strong>Election Ended</strong>
            <br />
            This election has already ended. Registration is no longer possible.
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="danger" className="small">
            <Badge bg="danger" className="me-2">❌</Badge>
            <strong>Registration Failed</strong>
            <br />
            There was an error processing your registration. Please try again or contact support.
          </Alert>
        );
      default:
        return (
          <Alert variant="info" className="small">
            <Badge bg="info" className="me-2">ℹ️</Badge>
            <strong>Registration Required</strong>
            <br />
            You need to register before you can vote in this election. Click "Register to Vote" to proceed.
          </Alert>
        );
    }
  };

  const getActionButton = () => {
    if (isChecking) {
      return (
        <Button variant="primary" disabled>
          <Spinner animation="border" size="sm" className="me-2" />
          Checking Status...
        </Button>
      );
    }

    switch (registrationStatus) {
      case 'pending':
        return (
          <Button 
            variant="primary" 
            onClick={handleRegister} 
            disabled={loading || !account}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {transactionHash ? 'Confirming...' : 'Registering...'}
              </>
            ) : (
              'Register to Vote'
            )}
          </Button>
        );
      
      case 'requires_approval':
        return (
          <Button variant="outline-primary" onClick={handleClose}>
            Understand
          </Button>
        );
      
      case 'registered':
        return (
          <Button variant="success" onClick={handleClose}>
            Continue to Vote
          </Button>
        );
      
      case 'ended':
      case 'error':
        return (
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        );
      
      default:
        return (
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        );
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Voter Registration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          Register to vote in: <strong>{election.title}</strong>
        </p>

        {getStatusMessage()}

        {transactionHash && (
          <Alert variant="info" className="small">
            <Badge bg="info" className="me-2">📝</Badge>
            <strong>Transaction Submitted</strong>
            <br />
            <small>Hash: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</small>
          </Alert>
        )}

        <div className="small text-muted mt-3">
          <strong>Wallet Address:</strong>
          <br />
          <code>{account ? `${account.slice(0, 8)}...${account.slice(-6)}` : 'Not connected'}</code>
        </div>

        <div className="small text-muted mt-2">
          <strong>Election ID:</strong> #{election.id}
        </div>

        {loading && !transactionHash && (
          <div className="text-center mt-3">
            <Spinner animation="border" variant="primary" className="mb-2" />
            <p>Processing registration on blockchain...</p>
          </div>
        )}

        {isChecking && (
          <div className="text-center mt-3">
            <Spinner animation="border" variant="info" size="sm" className="me-2" />
            <small>Checking registration status...</small>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Close
        </Button>
        {getActionButton()}
      </Modal.Footer>
    </Modal>
  );
};

export default VoterRegistration;