import Web3 from 'web3';
import { FomoGame } from '../../types/FomoGame';
export declare class FomoGameWrapper {
    web3: Web3;
    contract: FomoGame;
    address: string;
    constructor(web3: Web3);
    get isDeployed(): boolean;
    play(fromAddress: string): Promise<import("web3-core").TransactionReceipt>;
    pool(): Promise<string>;
    deploy(fromAddress: string): Promise<void>;
    useDeployed(contractAddress: string): void;
}
