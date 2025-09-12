// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControl is Ownable {
    enum Role { Voter, Auditor, Admin }

    mapping(address => Role) public userRoles;
    address[] public admins;
    address[] public auditors;
    mapping(address => bool) public isAdminMap;
    mapping(address => bool) public isAuditorMap;
    mapping(address => uint256) public adminIndex;
    mapping(address => uint256) public auditorIndex;

    event RoleAssigned(address indexed user, Role role);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event AuditorAdded(address indexed auditor);
    event AuditorRemoved(address indexed auditor);

    // Hardcoded admin addresses
    address[] private hardcodedAdmins = [
        0xae428d52d40F4028Ff54D3de45643bEcE675b605
    ];

    // Hardcoded auditor address
    address[] private hardcodedAuditors = [
        0x9359c6a8aAA407923AaF421D92A8eeC48e7c8722
    ];

    constructor() Ownable(msg.sender) {
        // Set owner as admin
        userRoles[msg.sender] = Role.Admin;
        _addAdminToArray(msg.sender);
        emit RoleAssigned(msg.sender, Role.Admin);
        emit AdminAdded(msg.sender);

        // Initialize hardcoded admins
        for (uint256 i = 0; i < hardcodedAdmins.length; i++) {
            if (hardcodedAdmins[i] != address(0) && hardcodedAdmins[i] != msg.sender) {
                userRoles[hardcodedAdmins[i]] = Role.Admin;
                _addAdminToArray(hardcodedAdmins[i]);
                emit RoleAssigned(hardcodedAdmins[i], Role.Admin);
                emit AdminAdded(hardcodedAdmins[i]);
            }
        }

        // Initialize hardcoded auditors
        for (uint256 i = 0; i < hardcodedAuditors.length; i++) {
            if (hardcodedAuditors[i] != address(0)) {
                userRoles[hardcodedAuditors[i]] = Role.Auditor;
                _addAuditorToArray(hardcodedAuditors[i]);
                emit RoleAssigned(hardcodedAuditors[i], Role.Auditor);
                emit AuditorAdded(hardcodedAuditors[i]);
            }
        }
    }

    modifier onlyRole(Role _role) {
        require(userRoles[msg.sender] == _role, "Insufficient privileges");
        _;
    }

    modifier onlyAdminOrAuditor() {
        require(
            userRoles[msg.sender] == Role.Admin || userRoles[msg.sender] == Role.Auditor,
            "Requires admin or auditor role"
        );
        _;
    }

    function _addAdminToArray(address _admin) internal {
        if (!isAdminMap[_admin]) {
            admins.push(_admin);
            adminIndex[_admin] = admins.length; // Store 1-based index
            isAdminMap[_admin] = true;
        }
    }

    function _removeAdminFromArray(address _admin) internal {
        if (isAdminMap[_admin]) {
            uint256 index = adminIndex[_admin];
            require(index > 0, "Admin not found in array");
            
            // Convert to 0-based index
            uint256 arrayIndex = index - 1;
            
            // Swap with last element and update index
            if (arrayIndex < admins.length - 1) {
                address lastAdmin = admins[admins.length - 1];
                admins[arrayIndex] = lastAdmin;
                adminIndex[lastAdmin] = index;
            }
            
            admins.pop();
            delete adminIndex[_admin];
            isAdminMap[_admin] = false;
        }
    }

    function _addAuditorToArray(address _auditor) internal {
        if (!isAuditorMap[_auditor]) {
            auditors.push(_auditor);
            auditorIndex[_auditor] = auditors.length; // Store 1-based index
            isAuditorMap[_auditor] = true;
        }
    }

    function _removeAuditorFromArray(address _auditor) internal {
        if (isAuditorMap[_auditor]) {
            uint256 index = auditorIndex[_auditor];
            require(index > 0, "Auditor not found in array");
            
            // Convert to 0-based index
            uint256 arrayIndex = index - 1;
            
            // Swap with last element and update index
            if (arrayIndex < auditors.length - 1) {
                address lastAuditor = auditors[auditors.length - 1];
                auditors[arrayIndex] = lastAuditor;
                auditorIndex[lastAuditor] = index;
            }
            
            auditors.pop();
            delete auditorIndex[_auditor];
            isAuditorMap[_auditor] = false;
        }
    }

    function assignRole(address _user, Role _role) external onlyRole(Role.Admin) {
        require(_user != address(0), "Invalid address");
        
        // Check if trying to modify hardcoded addresses
        if (_isHardcodedAdmin(_user) && _role != Role.Admin) {
            revert("Cannot change role of hardcoded admin");
        }
        if (_isHardcodedAuditor(_user) && _role != Role.Auditor) {
            revert("Cannot change role of hardcoded auditor");
        }

        Role previousRole = userRoles[_user];
        
        // Remove from previous role arrays
        if (previousRole == Role.Admin) {
            _removeAdminFromArray(_user);
        } else if (previousRole == Role.Auditor) {
            _removeAuditorFromArray(_user);
        }
        
        userRoles[_user] = _role;
        
        // Add to new role array
        if (_role == Role.Admin) {
            _addAdminToArray(_user);
            emit AdminAdded(_user);
        } else if (_role == Role.Auditor) {
            _addAuditorToArray(_user);
            emit AuditorAdded(_user);
        }
        
        emit RoleAssigned(_user, _role);
    }

    function removeAdmin(address _admin) external onlyRole(Role.Admin) {
        require(userRoles[_admin] == Role.Admin, "Not an admin");
        require(_admin != owner(), "Cannot remove contract owner");
        
        // Check if it's a hardcoded admin
        if (_isHardcodedAdmin(_admin)) {
            revert("Cannot remove hardcoded admin");
        }
        
        userRoles[_admin] = Role.Voter;
        _removeAdminFromArray(_admin);
        emit AdminRemoved(_admin);
        emit RoleAssigned(_admin, Role.Voter);
    }

    function removeAuditor(address _auditor) external onlyRole(Role.Admin) {
        require(userRoles[_auditor] == Role.Auditor, "Not an auditor");
        
        // Check if it's a hardcoded auditor
        if (_isHardcodedAuditor(_auditor)) {
            revert("Cannot remove hardcoded auditor");
        }
        
        userRoles[_auditor] = Role.Voter;
        _removeAuditorFromArray(_auditor);
        emit AuditorRemoved(_auditor);
        emit RoleAssigned(_auditor, Role.Voter);
    }

    function batchAssignRoles(
        address[] calldata _users,
        Role[] calldata _roles
    ) external onlyRole(Role.Admin) {
        require(_users.length == _roles.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _users.length; i++) {
            _assignSingleRole(_users[i], _roles[i]);
        }
    }

    function _assignSingleRole(address _user, Role _role) internal {
        require(_user != address(0), "Invalid address");
        
        // Check if trying to modify hardcoded addresses
        if (_isHardcodedAdmin(_user) && _role != Role.Admin) {
            revert("Cannot change role of hardcoded admin");
        }
        if (_isHardcodedAuditor(_user) && _role != Role.Auditor) {
            revert("Cannot change role of hardcoded auditor");
        }

        Role previousRole = userRoles[_user];
        
        // Remove from previous role arrays
        if (previousRole == Role.Admin) {
            _removeAdminFromArray(_user);
        } else if (previousRole == Role.Auditor) {
            _removeAuditorFromArray(_user);
        }
        
        userRoles[_user] = _role;
        
        // Add to new role array
        if (_role == Role.Admin) {
            _addAdminToArray(_user);
            emit AdminAdded(_user);
        } else if (_role == Role.Auditor) {
            _addAuditorToArray(_user);
            emit AuditorAdded(_user);
        }
        
        emit RoleAssigned(_user, _role);
    }

    function batchRemoveAdmins(address[] calldata _admins) external onlyRole(Role.Admin) {
        for (uint256 i = 0; i < _admins.length; i++) {
            address admin = _admins[i];
            if (userRoles[admin] == Role.Admin) {
                require(admin != owner(), "Cannot remove contract owner");
                require(!_isHardcodedAdmin(admin), "Cannot remove hardcoded admin");
                
                userRoles[admin] = Role.Voter;
                _removeAdminFromArray(admin);
                
                emit AdminRemoved(admin);
                emit RoleAssigned(admin, Role.Voter);
            }
        }
    }

    function batchRemoveAuditors(address[] calldata _auditors) external onlyRole(Role.Admin) {
        for (uint256 i = 0; i < _auditors.length; i++) {
            address auditor = _auditors[i];
            if (userRoles[auditor] == Role.Auditor) {
                require(!_isHardcodedAuditor(auditor), "Cannot remove hardcoded auditor");
                
                userRoles[auditor] = Role.Voter;
                _removeAuditorFromArray(auditor);
                
                emit AuditorRemoved(auditor);
                emit RoleAssigned(auditor, Role.Voter);
            }
        }
    }

    function _isHardcodedAdmin(address _address) internal view returns (bool) {
        for (uint256 i = 0; i < hardcodedAdmins.length; i++) {
            if (_address == hardcodedAdmins[i]) {
                return true;
            }
        }
        return false;
    }

    function _isHardcodedAuditor(address _address) internal view returns (bool) {
        for (uint256 i = 0; i < hardcodedAuditors.length; i++) {
            if (_address == hardcodedAuditors[i]) {
                return true;
            }
        }
        return false;
    }

    function getAdmins() external view returns (address[] memory) {
        return admins;
    }

    function getAuditors() external view returns (address[] memory) {
        return auditors;
    }

    function getAdminCount() external view returns (uint256) {
        return admins.length;
    }

    function getAuditorCount() external view returns (uint256) {
        return auditors.length;
    }

    function isAdmin(address _address) external view returns (bool) {
        return isAdminMap[_address];
    }

    function isAuditor(address _address) external view returns (bool) {
        return isAuditorMap[_address];
    }

    function isHardcodedAdmin(address _address) external view returns (bool) {
        return _isHardcodedAdmin(_address);
    }

    function isHardcodedAuditor(address _address) external view returns (bool) {
        return _isHardcodedAuditor(_address);
    }

    function getHardcodedAdmins() external view returns (address[] memory) {
        return hardcodedAdmins;
    }

    function getHardcodedAuditors() external view returns (address[] memory) {
        return hardcodedAuditors;
    }

    function getRole(address _address) external view returns (Role) {
        return userRoles[_address];
    }

    function hasRole(address _address, Role _role) external view returns (bool) {
        return userRoles[_address] == _role;
    }

    function getAdminAtIndex(uint256 _index) external view returns (address) {
        require(_index < admins.length, "Index out of bounds");
        return admins[_index];
    }

    function getAuditorAtIndex(uint256 _index) external view returns (address) {
        require(_index < auditors.length, "Index out of bounds");
        return auditors[_index];
    }

    function getAdminIndex(address _admin) external view returns (uint256) {
        require(isAdminMap[_admin], "Not an admin");
        return adminIndex[_admin] - 1; // Return 0-based index
    }

    function getAuditorIndex(address _auditor) external view returns (uint256) {
        require(isAuditorMap[_auditor], "Not an auditor");
        return auditorIndex[_auditor] - 1; // Return 0-based index
    }
}