import {Blockchain, printTransactionFees, SandboxContract, TreasuryContract} from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { TodoList } from '../wrappers/TodoList';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import {TodoItem} from "../wrappers/TodoItem";

describe('TodoList', () => {
    let code: Cell;
    let itemCode: Cell;

    beforeAll(async () => {
        code = await compile('TodoList');
        itemCode = await compile('TodoItem');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let todoList: SandboxContract<TodoList>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        todoList = blockchain.openContract(TodoList.createFromConfig({
            content: 'My First List',
            creationDate: new Date(Date.now()),
            owner: deployer.address,
            itemCode: itemCode,
        }, code));

        const deployResult = await todoList.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: todoList.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and todoList are ready to use
    });

    it('should create new item in the list', async () => {
        const itemContent = "First Item";

        const invalidSender = await blockchain.treasury('invalid-sender');
        const ignoreWithInvalidSender = await todoList.sendCreateNewItem(invalidSender.getSender(), toNano('0.05'), itemContent);
        expect(ignoreWithInvalidSender.transactions).toHaveTransaction({
            from: invalidSender.address,
            to: todoList.address,
            exitCode: 401,
        });

        expect((await todoList.getStorageData()).nextItemIndex).toEqual(0n);

        const res = await todoList.sendCreateNewItem(deployer.getSender(), toNano('0.05'), itemContent);

        const itemAddress = await todoList.getItemByIndex(0n);

        expect(res.transactions).toHaveTransaction({
            from: todoList.address,
            to: itemAddress,
            success: true,
            deploy: true,
        });

        expect((await todoList.getStorageData()).nextItemIndex).toEqual(1n);

        const itemContract = blockchain.openContract(TodoItem.createFromAddress(itemAddress));
        const itemStorageData = await itemContract.getStorageData();

        expect(itemStorageData.init).toEqual(true);
        expect(itemStorageData.index).toEqual(0n);
        expect(itemStorageData.listAddress).toEqualAddress(todoList.address);
        expect(itemStorageData.owner).toEqualAddress(deployer.address);
        expect(itemStorageData.content).toEqual(itemContent);
    });
});
