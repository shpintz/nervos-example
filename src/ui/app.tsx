/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';

import { ZombieFactoryWrapper } from '../lib/contracts/ZombieFactoryWrapper';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const web3 = new Web3((window as any).ethereum);

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
    const [contract, setContract] = useState<ZombieFactoryWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [balance, setBalance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);


    // Zombie config
    const [urlName,setUrlName] = useState('');
    const [zombieName,setZombieName] = useState('');
    const [listZombies, setListZombies] = useState([]);

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

     // Grab list of zombies
     useEffect(() => {
        if (contract) {
            setInterval(() => {
                contract.getListZombies(account).then(setListZombies);
            }, 10000);
        }
    }, [contract]);

    async function deployContract() {
        const _contract = new ZombieFactoryWrapper(web3);

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


    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new ZombieFactoryWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    // Create Zombie Function
    async function createRandomZombie() {
        try {
            setTransactionInProgress(true);
            await contract.createRandomZombie(zombieName, urlName, account);

            toast(
                'Successfully Created Zombie.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error('Fail to create Zombie');
        } finally {
            setTransactionInProgress(false);
        }
    }

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

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>

            <header>
                <p>Your ETH address: <b>{accounts?.[0]}</b></p>
                <p>Balance: <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} ETH</b></p>
                <p>Deployed contract address: <b>{contract?.address || '-'}</b></p> 
            </header>
            
        
            <div className="section-one">
                <p>
                    The button below will deploy a ZombieFactory smart contract where you can store a
                    zombie. Basically like a little home hahah. After the contract is deployed you can either
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
            </div>

           
            <div className="section-two">
                <h3> Zombie NFT Factory 1.0</h3>
                <input
                    type="string"
                    placeholder="Enter Zombie url"
                    onChange={e => setUrlName(e.target.value)}
                />
                <input
                    type="string"
                    placeholder="Zombie Name"
                    onChange={e => setZombieName(e.target.value)}
                />
                 

                <button onClick={createRandomZombie} disabled={!contract}>  
                    Create Zombie
                </button>
                <br />

                <div className="zombieFactory">
                    <h3> Zombies Gallery</h3>
                    <div className="zombies">
                        {listZombies.map(data => { 
                            return (
                                <div className="singleZombie">
                                    <img key={data[0]} src={data[1]} style={{ width: 200, height: 200, border: '2px solid black' , borderRadius:10 }} />
                                    <div className="content">
                                        <p>Level:{data[3]} </p>
                                        <p>DNA: {data[2]}</p>
                                        <p>Name:{data[0]} </p>
                                    </div>
                                </div>

                            )
                        })} 
                    </div>
                </div>
            </div>




            <br />
                <p>Smile things will be done shortly</p>
            <br />
            <br />
            <br />
            <hr />
            <ToastContainer />
        </div>
    );
}
