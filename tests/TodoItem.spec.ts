import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { TodoItem } from '../wrappers/TodoItem';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('TodoItem', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TodoItem');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let todoItem: SandboxContract<TodoItem>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        todoItem = blockchain.openContract(TodoItem.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await todoItem.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: todoItem.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and todoItem are ready to use
    });
});
