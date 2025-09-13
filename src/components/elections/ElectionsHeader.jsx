import { Badge, Button, Alert, Spinner } from 'react-bootstrap';

const ElectionsHeader = ({ account, onConnectWallet, isConnecting, connectionError }) => {
  return (
    <div className="text-center mb-5">
      <h1 className="display-4 fw-bold text-primary">Elections</h1>
      <p className="lead mb-4">
        Participate in secure, transparent elections powered by blockchain technology.
      </p>
      
      {account ? (
        <Badge bg="success" className="fs-6 mb-3">
          Connected: {account.slice(0, 8)}...{account.slice(-6)}
        </Badge>
      ) : (
        <div>
          <p className="text-warning mb-3">Connect your wallet to participate in elections.</p>
          <Button 
            variant="primary" 
            onClick={onConnectWallet}
            disabled={isConnecting}
            className="mb-3"
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
        </div>
      )}

      {/* Connection Error Alert */}
      {connectionError && (
        <Alert variant="warning" className="mx-auto" style={{ maxWidth: '500px' }}>
          <small>{connectionError}</small>
        </Alert>
      )}
    </div>
  );
};

export default ElectionsHeader;