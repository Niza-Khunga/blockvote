// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./AccessControl.sol";

/**
 * @title BlockVote Voting Contract
 * @author Niza Khunga (2021503321), Faith Mayani (2021538354), Enala Saishi (2021463711)
 * @notice Manages the creation, execution, and finalization of blockchain-based elections.
 * @dev This contract uses a hybrid model for election lifecycle management.
 * - Elections start and end automatically based on their timestamps.
 * - Admins can edit an election's details *before* it starts.
 * - Admins retain an emergency `cancelElection` function for upcoming elections.
 * - Admins must manually call `finalizeElection` after the end date to publish results.
 */
contract Voting is AccessControl {
    // NOTE: The 'Voting' and 'Ended' statuses are now primarily determined by block.timestamp.
    // The enum is retained for clarity and to manage Canceled/Finalized states.
    enum Status { Created, Voting, Ended, Canceled, Finalized }

    struct Election {
        uint256 id;
        string title;
        string description;
        string[] candidates;
        uint256 startDate;
        uint256 endDate;
        bytes32 merkleRoot;
        Status status;
        bool isFinalized;
        address[] approvedVoters;
        address[] registrationRequests;
        mapping(string => bool) validCandidates;
        mapping(address => uint256) voterIndex;
    }

    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(address => bool)) public registeredVoters;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(string => uint256)) public votes;
    mapping(uint256 => mapping(address => bytes32)) public voteHashes;
    mapping(uint256 => mapping(address => bool)) public hasRequestedRegistration;
    mapping(uint256 => mapping(address => uint256)) public registrationRequestIndex;
    mapping(address => string) public voterIdentities;
    
    uint256 public electionCount;
    bytes32 public encryptionKey;

    // --- Events ---
    event ElectionCreated(uint256 indexed electionId, string title, uint256 startDate, uint256 endDate);
    event ElectionUpdated(uint256 indexed electionId, string title, uint256 startDate, uint256 endDate);
    event VoterRegistered(uint256 indexed electionId, address voter);
    event VoterEligibilitySet(uint256 indexed electionId, address indexed voter, bool isEligible);
    event VoteCast(uint256 indexed electionId, address voter, string candidate, bytes32 voteHash);
    event ElectionStatusChanged(uint256 indexed electionId, Status status);
    event ElectionFinalized(uint256 indexed electionId, string[] candidates, uint256[] voteCounts);
    event EncryptionKeyUpdated(bytes32 newKey);
    event RegistrationRequested(uint256 indexed electionId, address indexed voter);
    event MerkleRootUpdated(uint256 indexed electionId, bytes32 merkleRoot);

    /**
     * @notice Creates a new election with specified details.
     * @param _startDate The UNIX timestamp when the election starts. Must be in the future.
     */
    function createElection(
        string memory _title,
        string memory _description,
        string[] memory _candidates,
        uint256 _startDate,
        uint256 _endDate,
        bytes32 _merkleRoot
    ) external onlyRole(Role.Admin) {
        require(_startDate < _endDate, "Invalid dates");
        require(block.timestamp < _startDate, "Start date must be in the future");
        require(_candidates.length >= 2, "Need at least 2 candidates");

        electionCount++;
        uint256 electionId = electionCount;

        Election storage newElection = elections[electionId];
        newElection.id = electionId;
        newElection.title = _title;
        newElection.description = _description;
        newElection.candidates = _candidates;
        newElection.startDate = _startDate;
        newElection.endDate = _endDate;
        newElection.merkleRoot = _merkleRoot;
        newElection.status = Status.Created;
        newElection.isFinalized = false;

        for (uint256 i = 0; i < _candidates.length; i++) {
            require(bytes(_candidates[i]).length > 0, "Candidate name cannot be empty");
            newElection.validCandidates[_candidates[i]] = true;
        }

        emit ElectionCreated(electionId, _title, _startDate, _endDate);
        if (_merkleRoot != bytes32(0)) {
            emit MerkleRootUpdated(electionId, _merkleRoot);
        }
    }

    /**
     * @notice Allows an admin to update the details of an election before it has started.
     */
    function updateElection(
        uint256 _electionId,
        string memory _title,
        string memory _description,
        string[] memory _candidates,
        uint256 _startDate,
        uint256 _endDate
    ) external onlyRole(Role.Admin) {
        Election storage election = elections[_electionId];

        require(election.id != 0, "Election does not exist");
        require(block.timestamp < election.startDate, "Cannot edit an election that has already started");
        
        require(_startDate < _endDate, "Invalid dates");
        require(block.timestamp < _startDate, "New start date must be in the future");
        require(_candidates.length >= 2, "Need at least 2 candidates");

        election.title = _title;
        election.description = _description;
        election.startDate = _startDate;
        election.endDate = _endDate;

        // Safely update candidates: clear old mapping, then set the new one.
        for (uint256 i = 0; i < election.candidates.length; i++) {
            election.validCandidates[election.candidates[i]] = false;
        }
        
        election.candidates = _candidates;

        for (uint256 i = 0; i < _candidates.length; i++) {
            require(bytes(_candidates[i]).length > 0, "Candidate name cannot be empty");
            election.validCandidates[_candidates[i]] = true;
        }

        emit ElectionUpdated(_electionId, _title, _startDate, _endDate);
    }

    /**
     * @notice Allows an admin to cancel an election at any time (even after it has started).
     * @dev This is an emergency function that can be used to cancel elections that have issues.
     */
    function cancelElection(uint256 _electionId) external onlyRole(Role.Admin) {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        require(election.status != Status.Finalized, "Cannot cancel a finalized election");
        require(election.status != Status.Canceled, "Election is already canceled");
        
        election.status = Status.Canceled;
        emit ElectionStatusChanged(_electionId, Status.Canceled);
    }

    /**
     * @notice Casts a vote in an election. The ability to vote is determined by timestamps.
     */
    function castVote(uint256 _electionId, string memory _candidate, bytes32 _encryptedVote, uint256 _nonce) external {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        require(election.status != Status.Canceled, "Election is canceled");
        require(block.timestamp >= election.startDate && block.timestamp <= election.endDate, "Not in voting period");
        require(registeredVoters[_electionId][msg.sender], "Voter not registered");
        require(!hasVoted[_electionId][msg.sender], "Already voted");
        require(election.validCandidates[_candidate], "Invalid candidate");

        votes[_electionId][_candidate]++;
        hasVoted[_electionId][msg.sender] = true;
        
        bytes32 voteHash = keccak256(abi.encodePacked(
            _electionId, msg.sender, _candidate, _encryptedVote,
            _nonce, blockhash(block.number - 1)
        ));
        
        voteHashes[_electionId][msg.sender] = voteHash;
        emit VoteCast(_electionId, msg.sender, _candidate, voteHash);
    }

    /**
     * @notice Finalizes an election after its end date has passed, publishing the results.
     */
    function finalizeElection(uint256 _electionId) external onlyRole(Role.Admin) {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        require(block.timestamp > election.endDate, "Election has not ended yet");
        require(!election.isFinalized, "Election already finalized");
        require(election.status != Status.Canceled, "Cannot finalize a canceled election");

        if (election.status != Status.Ended) {
            election.status = Status.Ended;
            emit ElectionStatusChanged(_electionId, Status.Ended);
        }

        election.status = Status.Finalized;
        election.isFinalized = true;

        string[] memory candidates = election.candidates;
        uint256[] memory voteCounts = new uint256[](candidates.length);
        
        for (uint256 i = 0; i < candidates.length; i++) {
            voteCounts[i] = votes[_electionId][candidates[i]];
        }

        emit ElectionFinalized(_electionId, candidates, voteCounts);
        emit ElectionStatusChanged(_electionId, Status.Finalized);
    }

    /**
     * @notice Allows a user to self-register for an election.
     */
    function registerVoter(uint256 _electionId, bytes32[] calldata _merkleProof) external {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        require(election.status != Status.Canceled, "Election is canceled");
        require(block.timestamp < election.endDate, "Registration period has ended");
        require(!registeredVoters[_electionId][msg.sender], "Already registered");

        if (election.merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(_merkleProof, election.merkleRoot, leaf), "Invalid Merkle proof");
        }
        
        if (!hasRequestedRegistration[_electionId][msg.sender]) {
            election.registrationRequests.push(msg.sender);
            registrationRequestIndex[_electionId][msg.sender] = election.registrationRequests.length;
            hasRequestedRegistration[_electionId][msg.sender] = true;
            emit RegistrationRequested(_electionId, msg.sender);
        }

        registeredVoters[_electionId][msg.sender] = true;
        if (election.voterIndex[msg.sender] == 0) {
            election.approvedVoters.push(msg.sender);
            election.voterIndex[msg.sender] = election.approvedVoters.length;
        }
        emit VoterRegistered(_electionId, msg.sender);
    }
    
    function adminRegisterVoter(uint256 _electionId, address _voter) external onlyRole(Role.Admin) {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        require(!registeredVoters[_electionId][_voter], "Already registered");

        registeredVoters[_electionId][_voter] = true;
        
        if (election.voterIndex[_voter] == 0) {
            election.approvedVoters.push(_voter);
            election.voterIndex[_voter] = election.approvedVoters.length;
        }
        
        emit VoterRegistered(_electionId, _voter);
        emit VoterEligibilitySet(_electionId, _voter, true);
    }

    function setVoterIdentity(string memory _identity) external {
        require(bytes(_identity).length > 0, "Identity cannot be empty");
        voterIdentities[msg.sender] = _identity;
    }

    function setVoterEligibility(uint256 _electionId, address _voter, bool _isEligible) external onlyRole(Role.Admin) {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        
        registeredVoters[_electionId][_voter] = _isEligible;
        
        if (_isEligible) {
            if (election.voterIndex[_voter] == 0) {
                election.approvedVoters.push(_voter);
                election.voterIndex[_voter] = election.approvedVoters.length;
            }
        } else {
            uint256 index = election.voterIndex[_voter];
            if (index > 0) {
                uint256 lastIndex = election.approvedVoters.length - 1;
                address lastVoter = election.approvedVoters[lastIndex];
                
                election.approvedVoters[index - 1] = lastVoter;
                election.voterIndex[lastVoter] = index;
                
                election.approvedVoters.pop();
                delete election.voterIndex[_voter];
            }
        }
        
        emit VoterEligibilitySet(_electionId, _voter, _isEligible);
    }

    function updateMerkleRoot(uint256 _electionId, bytes32 _merkleRoot) external onlyRole(Role.Admin) {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        election.merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_electionId, _merkleRoot);
    }
    
    function updateEncryptionKey(bytes32 _newKey) external onlyRole(Role.Admin) {
        encryptionKey = _newKey;
        emit EncryptionKeyUpdated(_newKey);
    }

    function verifyVote(
        uint256 _electionId, address _voter, string memory _candidate, 
        bytes32 _encryptedVote, uint256 _nonce, bytes32 _previousBlockHash
    ) external view returns (bool) {
        bytes32 expectedHash = keccak256(abi.encodePacked(
            _electionId, _voter, _candidate, _encryptedVote,
            _nonce, _previousBlockHash
        ));
        return voteHashes[_electionId][_voter] == expectedHash;
    }

    function getElectionDetails(uint256 _electionId)
        external view returns (
            string memory title, string memory description, string[] memory candidates,
            uint256 startDate, uint256 endDate, Status status, bool isFinalized,
            uint256 totalVotes, bytes32 merkleRoot
        )
    {
        Election storage election = elections[_electionId];
        require(election.id != 0, "Election does not exist");
        
        uint256 votesTotal = 0;
        for (uint256 i = 0; i < election.candidates.length; i++) {
            votesTotal += votes[_electionId][election.candidates[i]];
        }
        
        return (
            election.title, election.description, election.candidates,
            election.startDate, election.endDate, election.status,
            election.isFinalized, votesTotal, election.merkleRoot
        );
    }

    function getApprovedVoters(uint256 _electionId) external view returns (address[] memory) {
        return elections[_electionId].approvedVoters;
    }

    function getRegistrationRequests(uint256 _electionId) external view returns (address[] memory) {
        return elections[_electionId].registrationRequests;
    }

    function getCandidateVotes(uint256 _electionId, string memory _candidate) external view returns (uint256) {
        return votes[_electionId][_candidate];
    }
    
    function getVoterTurnout(uint256 _electionId) external view returns (uint256) {
        uint256 turnout = 0;
        string[] memory candidates = elections[_electionId].candidates;
        for (uint256 i = 0; i < candidates.length; i++) {
            turnout += votes[_electionId][candidates[i]];
        }
        return turnout;
    }

    function getElectionCount() external view returns (uint256) {
        return electionCount;
    }

    function electionExists(uint256 _electionId) external view returns (bool) {
        return elections[_electionId].id != 0;
    }

    function hasVoterVoted(uint256 _electionId, address _voter) external view returns (bool) {
        return hasVoted[_electionId][_voter];
    }

    function isVoterRegistered(uint256 _electionId, address _voter) external view returns (bool) {
        return registeredVoters[_electionId][_voter];
    }

    function isValidCandidate(uint256 _electionId, string memory _candidate) external view returns (bool) {
        return elections[_electionId].validCandidates[_candidate];
    }
}