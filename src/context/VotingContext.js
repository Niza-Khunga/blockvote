"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import VotingABI from "../contracts/Voting.json";
import ResultsABI from "../contracts/Results.json";

const VotingContext = createContext();

export const VotingProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [resultsContract, setResultsContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [contractValidated, setContractValidated] = useState(false);
  const [adminAddresses, setAdminAddresses] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Contract addresses
  const VOTING_CONTRACT_ADDRESS = "0xFa881C8953654dC867C087F5f8f3269cb702a580";
  const RESULTS_CONTRACT_ADDRESS = "0x334Fc2CEc5821D9071A42eA9f52807792d058058";

  // Add getBalance function
  const getBalance = async (userAddress = account) => {
    if (!provider || !userAddress) {
      return "0";
    }

    try {
      const balance = await provider.getBalance(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  };

  // Check if MetaMask is already processing a request
  const isMetaMaskProcessing = () => {
    return (
      window.ethereum &&
      (window.ethereum._state?.isProcessing ||
        window.ethereum._metamask?.isUnlocked === false)
    );
  };

  const connectWallet = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      throw new Error("Connection already in progress. Please wait.");
    }

    if (isMetaMaskProcessing()) {
      throw new Error(
        "MetaMask is busy. Please check your MetaMask window and try again."
      );
    }

    setIsConnecting(true);
    setConnectionError(null);
    setNetworkError(null);

    try {
      console.log("Attempting wallet connection...");
      console.log("MetaMask available:", !!window.ethereum);

      let ethersProvider;
      let ethersSigner;

      if (
        typeof window !== "undefined" &&
        typeof window.ethereum !== "undefined"
      ) {
        try {
          // Check if we need to request accounts or if they're already available
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });

          if (accounts.length === 0) {
            // Only request accounts if none are available
            await window.ethereum.request({
              method: "eth_requestAccounts",
            });
          }

          ethersProvider = new ethers.BrowserProvider(window.ethereum);
          ethersSigner = await ethersProvider.getSigner();
        } catch (error) {
          if (error.code === 4001) {
            throw new Error("Connection rejected by user");
          } else if (error.code === -32002) {
            throw new Error(
              "MetaMask is already processing a connection request. Please check your MetaMask window."
            );
          } else {
            throw new Error("MetaMask connection failed: " + error.message);
          }
        }
      } else {
        try {
          ethersProvider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length === 0) {
            throw new Error("No accounts found in local node");
          }
          ethersSigner = await ethersProvider.getSigner(accounts[0].address);
        } catch (error) {
          throw new Error("Local node connection failed: " + error.message);
        }
      }

      const network = await ethersProvider.getNetwork();
      if (network.chainId !== 1337n && network.chainId !== 31337n) {
        setNetworkError(
          "Please connect to localhost network (chainId: 1337 or 31337)"
        );
        throw new Error("Wrong network");
      }

      const votingContractInstance = new ethers.Contract(
        VOTING_CONTRACT_ADDRESS,
        VotingABI.abi,
        ethersSigner
      );

      const resultsContractInstance = new ethers.Contract(
        RESULTS_CONTRACT_ADDRESS,
        ResultsABI.abi,
        ethersSigner
      );

      // Test contract connection
      try {
        await votingContractInstance.getElectionCount();
        setContractValidated(true);
      } catch (error) {
        console.error("Voting contract test failed:", error);
        setNetworkError(
          "Contract connection failed. Make sure contracts are deployed on localhost."
        );
        throw new Error("Contract validation failed");
      }

      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setVotingContract(votingContractInstance);
      setResultsContract(resultsContractInstance);
      const connectedAccount = await ethersSigner.getAddress();
      setAccount(connectedAccount);
      setIsConnected(true);

      // Check admin status after connection
      await checkAdminStatus(votingContractInstance, connectedAccount);
      await getAdminAddresses(votingContractInstance);

      console.log("Wallet connected successfully:", connectedAccount);
      return connectedAccount;
    } catch (error) {
      console.error("Error in connectWallet:", error);

      let errorMessage = error.message || "Failed to connect wallet";

      if (error.code === 4001) {
        errorMessage = "Connection rejected by user";
      } else if (error.code === -32002) {
        errorMessage = "MetaMask is busy. Please check your MetaMask window.";
      } else if (error.message.includes("already processing")) {
        errorMessage = "MetaMask is processing another request. Please wait.";
      }

      setConnectionError(errorMessage);
      setNetworkError(errorMessage);
      setIsConnected(false);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const checkAdminStatus = async (
    contractInstance = votingContract,
    userAccount = account
  ) => {
    if (!contractInstance || !userAccount || !isConnected) {
      setIsAdmin(false);
      return false;
    }

    try {
      const isAdminResult = await contractInstance.isAdmin(userAccount);
      setIsAdmin(isAdminResult);
      return isAdminResult;
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      return false;
    }
  };

  const getAdminAddresses = async (contractInstance = votingContract) => {
    if (!contractInstance) return [];

    try {
      const addresses = await contractInstance.getAdmins();
      setAdminAddresses(addresses);
      return addresses;
    } catch (error) {
      console.error("Error getting admin addresses:", error);
      return [];
    }
  };

  const validateContract = async () => {
    try {
      if (votingContract && isConnected) {
        await votingContract.getElectionCount();
        setContractValidated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Contract validation failed:", error);
      setContractValidated(false);
      return false;
    }
  };

  const isAuditor = async () => {
    if (!votingContract || !account || !isConnected) {
      return false;
    }

    try {
      return await votingContract.isAuditor(account);
    } catch (error) {
      console.error("Error checking auditor status:", error);
      return false;
    }
  };

  // Check initial connection on mount
  const checkInitialConnection = useCallback(async () => {
    if (
      typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined"
    ) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0 && !isConnected) {
          console.log("Auto-connecting to existing account...");
          await connectWallet();
        }
      } catch (error) {
        console.log("Auto-connect check failed:", error);
      }
    }
  }, [connectWallet, isConnected]);

  // Contract validation effect
  useEffect(() => {
    const validate = async () => {
      if (votingContract && isConnected) {
        await validateContract();
        await checkAdminStatus();
        await getAdminAddresses();
      }
    };
    validate();
  }, [votingContract, isConnected]);

  // Wallet event listeners
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined"
    ) {
      const handleAccountsChanged = async (accounts) => {
        try {
          if (accounts.length === 0) {
            // User disconnected their wallet
            setSigner(null);
            setProvider(null);
            setVotingContract(null);
            setResultsContract(null);
            setIsConnected(false);
            setAccount(null);
            setContractValidated(false);
            setAdminAddresses([]);
            setIsAdmin(false);
          } else if (accounts[0] !== account) {
            // Account changed
            setAccount(accounts[0]);
            if (provider) {
              const newSigner = await provider.getSigner();
              setSigner(newSigner);

              const newVotingContract = new ethers.Contract(
                VOTING_CONTRACT_ADDRESS,
                VotingABI.abi,
                newSigner
              );

              const newResultsContract = new ethers.Contract(
                RESULTS_CONTRACT_ADDRESS,
                ResultsABI.abi,
                newSigner
              );

              setVotingContract(newVotingContract);
              setResultsContract(newResultsContract);
              setIsConnected(true);

              await validateContract();
              await checkAdminStatus(newVotingContract, accounts[0]);
              await getAdminAddresses(newVotingContract);
            }
          }
        } catch (error) {
          console.error("Error in accountsChanged handler:", error);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [provider, account, isConnected]);

  // Auto-connect on component mount
  useEffect(() => {
    checkInitialConnection();
  }, [checkInitialConnection]);

  return (
    <VotingContext.Provider
      value={{
        // Core connection state
        provider,
        signer,
        votingContract,
        resultsContract,
        account,
        isConnected,
        contractValidated,
        networkError,
        isAdmin,
        adminAddresses,
        isConnecting,
        connectionError,

        // Contract addresses
        VOTING_CONTRACT_ADDRESS,
        RESULTS_CONTRACT_ADDRESS,

        // Connection functions
        connectWallet,
        validateContract,

        // Role checking functions
        checkAdminStatus,
        getAdminAddresses,
        isAuditor,

        // Balance function
        getBalance,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};

export const useVotingContext = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error("useVotingContext must be used within a VotingProvider");
  }
  return context;
};
