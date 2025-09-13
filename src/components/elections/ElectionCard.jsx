'use client';
import { useState, useEffect } from 'react';
import { Card, Badge, Button, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useVoteContext } from '@/context/VoteContext';
import { useVotingContext } from '@/context/VotingContext';
import { toast } from 'react-toastify';
import VoterRegistration from './VoterRegistration';

const ElectionCard = ({ election, votingInProgress, onVote, account, getElectionStatus, canVoteInElection }) => {
  const { checkVoterRegistration, checkHasVoted } = useVoteContext();
  const { votingContract } = useVotingContext();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [confirmingVote, setConfirmingVote] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!account || !votingContract) {
        setLoadingStatus(false);
        return;
      }

      try {
        const [registered, voted] = await Promise.all([
          checkVoterRegistration(election.id),
          checkHasVoted(election.id)
        ]);
        
        setIsRegistered(registered);
        setHasVoted(voted);
      } catch (error) {
        console.error('Error checking voting status:', error);
        // Fallback to direct contract calls if context functions fail
        try {
          const registered = await votingContract.isVoterRegistered(election.id, account);
          const voted = await votingContract.hasVoterVoted(election.id, account);
          setIsRegistered(registered);
          setHasVoted(voted);
        } catch (fallbackError) {
          console.error('Fallback check failed:', fallbackError);
        }
      } finally {
        setLoadingStatus(false);
      }
    };

    checkVotingStatus();
  }, [account, election.id, checkVoterRegistration, checkHasVoted, votingContract]);

  // Updated time-based status function
  const getStatusInfo = (election) => {
    // Use the passed function if available, otherwise fallback to local logic
    if (getElectionStatus) {
      return getElectionStatus(election);
    }
    
    // Fallback logic if no function is passed
    const now = new Date();
    
    // Definitive states from the contract take priority
    if (election.status === 3) return { text: 'Canceled', variant: 'danger' };
    if (election.isFinalized) return { text: 'Finalized', variant: 'dark' };

    // Time-based states for the election lifecycle
    if (now < election.startDate) return { text: 'Upcoming', variant: 'warning' };
    if (now >= election.startDate && now <= election.endDate) return { text: 'Active', variant: 'success' };
    if (now > election.endDate) return { text: 'Ended', variant: 'secondary' };

    return { text: 'Unknown', variant: 'light' };
  };

  const formatDate = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const diff = endDate - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleVoteClick = () => {
    if (!isRegistered) {
      setShowRegistrationModal(true);
      return;
    }
    setShowVoteModal(true);
  };

  const handleConfirmVote = async () => {
    if (selectedCandidate === null) return;

    setConfirmingVote(true);
    try {
      await onVote(election.id, election.candidates[selectedCandidate]);
      setHasVoted(true);
      toast.success('Vote cast successfully!');
      setShowVoteModal(false);
    } catch (error) {
      console.error('Voting error:', error);
      toast.error(error.message || 'Failed to cast vote');
    } finally {
      setConfirmingVote(false);
    }
  };

  const handleRegistrationComplete = () => {
    setIsRegistered(true);
    setShowVoteModal(true);
  };

  const statusInfo = getStatusInfo(election);
  const isActive = statusInfo.text === 'Active';
  const isUpcoming = statusInfo.text === 'Upcoming';
  const isEnded = statusInfo.text === 'Ended';
  const isCanceled = statusInfo.text === 'Canceled';
  const isFinalized = statusInfo.text === 'Finalized';
  const timeRemaining = isActive ? getTimeRemaining(election.endDate) : null;

  // Check if user can vote (using passed function or local logic)
  const canVote = canVoteInElection ? canVoteInElection(election) : (isActive && account && !hasVoted);

  if (loadingStatus) {
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Checking voting status...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-100 shadow-sm election-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>
          {timeRemaining && (
            <small className="text-muted">{timeRemaining}</small>
          )}
        </Card.Header>
        
        <Card.Body>
          <Card.Title className="h5">{election.title}</Card.Title>
          {election.description && (
            <Card.Text className="text-muted small">
              {election.description.length > 100 
                ? `${election.description.substring(0, 100)}...`
                : election.description
              }
            </Card.Text>
          )}
          
          <div className="mb-3">
            <small className="text-muted d-block">
              <strong>Period:</strong> {formatDate(election.startDate)} - {formatDate(election.endDate)}
            </small>
            <small className="text-muted d-block">
              <strong>Total Votes:</strong> {election.totalVotes}
            </small>
            {hasVoted && (
              <Badge bg="success" className="mt-1">
                <i className="bi bi-check-circle-fill me-1"></i>Voted
              </Badge>
            )}
            {isRegistered && !hasVoted && (
              <Badge bg="warning" className="mt-1">
                Registered
              </Badge>
            )}
          </div>

          <h6 className="mb-2">Candidates:</h6>
          <div className="candidates-list mb-3">
            {election.candidates.map((candidate, index) => (
              <Badge 
                key={index} 
                bg="light" 
                text="dark" 
                className="me-1 mb-1"
              >
                {candidate}
              </Badge>
            ))}
          </div>

          {canVote && (
            <div className="vote-section">
              <Button
                variant="primary"
                className="w-100"
                onClick={handleVoteClick}
                disabled={votingInProgress === election.id}
              >
                {votingInProgress === election.id ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Voting...
                  </>
                ) : isRegistered ? (
                  'Cast Your Vote'
                ) : (
                  'Register to Vote'
                )}
              </Button>
            </div>
          )}

          {isActive && hasVoted && (
            <Alert variant="success" className="small mb-0">
              <i className="bi bi-check-circle-fill me-1"></i>
              Thank you for voting! Your vote has been recorded on the blockchain.
            </Alert>
          )}

          {isUpcoming && (
            <Alert variant="warning" className="small mb-0">
              <i className="bi bi-clock-fill me-1"></i>
              Voting starts {formatDate(election.startDate)}
            </Alert>
          )}

          {isEnded && !isFinalized && (
            <Alert variant="info" className="small mb-0">
              <i className="bi bi-calendar-check-fill me-1"></i>
              This election has ended
            </Alert>
          )}

          {isFinalized && (
            <Alert variant="dark" className="small mb-0">
              <i className="bi bi-award-fill me-1"></i>
              Election finalized - Results are official
            </Alert>
          )}

          {isCanceled && (
            <Alert variant="danger" className="small mb-0">
              <i className="bi bi-x-circle-fill me-1"></i>
              This election has been canceled
            </Alert>
          )}

          {!account && (
            <Alert variant="warning" className="small mb-0">
              <i className="bi bi-wallet2 me-1"></i>
              Connect your wallet to participate in voting
            </Alert>
          )}
        </Card.Body>
        
        <Card.Footer className="text-muted small">
          Election ID: #{election.id}
          {election.isFinalized && (
            <Badge bg="info" className="ms-2">Finalized</Badge>
          )}
        </Card.Footer>
      </Card>

      {/* Vote Confirmation Modal */}
      <Modal show={showVoteModal} onHide={() => setShowVoteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Your Vote</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to vote in: <strong>{election.title}</strong></p>
          
          <Form.Group className="mb-3">
            <Form.Label>Select Candidate:</Form.Label>
            <Form.Select 
              value={selectedCandidate ?? ''} 
              onChange={(e) => setSelectedCandidate(parseInt(e.target.value))}
            >
              <option value="">Choose a candidate</option>
              {election.candidates.map((candidate, index) => (
                <option key={index} value={index}>
                  {candidate}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedCandidate !== null && (
            <Alert variant="info" className="small">
              <strong>Important:</strong> Voting is final and cannot be changed. 
              Your vote will be permanently recorded on the blockchain.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowVoteModal(false)}
            disabled={confirmingVote}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmVote}
            disabled={selectedCandidate === null || confirmingVote}
          >
            {confirmingVote ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Confirming...
              </>
            ) : (
              'Confirm Vote'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Voter Registration Modal */}
      <VoterRegistration
        election={election}
        show={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onRegistrationComplete={handleRegistrationComplete}
      />
    </>
  );
};

export default ElectionCard;