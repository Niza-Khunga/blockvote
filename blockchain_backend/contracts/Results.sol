// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVoting {
    enum Role { Voter, Auditor, Admin }
    enum Status { Created, Voting, Ended, Canceled, Finalized }
    
    function getRole(address _address) external view returns (Role);
    function isAuditor(address _address) external view returns (bool);
    function getElectionDetails(uint256 _electionId) external view returns (
        string memory title,
        string memory description,
        string[] memory candidates,
        uint256 startDate,
        uint256 endDate,
        Status status,
        bool isFinalized,
        uint256 totalVotes,
        bytes32 merkleRoot
    );
    function getCandidateVotes(uint256 _electionId, string memory _candidate) external view returns (uint256);
    function getApprovedVoters(uint256 _electionId) external view returns (address[] memory);
    function hasVoterVoted(uint256 _electionId, address _voter) external view returns (bool);
    function getVoterTurnout(uint256 _electionId) external view returns (uint256);
    function electionExists(uint256 _electionId) external view returns (bool);
}

contract Results {
    IVoting public votingContract;

    struct ElectionResult {
        uint256 electionId;
        string title;
        string[] candidates;
        uint256[] voteCounts;
        uint256 totalVotes;
        uint256 totalVoters;
        uint256 votedCount;
        uint256 turnoutPercentage;
        IVoting.Status status;
        bool isFinalized;
        uint256 endDate;
    }

    struct ElectionWinner {
        string winner;
        uint256 voteCount;
        bool isTie;
        string[] tiedCandidates;
    }

    event ResultsAccessed(uint256 indexed electionId, address indexed accessor);
    event RealTimeResultsAccessed(uint256 indexed electionId, address indexed accessor);

    constructor(address _votingContractAddress) {
        require(_votingContractAddress != address(0), "Invalid voting contract address");
        votingContract = IVoting(_votingContractAddress);
    }

    modifier onlyAdminOrAuditor() {
        _requireAdminOrAuditor();
        _;
    }

    /**
     * @notice Get finalized election results - publicly accessible for transparency
     * @param _electionId The ID of the election
     */
    function getElectionResults(uint256 _electionId) 
        external 
        view
        returns (
            string[] memory candidates, 
            uint256[] memory voteCounts,
            uint256 totalVotes,
            uint256 totalVoters,
            uint256 votedCount,
            uint256 turnoutPercentage
        ) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        
        // Get election status and finalized flag
        (, , , , , IVoting.Status status, bool isFinalized, , ) = votingContract.getElectionDetails(_electionId);
        
        require(isFinalized, "Results not finalized yet");
        require(status == IVoting.Status.Ended || status == IVoting.Status.Finalized, "Election must be ended or finalized");

        (candidates, voteCounts) = _getResults(_electionId);
        (totalVoters, votedCount, turnoutPercentage) = _getVoterStatistics(_electionId);
        totalVotes = votingContract.getVoterTurnout(_electionId);
    }

    /**
     * @notice Get real-time results (only for admin/auditor)
     * @param _electionId The ID of the election
     */
    function getRealTimeResults(uint256 _electionId) 
        external 
        onlyAdminOrAuditor
        returns (
            string[] memory candidates, 
            uint256[] memory voteCounts,
            uint256 totalVotes,
            uint256 totalVoters,
            uint256 votedCount,
            uint256 turnoutPercentage
        ) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        
        (candidates, voteCounts) = _getResults(_electionId);
        (totalVoters, votedCount, turnoutPercentage) = _getVoterStatistics(_electionId);
        totalVotes = votingContract.getVoterTurnout(_electionId);

        emit RealTimeResultsAccessed(_electionId, msg.sender);
    }

    /**
     * @notice Get the winner of a finalized election
     * @param _electionId The ID of the election
     * @return winner ElectionWinner struct containing winner information
     */
    function getElectionWinner(uint256 _electionId) 
        external 
        view 
        returns (ElectionWinner memory winner) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        
        (, , , , , , bool isFinalized, , ) = votingContract.getElectionDetails(_electionId);
        require(isFinalized, "Election not finalized");

        (string[] memory candidates, uint256[] memory voteCounts) = _getResults(_electionId);
        
        uint256 maxVotes = 0;
        uint256 winnerIndex = 0;
        bool hasTie = false;
        uint256 tieCount = 0;

        // Find the maximum vote count
        for (uint256 i = 0; i < voteCounts.length; i++) {
            if (voteCounts[i] > maxVotes) {
                maxVotes = voteCounts[i];
                winnerIndex = i;
                hasTie = false;
                tieCount = 1;
            } else if (voteCounts[i] == maxVotes && maxVotes > 0) {
                hasTie = true;
                tieCount++;
            }
        }

        // If no votes were cast
        if (maxVotes == 0) {
            return ElectionWinner({
                winner: "",
                voteCount: 0,
                isTie: false,
                tiedCandidates: new string[](0)
            });
        }

        // Handle tie scenario
        if (hasTie) {
            string[] memory tiedCandidates = new string[](tieCount);
            uint256 currentIndex = 0;
            
            for (uint256 i = 0; i < candidates.length; i++) {
                if (voteCounts[i] == maxVotes) {
                    tiedCandidates[currentIndex] = candidates[i];
                    currentIndex++;
                }
            }
            
            return ElectionWinner({
                winner: "",
                voteCount: maxVotes,
                isTie: true,
                tiedCandidates: tiedCandidates
            });
        }

        // Single winner scenario
        return ElectionWinner({
            winner: candidates[winnerIndex],
            voteCount: maxVotes,
            isTie: false,
            tiedCandidates: new string[](0)
        });
    }

    function getCompleteElectionResult(uint256 _electionId) 
        external 
        view
        onlyAdminOrAuditor
        returns (ElectionResult memory result)
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        
        (
            string memory title,
            ,
            string[] memory candidates,
            ,
            uint256 endDate,
            IVoting.Status status,
            bool isFinalized,
            uint256 totalVotes,
            
        ) = votingContract.getElectionDetails(_electionId);

        (uint256 totalVoters, uint256 votedCount, uint256 turnoutPercentage) = _getVoterStatistics(_electionId);
        (string[] memory resultCandidates, uint256[] memory voteCounts) = _getResults(_electionId);

        return ElectionResult({
            electionId: _electionId,
            title: title,
            candidates: resultCandidates,
            voteCounts: voteCounts,
            totalVotes: totalVotes,
            totalVoters: totalVoters,
            votedCount: votedCount,
            turnoutPercentage: turnoutPercentage,
            status: status,
            isFinalized: isFinalized,
            endDate: endDate
        });
    }

    function getVoterStatistics(uint256 _electionId) 
        external 
        view 
        onlyAdminOrAuditor
        returns (
            uint256 totalVoters, 
            uint256 voted, 
            uint256 turnoutPercentage
        ) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        return _getVoterStatistics(_electionId);
    }

    function getElectionStatus(uint256 _electionId) 
        external 
        view 
        returns (IVoting.Status) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        (, , , , , IVoting.Status status, , , ) = votingContract.getElectionDetails(_electionId);
        return status;
    }

    function isElectionFinalized(uint256 _electionId) 
        external 
        view 
        returns (bool) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        (, , , , , , bool isFinalized, , ) = votingContract.getElectionDetails(_electionId);
        return isFinalized;
    }

    function getTotalVotes(uint256 _electionId) 
        external 
        view 
        returns (uint256) 
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        (, , , , , , , uint256 totalVotes, ) = votingContract.getElectionDetails(_electionId);
        return totalVotes;
    }

    function getElectionSummary(uint256 _electionId) 
        external 
        view 
        returns (
            string memory title,
            IVoting.Status status,
            bool isFinalized,
            uint256 totalVotes,
            uint256 totalVoters,
            uint256 votedCount
        )
    {
        require(votingContract.electionExists(_electionId), "Election does not exist");
        
        (
            string memory electionTitle,
            ,
            ,
            ,
            ,
            IVoting.Status electionStatus,
            bool finalized,
            uint256 votesTotal,
            
        ) = votingContract.getElectionDetails(_electionId);

        (uint256 votersTotal, uint256 voted, ) = _getVoterStatistics(_electionId);

        return (
            electionTitle,
            electionStatus,
            finalized,
            votesTotal,
            votersTotal,
            voted
        );
    }

    function compareElections(uint256 _electionId1, uint256 _electionId2) 
        external 
        view 
        returns (
            string memory title1,
            string memory title2,
            uint256 totalVotes1,
            uint256 totalVotes2,
            uint256 turnoutPercentage1,
            uint256 turnoutPercentage2,
            IVoting.Status status1,
            IVoting.Status status2
        )
    {
        require(votingContract.electionExists(_electionId1), "First election does not exist");
        require(votingContract.electionExists(_electionId2), "Second election does not exist");

        (
            string memory titleA,
            ,
            ,
            ,
            ,
            IVoting.Status statusA,
            ,
            uint256 votesA,
            
        ) = votingContract.getElectionDetails(_electionId1);

        (
            string memory titleB,
            ,
            ,
            ,
            ,
            IVoting.Status statusB,
            ,
            uint256 votesB,
            
        ) = votingContract.getElectionDetails(_electionId2);

        (, , uint256 turnoutA) = _getVoterStatistics(_electionId1);
        (, , uint256 turnoutB) = _getVoterStatistics(_electionId2);

        return (titleA, titleB, votesA, votesB, turnoutA, turnoutB, statusA, statusB);
    }

    function _getResults(uint256 _electionId) internal view returns (string[] memory candidates, uint256[] memory voteCounts) {
        (, , string[] memory candidatesArray, , , , , , ) = votingContract.getElectionDetails(_electionId);
        
        uint256[] memory counts = new uint256[](candidatesArray.length);
        for (uint256 i = 0; i < candidatesArray.length; i++) {
            counts[i] = votingContract.getCandidateVotes(_electionId, candidatesArray[i]);
        }
        
        return (candidatesArray, counts);
    }

    function _getVoterStatistics(uint256 _electionId) internal view returns (uint256 totalVoters, uint256 voted, uint256 turnoutPercentage) {
        address[] memory approvedVoters = votingContract.getApprovedVoters(_electionId);
        uint256 votedCount = 0;
        
        for (uint256 i = 0; i < approvedVoters.length; i++) {
            if (votingContract.hasVoterVoted(_electionId, approvedVoters[i])) {
                votedCount++;
            }
        }
        
        uint256 total = approvedVoters.length;
        uint256 turnout = total > 0 ? (votedCount * 100) / total : 0;
        
        return (total, votedCount, turnout);
    }

    function _requireAdminOrAuditor() internal view {
        IVoting.Role role = votingContract.getRole(msg.sender);
        bool isAuditor = votingContract.isAuditor(msg.sender);
        
        require(
            role == IVoting.Role.Admin || isAuditor,
            "Requires admin or auditor role"
        );
    }

    function canAccessResults(uint256 _electionId, address _address) external view returns (bool) {
        if (!votingContract.electionExists(_electionId)) {
            return false;
        }

        IVoting.Role role = votingContract.getRole(_address);
        bool isAuditor = votingContract.isAuditor(_address);
        
        return (role == IVoting.Role.Admin || isAuditor);
    }

    function hasElectionEnded(uint256 _electionId) external view returns (bool) {
        if (!votingContract.electionExists(_electionId)) {
            return false;
        }

        (, , , , uint256 endDate, IVoting.Status status, , , ) = votingContract.getElectionDetails(_electionId);
        
        return (block.timestamp > endDate) || 
               (status == IVoting.Status.Ended) || 
               (status == IVoting.Status.Finalized);
    }
}