'use client';
import { useState, useEffect } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useVotingContext } from '@/context/VotingContext';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AdminView from '@/components/dashboard/AdminView';
import AuditorView from '@/components/dashboard/AuditorView';
import VoterView from '@/components/dashboard/VoterView';

export default function Dashboard() {
  const {
    account,
    connectWallet,
    networkError,
    isConnected,
    isAdmin,
    isAuditor,
    votingContract,
  } = useVotingContext();
  
  const [userRole, setUserRole] = useState('voter');
  const [loading, setLoading] = useState(true);
  const [voterStats, setVoterStats] = useState({ participated: 0, registered: 0, active: 0 });
  const [adminStats, setAdminStats] = useState({ 
    active: 0, 
    ended: 0, 
    upcoming: 0, 
    totalVoters: 0,
    total: 0 
  });

  useEffect(() => {
    const determineUserRole = async () => {
      setLoading(true);
      if (isConnected && account) {
        if (isAdmin) {
          setUserRole('admin');
        } else {
          const isAuditorResult = await isAuditor();
          if (isAuditorResult) {
            setUserRole('auditor');
          } else {
            setUserRole('voter');
          }
        }
      }
      setLoading(false);
    };
    determineUserRole();
  }, [isConnected, account, isAdmin, isAuditor]);
  
  useEffect(() => {
    const fetchVoterStats = async () => {
      if (isConnected && account && votingContract && userRole === 'voter') {
        try {
          // Your existing voter stats logic
          const participated = 0; // Replace with actual logic
          const registered = 0;   // Replace with actual logic
          const active = 0;       // Replace with actual logic
          setVoterStats({ participated, registered, active });
        } catch (error) {
          console.error("Failed to fetch voter stats:", error);
        }
      }
    };

    const fetchAdminStats = async () => {
      if (isConnected && votingContract && (userRole === 'admin' || userRole === 'auditor')) {
        try {
          const count = await votingContract.getElectionCount();
          const total = Number(count);
          
          let activeCount = 0;
          let endedCount = 0;
          let upcomingCount = 0;
          
          // Get total voters count (you might need to implement this in your contract)
          let totalVoters = 0;

          for (let i = 1; i <= total; i++) {
            try {
              const details = await votingContract.getElectionDetails(i);
              const status = Number(details.status);
              const startDate = new Date(Number(details.startDate) * 1000);
              const endDate = new Date(Number(details.endDate) * 1000);
              const now = new Date();

              // Use the same logic as your elections page
              if (status === 3) continue; // Skip cancelled elections

              if (status === 1 && now >= startDate && now <= endDate) {
                activeCount++;
              } else if (status === 0 && now < startDate) {
                upcomingCount++;
              } else if (status === 2 || (status === 1 && now > endDate)) {
                endedCount++;
              }

            } catch (err) {
              console.warn(`Error processing election ${i}:`, err);
            }
          }

          setAdminStats({ 
            active: activeCount, 
            ended: endedCount, 
            upcoming: upcomingCount, 
            totalVoters,
            total 
          });
        } catch (error) {
          console.error("Failed to fetch admin stats:", error);
        }
      }
    };

    if (userRole === 'voter') {
      fetchVoterStats();
    } else {
      fetchAdminStats();
    }
  }, [isConnected, account, votingContract, userRole]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const renderDashboardContent = () => {
    if (loading) {
      return <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading Dashboard...</p></div>;
    }
    if (!isConnected || !account) {
      return <Container className="text-center py-5"><Alert variant="info">Please connect your wallet to access the dashboard.</Alert></Container>;
    }
    switch (userRole) {
      case 'admin':
        return <AdminView stats={adminStats} />;
      case 'auditor':
        return <AuditorView stats={adminStats} />;
      default:
        return <VoterView stats={voterStats} />;
    }
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader role={userRole} account={account} onConnectWallet={handleConnectWallet} networkError={networkError} />
      {networkError && <Container className="my-4"><Alert variant="danger">{networkError}</Alert></Container>}
      {renderDashboardContent()}
    </div>
  );
}