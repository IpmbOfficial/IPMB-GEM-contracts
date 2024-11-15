// SPDX-License-Identifier: MIT

/**
 *
 *  @title: GEM Minting
 *  @date: 06-November-2024
 *  @version: 1.6
 *  @author: IPMB Dev Team
 */

/**
 *
 * @title IERC20
 */

pragma solidity ^0.8.5;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title GEM Minting Smart Contract
 */

pragma solidity ^0.8.25;

import "./MerkleProof.sol";
import "./IPriceFeed.sol";
import "./IStaking.sol";
import "./Ownable.sol";
import "./IGEMNFT.sol";

contract GEMMinting is Ownable {

    // declaration of variables

    mapping(address => bool) public adminPermissions;
    address public burnAddr;
    address public ipmbAddress;
    IStaking public stakingAddress;
    IPriceFeed public priceFeedAddress;
    IGEMNFT public gemNFTAddress;
    mapping(bytes32 => bool) public mintedSt;
    mapping(uint256 => bytes32) public merkleRoots;
    uint256 premium1;
    uint256 premium2;
    uint256 premium3;

    // declaration of modifiers

    modifier adminRequired {
      require((adminPermissions[msg.sender] == true) || (msg.sender == owner()), "User is not an admin");
      _;
   }

    // constructor

    constructor(address _staking, address _ipmb, address _priceFeedAddress, address _gemNFTAddress) {
        adminPermissions[msg.sender] = true;
        stakingAddress = IStaking(_staking);
        ipmbAddress = _ipmb;
        priceFeedAddress = IPriceFeed(_priceFeedAddress);
        gemNFTAddress = IGEMNFT(_gemNFTAddress);
        burnAddr = 0x000000000000000000000000000000000000dEaD;
    }

    /*     
    * Mint GEM NFT
    */

    function mintGEMNFT(string memory _id, address _receiver, uint256 _poolID, uint256 _epoch, uint256 _index, bytes32[] calldata merkleProof) public payable {
        string memory id = _id;
        (, uint256 price, uint256 counter, uint256 supply, uint256 fee, bool status) = gemNFTAddress.retrieveCategoryData(id);
        require(msg.value == fee, "Fee error");
        require(stakingAddress.retrieveBlackListStatus(msg.sender) == false, "Address is blacklisted");
        require(gemNFTAddress.contractIsActive(), "Contract must be active to mint");
        require(status == true, "Data does not exist");
        require(counter < supply, "Supply Reached");
        validateDiscount(price, _poolID, msg.sender, _index, _epoch, merkleProof);
        gemNFTAddress.mintGEMNFTAUTH(id, _receiver);
    }

    /*     
    * Function to check Discount
    */

    function validateDiscount(uint256 price, uint256 poolID, address _sender, uint256 indx, uint256 epch, bytes32[] calldata merkleProof) internal {
        uint256 prc = price;
        uint256 plID = poolID;
        uint256 index = indx;
        address sender = _sender;
        if (stakingAddress.getDiscount(poolID, sender, indx) > 0) {
            require(stakingAddress.poolStatus(plID) == true, "Pool is inactive");
            // merkle root checks for specific epoch
            bytes32 node = keccak256(bytes.concat(keccak256((abi.encodePacked(sender , epch, poolID, indx)))));
            require(MerkleProof.verifyCalldata(merkleProof, merkleRoots[epch], node), 'invalid proof');
            require(mintedSt[node] == false, "already minted");
            mintedSt[node] = true;
            (uint256 ipmbPrice, uint256 goldPrice, , ,) = priceFeedAddress.getEpochPrices(epch);
            address resetAddr = sender;
            uint256 discountPrice;
            require(stakingAddress.poolAmountPerAddress(plID, sender, index) == price, "No deposit");
            if (goldPrice >= ipmbPrice) { // scenario A and B
                discountPrice = prc * stakingAddress.getDiscount(plID, sender, index) / 100;
                stakingAddress.updateAddressPool(resetAddr, plID, index);
                IERC20(ipmbAddress).transferFrom(address(stakingAddress), burnAddr, prc - discountPrice);
                IERC20(ipmbAddress).transferFrom(address(stakingAddress), sender, discountPrice);
            } else if (ipmbPrice > goldPrice) { // scenario C and D 
                uint256 dynPrice = prc * goldPrice / ipmbPrice;
                discountPrice = dynPrice - (dynPrice * stakingAddress.poolDiscount(plID) / 100);
                uint256 dynDiscount = prc - discountPrice;
                stakingAddress.updateAddressPool(resetAddr, plID, index);
                IERC20(ipmbAddress).transferFrom(address(stakingAddress), burnAddr, discountPrice);
                IERC20(ipmbAddress).transferFrom(address(stakingAddress), sender, dynDiscount);
            }
        } else { //  spot buy with current prices and premium
            (, uint256 ipmbPrice, , uint256 goldPrice, ,) = priceFeedAddress.getLatestPrices();
            uint256 dynPrice = price * goldPrice / ipmbPrice;
            uint256 premiumPrice = dynPrice + (dynPrice * getPremium(prc) / 10000);
            IERC20(ipmbAddress).transferFrom(sender, burnAddr, premiumPrice);
        }
    }

    /*     
    * Withdraw POL funds sent to the smart contract
    */

    function withdraw(address _to) public onlyOwner {
        uint balance = address(this).balance;
        payable(_to).transfer(balance);
    }

    /*     
    * Withdraw any ERC20 funds sent to the smart contract
    */

    function withdrawERC20(address _contractAddress, address _to) public onlyOwner {
        uint amount = IERC20(_contractAddress).balanceOf(address(this));
        IERC20(_contractAddress).transfer(_to, amount);             
    }

    /**
    * Set MerkleRoot per epoch
    */

    function setEpochMerkleRoot(uint256 _epoch, bytes32 _merkleRoot) public adminRequired {
        merkleRoots[_epoch] = _merkleRoot;
    }

    /**
    * Set IPMB Staking contract address
    */

    function setStakingAddress(address _staking) public onlyOwner {
        stakingAddress = IStaking(_staking);
    }

    /**
    * Set Update Prices Contract
    */

    function updatePricesContract(address _address) public onlyOwner {
        priceFeedAddress = IPriceFeed(_address);
    }

    /**
    * Function to register Admin
    */

    function registerAdmin(address _admin, bool _status) public onlyOwner {
        adminPermissions[_admin] = _status;
    }

    /**
    * Function to set premium
    */

    function setPremium(uint256 _premium1, uint256 _premium2, uint256 _premium3) public adminRequired {
        premium1 = _premium1;
        premium2 = _premium2;
        premium3 = _premium3;
    }

    /**
    * Function to get premium
    */

    function getPremium(uint256 _price) public view returns(uint256) {
        if (_price >= 1000000000000000000 && _price <= 1000000000000000000000) {
            return premium1;
        } else if (_price > 1000000000000000000000 && _price <= 5000000000000000000000) {
            return premium2;
        } else {
            return premium3;
        }
    }

    /**
    * Function to simulate prices and discount at a given epoch
    */

    function priceSimulation(uint256 _opt, string memory _id, uint256 _poolID, uint256 _epoch) public view returns (uint256, uint256) {
        (, uint256 price, , , , ) = gemNFTAddress.retrieveCategoryData(_id);
        if (_opt == 1) {
            uint256 polID = _poolID;
            (uint256 ipmbPrice, uint256 goldPrice , , ,) = priceFeedAddress.getEpochPrices(_epoch);
            uint256 discountPrice;
            if (goldPrice >= ipmbPrice) { // scenario A and B
                discountPrice = price * stakingAddress.poolDiscount(polID) / 100;
                return (price - discountPrice, discountPrice);
            } else if (ipmbPrice > goldPrice) { // scenario C and D 
                uint256 dynPrice = price * goldPrice / ipmbPrice;
                discountPrice = dynPrice - (dynPrice * stakingAddress.poolDiscount(polID) / 100);
                uint256 dynDiscount = price - discountPrice;
                return (discountPrice, dynDiscount);
            }
        } else { //  spot buy with current prices and premium
            (, uint256 ipmbPrice, , uint256 goldPrice, ,) = priceFeedAddress.getLatestPrices();
            uint256 dynPrice = price * goldPrice / ipmbPrice;
            uint256 premiumPrice = dynPrice + (dynPrice * getPremium(price) / 10000);
            return (premiumPrice, 0);
        }
    }

}