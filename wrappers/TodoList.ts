import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode} from '@ton/core';

export type TodoListConfig = {
    nextItemIndex?: bigint;
    owner: Address;
    creationDate: Date;
    content: string;
    itemCode: Cell;
};

export function todoListConfigToCell(config: TodoListConfig): Cell {
    return beginCell()
        .storeUint(config.nextItemIndex ?? 0n, 64)
        .storeAddress(config.owner)
        .storeRef(
            beginCell()
                .storeRef(beginCell().storeBuffer(Buffer.from(config.content, "utf8")).endCell())
                .storeUint(Math.floor(config.creationDate.getTime() / 1000), 32)
                .endCell()
        )
        .storeRef(config.itemCode)
        .endCell();
}

export class TodoList implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TodoList(address);
    }

    static createFromConfig(config: TodoListConfig, code: Cell, workchain = 0) {
        const data = todoListConfigToCell(config);
        const init = {code, data};
        return new TodoList(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreateNewItem(provider: ContractProvider, via: Sender, value: bigint, content: string) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32) // opCode
                .storeRef(
                    beginCell()
                        .storeBuffer(Buffer.from(content, 'utf8'))
                        .endCell()
                )
                .endCell(),
        });
    }

    async getItemByIndex(provider: ContractProvider, index: bigint) {
        const result = await provider.get('get_item_address_by_index', [
            {
                type: 'int',
                value: index,
            }
        ]);

        return result.stack.readAddress();
    }

    async getStorageData(provider: ContractProvider) {
        const result = await provider.get('get_storage_data', []);
        return {
            nextItemIndex: result.stack.readBigNumber(),
            owner: result.stack.readAddress(),
            itemCode: result.stack.readCell(),
        }
    }
}
