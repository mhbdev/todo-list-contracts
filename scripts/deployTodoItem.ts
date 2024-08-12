import { toNano } from '@ton/core';
import { TodoItem } from '../wrappers/TodoItem';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const todoItem = provider.open(TodoItem.createFromConfig({}, await compile('TodoItem')));

    await todoItem.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(todoItem.address);

    // run methods on `todoItem`
}
