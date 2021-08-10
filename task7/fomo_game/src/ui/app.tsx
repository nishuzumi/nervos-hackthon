/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import { AddressTranslator } from 'nervos-godwoken-integration';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { CONFIG } from '../config';

import { FomoGameWrapper } from '../lib/contracts/FomoGameWrapper';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };
        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<FomoGameWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [polyAddress, setPolyAddress] = useState<string>();
    const [balance, setBalance] = useState<bigint>();
    const [pool, setPool] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [win, setWin] = useState<boolean | undefined>();
    const [round, setRound] = useState<boolean>(false);
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    useEffect(() => {
        if (account && account.length > 0) {
            const addressTranslator = new AddressTranslator();
            setPolyAddress(addressTranslator.ethAddressToGodwokenShortAddress(account));
        }
    }, [account]);

    async function deployContract() {
        const _contract = new FomoGameWrapper(web3);

        try {
            setTransactionInProgress(true);

            await _contract.deploy(account);

            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function playGame() {
        try {
            setTransactionInProgress(true);
            const result = await contract.play(account);
            if (result.events?.NewWinner) {
                setWin(true);
            } else {
                setWin(false);
            }
            setRound(oldRound => !oldRound);
            toast('Successfully.', { type: 'success' });
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }
    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new FomoGameWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setWin(undefined);
    }

    useEffect(() => {
        if (!contract) return;
        contract.pool().then(v => {
            setPool(BigInt(v));
        });
    }, [round, contract]);

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setBalance(_l2Balance);
            }
        })();
    });

    useEffect(() => {
        if (!web3) {
            return;
        }
        (async () => {
            const _web3 = web3;

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setBalance(_l2Balance);
            }
        })();
    }, [round]);

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Poly address: <b>{polyAddress ?? ''}</b>
            <br />
            <br />
            Balance: <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} ETH</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            <br />
            <br />
            Current pool balance: <b>{pool ? (pool / 10n ** 8n).toString() : '0'}</b> <br />
            <br />
            <hr />
            <p>
                The button below will deploy a SimpleStorage smart contract where you can store a
                number value. By default the initial stored value is equal to 123 (you can change
                that in the Solidity smart contract). After the contract is deployed you can either
                read stored value from smart contract or set a new one. You can do that using the
                interface below.
            </p>
            <button onClick={deployContract} disabled={!balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <hr />
            <p>
                You need pay 1 ether to play the game.If you win, you will get the balance of the
                pool. else you will get nothing.
                <br />
                PS:we will receive 10% fee.
            </p>
            <>Last Play Status: {win ? 'WIN' : 'LOST'}</>
            <br />
            <br />
            <br />
            <button onClick={playGame} disabled={!contract}>
                Play
            </button>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <hr />
            <ToastContainer />
        </div>
    );
}
