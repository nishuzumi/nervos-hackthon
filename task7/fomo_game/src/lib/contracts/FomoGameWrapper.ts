import Web3 from 'web3';
import * as FomoGameJSON from '../../../build/contracts/FomoGame.json';
import { FomoGame } from '../../types/FomoGame';

const DEFAULT_SEND_OPTIONS = {
    gas: 12500000
};

export class FomoGameWrapper {
    web3: Web3;

    contract: FomoGame;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(FomoGameJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async play(fromAddress: string) {
        const data = await this.contract.methods
            .play()
            .send({ from: fromAddress, value: (10n ** 8n).toString(), ...DEFAULT_SEND_OPTIONS });

        return data;
    }

    pool() {
        return this.contract.methods.pool().call();
    }

    async deploy(fromAddress: string) {
        const contract = await (this.contract
            .deploy({
                data: FomoGameJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(contract.contractAddress);
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
