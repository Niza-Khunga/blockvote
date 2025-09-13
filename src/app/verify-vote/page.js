'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useVotingContext } from '@/context/VotingContext';
import { toast } from 'react-toastify';
import VerificationForm from '@/components/verify-vote/VerificationForm';
import VerificationResult from '@/components/verify-vote/VerificationResult';
import MyVotesList from '@/components/verify-vote/MyVotesList';

export default function VerifyVote() {
  const { votingContract, isConnected, account } = useVotingContext();
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [myVotes, setMyVotes] = useState([]);
  const [loadingVote, setLoadingVote] = useState(null); // To show loading on a specific button

  // Load saved votes from local storage when the account is connected
  useEffect(() => {
    if (isConnected && account) {
      try {
        const savedVotes = JSON.parse(localStorage.getItem(`votes_${account}`)) || [];
        setMyVotes(savedVotes);
      } catch (e) {
        console.error('Could not retrieve votes from local storage:', e);
        setMyVotes([]);
      }
    } else {
      setMyVotes([]);
    }
  }, [isConnected, account]);

  const handleVerifyVote = async (formData) => {
    if (!isConnected || !votingContract) {
      toast.error('Please connect your wallet first.');
      return;
    }
    
    // Set loading state for either the form or a specific list item
    if (formData.transactionHash) {
      setLoadingVote(formData.transactionHash);
    } else {
      setLoading(true);
    }
    setVerificationResult(null);

    try {
      const { 
        electionId, 
        voterAddress, 
        candidateName, // Note: The object from localStorage has 'candidateName'
        candidate,     // Note: The object from the form has 'candidate'
        encryptedVote, 
        nonce, 
        previousBlockHash 
      } = formData;
      
      const isValid = await votingContract.verifyVote(
        electionId,
        voterAddress,
        candidateName || candidate, // Use whichever property is available
        encryptedVote,
        nonce,
        previousBlockHash
      );

      if (isValid) {
        setVerificationResult({
          status: 'success',
          message: `Vote for "${candidateName || candidate}" in Election #${electionId} is valid and correctly recorded on the blockchain.`,
        });
      } else {
        setVerificationResult({
          status: 'error',
          message: 'Vote verification failed. The provided details do not match the vote hash on the blockchain.',
        });
      }
    } catch (error) {
      console.error('Error verifying vote:', error);
      let errorMessage = 'An error occurred during verification.';
      if (error.reason) {
        errorMessage = `Verification failed: ${error.reason}`;
      }
      setVerificationResult({
        status: 'error',
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingVote(null);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold text-primary">Verify Your Vote</h1>
            <p className="lead">
              Verify the integrity of a past vote automatically or enter the details manually to confirm it was recorded correctly.
            </p>
          </div>

          {!isConnected && (
            <Alert variant="warning">
              Please connect your wallet to view your saved votes and use the verification tool.
            </Alert>
          )}

          {isConnected && (
            <MyVotesList votes={myVotes} onVerify={handleVerifyVote} loadingVote={loadingVote} />
          )}

          <VerificationResult result={verificationResult} />
          
          <hr className="my-5" />
          
          <h3 className="text-center mb-4">Manual Verification</h3>
          <VerificationForm onVerify={handleVerifyVote} loading={loading} />
        </Col>
      </Row>
    </Container>
  );
}