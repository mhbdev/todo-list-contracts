import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type TodoItemConfig = {};

export function todoItemConfigToCell(config: TodoItemConfig): Cell {
    return beginCell().endCell();
}

export class TodoItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new TodoItem(address);
    }

    static createFromConfig(config: TodoItemConfig, code: Cell, workchain = 0) {
        const data = todoItemConfigToCell(config);
        const init = { code, data };
        return new TodoItem(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getStorageData(provider: ContractProvider) {
        const result = await provider.get('get_storage_data', []);
        return {
            init: result.stack.readBooleanOpt(),
            index: result.stack.readBigNumber(),
            listAddress: result.stack.readAddress(),
            owner: result.stack.readAddress(),
            content: result.stack.readCell().beginParse().loadStringTail(),
        }
    }
}
