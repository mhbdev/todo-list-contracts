import { toNano } from '@ton/core';
import { TodoList } from '../wrappers/TodoList';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const todoList = provider.open(TodoList.createFromConfig({}, await compile('TodoList')));

    await todoList.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(todoList.address);

    // run methods on `todoList`
}
