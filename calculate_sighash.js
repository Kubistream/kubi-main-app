const ethers = require('ethers');

const abi = [
    "function donate(address addressSupporter, address tokenIn, uint256 amount, address streamer, uint256 amountOutMin, uint256 deadline)",
    "function setGlobalWhitelist(address token, bool allowed)",
    "function setPrimaryToken(address streamer, address token)",
    "function setStreamerWhitelist(address streamer, address token, bool allowed)",
    "function setStreamerYieldContract(address streamer, address yieldContract)",
    "function setStreamerActiveYield(address streamer, address yieldContract)",
    "function removeStreamerYieldContract(address streamer, address yieldContract)"
];

const errors = [
    "error DeadlineExpired()",
    "error FeeTooHigh()",
    "error NoDirectETH()",
    "error NoPairFound()",
    "error NotInGlobalWhitelist()",
    "error NotInStreamerWhitelist()",
    "error OnlyOwner()",
    "error OnlyOwnerOrSuper()",
    "error OnlyStreamerOrSuper()",
    "error PrimaryNotInGlobal()",
    "error PrimaryNotSet()",
    "error SendETHFailed()",
    "error SendFeeFailed()",
    "error YieldContractNotWhitelisted()",
    "error YieldMintBelowMin()",
    "error YieldMintZero()",
    "error YieldNotConfigured()",
    "error YieldUnderlyingMismatch()",
    "error YieldUnderlyingNotInGlobal()",
    "error YieldUnderlyingZero()",
    "error ZeroAddress()",
    "error ZeroAmount()"
];

abi.forEach(sig => {
    const id = ethers.id(sig.replace('function ', '')).slice(0, 10);
    console.log(`${id} : ${sig}`);
});

errors.forEach(sig => {
    const id = ethers.id(sig.replace('error ', '')).slice(0, 10);
    console.log(`${id} : ${sig}`);
})
